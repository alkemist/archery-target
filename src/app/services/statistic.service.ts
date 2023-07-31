import {DatastoreService} from "./datastore.service";
import {inject, Injectable} from "@angular/core";
import {StatisticCalcul, StatisticModel, StatisticStoredInterface} from "@models";
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
import {ArrayHelper, MathHelper} from "@tools";
import {ShootingService} from "./shooting.service";

export type StatisticsData = Map<number, Map<number, Map<string, StatisticModel>>>

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

    async lastByDistanceAndTarget(distance: number, target: number) {
        const statistics = (await this.getListOrRefresh())
            .filter(statistic =>
                statistic.distance === distance
                && statistic.target === target)
        if (statistics.length === 0) return null;

        return ArrayHelper.sortBy(statistics, 'dateSeconds')[0];
    }

    async getStatistics(): Promise<StatisticsData | null> {
        const lastShooting = await this.shootingService.last('dateSeconds');

        if (lastShooting) {
            return await this.calculStatistics(lastShooting.dateSeconds);
        }
        return null;
    }

    async calculStatistics(dateSeconds: number): Promise<StatisticsData> {
        const distances: number[] = [], targets: number[] = [];
        const statsCalculByDistanceAndTarget = new Map<number, Map<number, StatisticCalcul>>;
        const statsByDistanceAndTarget = new Map<number, Map<number, Map<string, StatisticModel>>>;

        const shootings = await this.shootingService.getListOrRefresh();
        await ArrayHelper.sortBy(shootings, 'dateSeconds').forEach((shooting) => {
            let byDistance = statsCalculByDistanceAndTarget.get(shooting.distance ?? 0);
            if (!byDistance) {
                byDistance = new Map<number, StatisticCalcul>();
                statsCalculByDistanceAndTarget.set(shooting.distance ?? 0, byDistance);
            }

            let byTarget = byDistance.get(shooting.target ?? 0);
            if (!byTarget) {
                byTarget = {
                    max: {score: 0},
                    average: {score: 0, group: 0, arrow: 0},
                    total: {
                        score: 0,
                        group: 0,
                        arrows: 0,
                        scoreShootings: 0,
                        groupArrows: 0,
                    }
                } as StatisticCalcul;
                byDistance.set(shooting.target ?? 0, byTarget);
            }

            byTarget.total.score += shooting.score;

            if (shooting.groupingScore) {
                byTarget.total.group += (shooting.groupingScore * shooting.arrows.length);
                byTarget.total.groupArrows += shooting.arrows.length;
            }

            byTarget.total.arrows += shooting.arrows.length;
            byTarget.total.scoreShootings++;
        });

        for await (const [distance, byDistance] of statsCalculByDistanceAndTarget) {
            for await (const [target, byTarget] of byDistance) {
                const shootings = MathHelper.round(
                    byTarget.total.arrows / 36
                );

                const averageScore = MathHelper.round(
                    byTarget.total.score / shootings, 0
                )

                const averageGroup = MathHelper.round(
                    (byTarget.total.group / byTarget.total.groupArrows), 0
                )

                const averageArrow = MathHelper.round(
                    byTarget.total.score / byTarget.total.arrows, 1
                )


                const lastShooting = await this.shootingService.lastByDistanceAndTarget(distance, target);
                let statistic = await this.lastByDistanceAndTarget(distance, target);

                /*console.log('- Check', distance, target);
                console.log('-- timing', lastShooting?.dateSeconds, statistic?.dateSeconds);
                console.log('-- arrows', statistic?.arrows, byTarget.total.arrows)*/

                if (!statistic || lastShooting && lastShooting?.dateSeconds > statistic.dateSeconds) {
                    statistic = new StatisticModel({
                        dateSeconds: lastShooting?.dateSeconds ?? dateSeconds,
                        distance,
                        target,
                        averageScore,
                        averageGroup,
                        averageArrow,
                        arrows: byTarget.total.arrows
                    });

                    console.log('-- Add', statistic.dateSeconds)
                    await this.add(statistic);
                } else if (statistic && lastShooting
                    && lastShooting?.dateSeconds === statistic.dateSeconds
                    && byTarget.total.arrows > statistic.arrows
                ) {
                    statistic.dateSeconds = lastShooting.dateSeconds;
                    statistic.averageScore = averageScore;
                    statistic.averageGroup = averageGroup;
                    statistic.averageArrow = averageArrow;
                    statistic.arrows = byTarget.total.arrows;

                    //console.log('-- Update', statistic.dateSeconds)
                    await this.update(statistic);
                }

                let statsByDistance = statsByDistanceAndTarget.get(distance);
                if (!statsByDistance) {
                    statsByDistance = new Map<number, Map<string, StatisticModel>>();
                    statsByDistanceAndTarget.set(distance, statsByDistance);

                    if (distances.indexOf(statistic.distance) === -1) {
                        distances.push(statistic.distance);
                    }
                }

                let statsByTarget = statsByDistance.get(target);
                if (!statsByTarget) {
                    statsByTarget = new Map<string, StatisticModel>();
                    statsByDistance.set(target, statsByTarget);

                    if (targets.indexOf(statistic.target) === -1) {
                        targets.push(statistic.target);
                    }
                }

                statsByTarget.set(statistic.dateStr, statistic);
            }
        }


        return statsByDistanceAndTarget;
    }
}

export const statisticResolver: ResolveFn<StatisticModel | undefined> =
    (route: ActivatedRouteSnapshot) => {
        return inject(StatisticService).getById(route.paramMap.get('id')!);
    };
