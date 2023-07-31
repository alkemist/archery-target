import {DatastoreService} from "./datastore.service";
import {inject, Injectable} from "@angular/core";
import {StatisticModel, StatisticStoredInterface} from "@models";
import {Select, Store} from "@ngxs/store";
import {LoggerService} from "./logger.service";
import {ActivatedRouteSnapshot, ResolveFn} from "@angular/router";
import {MessageService} from "primeng/api";
import {Observable} from "rxjs";
import {
    AddStatistic,
    FillStatistics,
    InvalideStatistics,
    RemoveStatistic,
    StatisticState,
    UpdateStatistic
} from "@stores";
import {ArrayHelper, DateHelper, MathHelper} from "@tools";
import {ShootingService} from "./shooting.service";

export interface StatisticsData {
    statistics: Map<number, Map<number, Map<number, StatisticModel>>>
    distances: number[]
    targets: number[]
    dates: number[]
}

@Injectable({
    providedIn: 'root'
})
export class StatisticService extends DatastoreService<StatisticStoredInterface, StatisticModel> {
    @Select(StatisticState.lastUpdated) override lastUpdated$?: Observable<Date>;
    // Données du store
    @Select(StatisticState.all) protected override all$?: Observable<StatisticStoredInterface[]>;

    constructor(messageService: MessageService,
                protected override loggerService: LoggerService,
                protected shootingService: ShootingService,
                store: Store) {
        super(messageService, loggerService, 'statistic', $localize`statistic`, StatisticModel, store,
            AddStatistic, UpdateStatistic, RemoveStatistic, FillStatistics, InvalideStatistics);
    }

    async getByDistanceTargetDate(distance: number, target: number, dateStr: string) {
        const statistics = (await this.getListOrRefresh())
            .filter(statistic =>
                statistic.distance === distance
                && statistic.target === target
                && statistic.name === dateStr
            )
        if (statistics.length === 0) return null;

        return ArrayHelper.sortBy(statistics, 'dateSeconds', -1)[0];
    }

    async getStatistics(): Promise<StatisticsData | null> {
        const map = new Map<number, Map<number, string>>();

        const lastShooting = await this.shootingService.last('dateSeconds');

        if (lastShooting) {
            return await this.calculStatistics(lastShooting.dateSeconds);
        }
        return null;
    }

    async calculStatistics(dateSeconds: number): Promise<StatisticsData> {
        const distances: number[] = [], targets: number[] = [], dates: number[] = [];
        const statsByDistanceTargetDate = new Map<number, Map<number, Map<number, StatisticModel>>>;

        let lastStatistic = await this.last('dateSeconds');

        const shootings = await (lastStatistic
                ? this.shootingService.listAfterDate(DateHelper.reset(new Date(lastStatistic?.dateSeconds ?? 0)).getTime())
                : this.shootingService.getListOrRefresh()
        );

        for await (const shooting of shootings) {
            const distance = shooting.distance as number;
            const target = shooting.target as number;
            const dateSeconds = DateHelper.reset(new Date(shooting.dateSeconds)).getTime();

            let byDistance = statsByDistanceTargetDate.get(distance);
            if (!byDistance) {
                byDistance = new Map<number, Map<number, StatisticModel>>();
                statsByDistanceTargetDate.set(distance, byDistance);
            }

            let byTarget = byDistance.get(target);
            if (!byTarget) {
                byTarget = new Map<number, StatisticModel>();
                byDistance.set(target, byTarget);
            }

            let statistic = byTarget.get(dateSeconds) ?? null;
            if (!statistic) {
                statistic = new StatisticModel({
                    target,
                    distance,
                    dateSeconds,
                });

                byTarget.set(dateSeconds, statistic);
            }

            statistic.arrows += shooting.arrows.length;
            statistic.totalScore += shooting.score;

            if (shooting.groupingScore) {
                statistic.totalGroup += shooting.groupingScore ?? 0;
                statistic.countGroup++;
            }
        }

        for await (const [distance, byDistance] of statsByDistanceTargetDate) {
            distances.push(distance);

            for await (const [target, byTarget] of byDistance) {
                if (targets.indexOf(target) === -1) {
                    targets.push(target);
                }

                for await (const [date, statistic] of byTarget) {
                    if (dates.indexOf(date) === -1) {
                        dates.push(date);
                    }

                    const shootingCount = MathHelper.round(
                        statistic.arrows / 36
                    );

                    statistic.averageScore = MathHelper.round(
                        statistic.totalScore / shootingCount, 0
                    );

                    statistic.averageGroup = MathHelper.round(
                        statistic.totalGroup / statistic.countGroup, 0
                    );

                    statistic.averageArrow = MathHelper.round(
                        statistic.totalScore / statistic.arrows, 1
                    );

                    let currentStatistic =
                        await this.getByDistanceTargetDate(distance, target, statistic.name);

                    if (!currentStatistic) {
                        //console.log(`[${distance} - ${target} - ${date}]`, 'Add', statistic)
                        await this.add(statistic);
                    } else if (currentStatistic.arrows !== statistic.arrows) {
                        const statisticUpdated = new StatisticModel({
                            id: currentStatistic.id,
                            ...statistic.toFirestore(),
                        });

                        //console.log(`[${distance} - ${target} - ${date}]`, 'Update', statisticUpdated, currentStatistic);
                        await this.update(statisticUpdated);
                    } else {
                        //console.log(`[${distance} - ${target} - ${date}]`, 'Nothing', statistic, currentStatistic)
                    }
                }
            }
        }

        (await this.getListOrRefresh()).forEach((statistic) => {
            const distance = statistic.distance as number;
            const target = statistic.target as number;
            const dateSeconds = statistic.dateSeconds;

            let byDistance = statsByDistanceTargetDate.get(distance);
            if (!byDistance) {
                byDistance = new Map<number, Map<number, StatisticModel>>();
                statsByDistanceTargetDate.set(distance, byDistance);

                if (distances.indexOf(distance) === -1) {
                    distances.push(distance);
                }
            }

            let byTarget = byDistance.get(target);
            if (!byTarget) {
                byTarget = new Map<number, StatisticModel>();
                byDistance.set(target, byTarget);

                if (targets.indexOf(target) === -1) {
                    targets.push(target);
                }
            }

            let currentStatistic = byTarget.get(dateSeconds) ?? null;
            if (!currentStatistic) {
                byTarget.set(dateSeconds, statistic);

                if (dates.indexOf(dateSeconds) === -1) {
                    dates.push(dateSeconds);
                }
            }
        })

        return {
            statistics: statsByDistanceTargetDate,
            distances,
            targets,
            dates: ArrayHelper.sort(dates),
        };
    }
}

export const statisticResolver: ResolveFn<StatisticModel | undefined> =
    (route: ActivatedRouteSnapshot) => {
        return inject(StatisticService).getById(route.paramMap.get('id')!);
    };
