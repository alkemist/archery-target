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
import {ScoreCalculator} from "../models/archery/score-calculator";

export interface StatisticsData {
    statistics: Map<number, Map<number, StatisticModel>>;
    distances: number[];
    dates: number[];
}

@Injectable({
    providedIn: 'root'
})
export class StatisticService extends DatastoreService<StatisticStoredInterface, StatisticModel> {
    static DEFAULT_TARGET = 80;
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

    async getByDistanceTargetDate(distance: number, dateStr: string) {
        const statistics = (await this.getListOrRefresh())
            .filter(statistic =>
                statistic.distance === distance
                && statistic.name === dateStr
            )
        if (statistics.length === 0) return null;

        return ArrayHelper.sortBy(statistics, 'dateSeconds', -1)[0];
    }

    async getStatistics(): Promise<StatisticsData | null> {
        const lastShooting = await this.shootingService.last('dateSeconds');

        if (lastShooting) {
            return await this.calculStatistics();
        }
        return null;
    }

    async calculStatistics(): Promise<StatisticsData> {
        const distances: number[] = [], dates: number[] = [];
        const statsByDistanceTargetDate = new Map<number, Map<number, StatisticModel>>;

        let lastStatistic = await this.last('dateSeconds');

        const shootings = await (lastStatistic
                ? this.shootingService.listAfterDate(DateHelper.reset(new Date(lastStatistic?.dateSeconds ?? 0)).getTime())
                : this.shootingService.getListOrRefresh()
        );

        for await (const shooting of shootings) {
            const distance = shooting.distance as number;
            const dateSeconds = DateHelper.reset(new Date(shooting.dateSeconds)).getTime();

            const scoreCaulculator = new ScoreCalculator(
                undefined,
                undefined,
                shooting.distance as number,
                shooting.target as number
            );

            let byDistance = statsByDistanceTargetDate.get(distance);
            if (!byDistance) {
                byDistance = new Map<number, StatisticModel>();
                statsByDistanceTargetDate.set(distance, byDistance);
            }

            let statistic = byDistance.get(dateSeconds) ?? null;
            if (!statistic) {
                statistic = new StatisticModel({
                    distance,
                    dateSeconds,
                });

                byDistance.set(dateSeconds, statistic);
            }

            statistic.arrows += shooting.arrows.length;
            statistic.totalScore += scoreCaulculator.calculStatisticScore(shooting);

            if (shooting.groupingScore) {
                statistic.totalGroup += shooting.groupingScore ?? 0;
                statistic.countGroup++;
            }
        }

        for await (const [distance, byDistance] of statsByDistanceTargetDate) {
            distances.push(distance);

            for await (const [date, statistic] of byDistance) {
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
                    await this.getByDistanceTargetDate(distance, statistic.name);

                if (!currentStatistic) {
                    //console.log(`[${distance} - ${date}]`, 'Add', statistic)
                    await this.add(statistic);
                } else if (currentStatistic.arrows !== statistic.arrows) {
                    const statisticUpdated = new StatisticModel({
                        id: currentStatistic.id,
                        ...statistic.toFirestore(),
                    });

                    //console.log(`[${distance} - ${date}]`, 'Update', statisticUpdated, currentStatistic);
                    await this.update(statisticUpdated);
                }
            }
        }

        (await this.getListOrRefresh()).forEach((statistic) => {
            const distance = statistic.distance as number;
            const dateSeconds = statistic.dateSeconds;

            let byDistance = statsByDistanceTargetDate.get(distance);
            if (!byDistance) {
                byDistance = new Map<number, StatisticModel>();
                statsByDistanceTargetDate.set(distance, byDistance);

                if (distances.indexOf(distance) === -1) {
                    distances.push(distance);
                }
            }

            let currentStatistic = byDistance.get(dateSeconds) ?? null;
            if (!currentStatistic) {
                byDistance.set(dateSeconds, statistic);

                if (dates.indexOf(dateSeconds) === -1) {
                    dates.push(dateSeconds);
                }
            }
        })

        return {
            statistics: statsByDistanceTargetDate,
            distances,
            dates: ArrayHelper.sort(dates),
        };
    }
}

export const statisticResolver: ResolveFn<StatisticModel | undefined> =
    (route: ActivatedRouteSnapshot) => {
        return inject(StatisticService).getById(route.paramMap.get('id')!);
    };
