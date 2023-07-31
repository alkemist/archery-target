import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit, signal} from "@angular/core";
import BaseComponent from "@base-component";
import {StatisticService} from "../../../services/statistic.service";
import {EChartsOption} from "echarts";
import {StatisticModel} from "@models";
import {ArrayHelper} from "@tools";

interface Charts {
    arrow: EChartsOption,
    group: EChartsOption,
    score: EChartsOption,
}

@Component({
    templateUrl: "./statistics.component.html",
    styleUrls: ["./statistics.component.scss"],
    host: {
        class: "page-container"
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsComponent extends BaseComponent implements OnInit, AfterViewInit {

    arrowsByDay = new Map<string, number>();
    arrowsByMonth = new Map<string, number>();

    loading = signal<boolean>(true);
    statistics: Map<number, Map<number, Map<string, StatisticModel>>> | null = null;
    activeDistanceIndex = 0;
    activeTargetIndex = 0;
    activeTypeIndex = 0;

    chartOptions = new Map<number, Map<number, Charts>>();

    constructor(
        private statisticService: StatisticService,
    ) {
        super();
    }

    get distances() {
        return this.statistics ? ArrayHelper.sort([...this.statistics.keys()]) : [];
    }

    getTargets(distance: number) {
        const targets = this.statistics ? this.statistics.get(distance) : null;

        return targets ? ArrayHelper.sort([...targets.keys()]) : [];
    }

    ngOnInit() {

    }

    async ngAfterViewInit() {
        this.statisticService.getStatistics().then((statisticData) => {
            if (statisticData) {
                this.statistics = statisticData;

                this.chartOptions = new Map<number, Map<number, Charts>>();
                this.statistics.forEach((statisticsByDistance, distance) => {
                    let optionByDistance = this.chartOptions.get(distance);
                    if (!optionByDistance) {
                        optionByDistance = new Map<number, Charts>();
                        this.chartOptions.set(distance, optionByDistance);
                    }

                    statisticsByDistance.forEach((statisticsByTarget, target) => {
                        const dates = [...statisticsByTarget.keys()];
                        const averagesScore = [...statisticsByTarget.values()].map((value) => value.averageScore);
                        const averagesGroup = [...statisticsByTarget.values()].map((value) => value.averageGroup);
                        const averagesArrow = [...statisticsByTarget.values()].map((value) => value.averageArrow);

                        const baseOptions: EChartsOption = {
                            yAxis: {
                                type: 'value',
                            },
                        }

                        optionByDistance?.set(target, {
                            score: {
                                ...baseOptions,
                                xAxis: {
                                    type: 'category',
                                    data: dates,
                                },
                                series: [
                                    {
                                        data: averagesScore,
                                        type: 'line',
                                        smooth: true
                                    },
                                ],
                            },
                            group: {
                                ...baseOptions,
                                xAxis: {
                                    type: 'category',
                                    data: dates,
                                },
                                series: [
                                    {
                                        data: averagesGroup,
                                        type: 'line',
                                        smooth: true
                                    },
                                ],
                            },
                            arrow: {
                                ...baseOptions,
                                xAxis: {
                                    type: 'category',
                                    data: dates,
                                },
                                series: [
                                    {
                                        data: averagesArrow,
                                        type: 'line',
                                        smooth: true
                                    },
                                ],
                            },
                        });
                    });
                })
            }

            this.loading.set(false);
        })
    }

    getOptions(distance: any, target: any, type: 'arrow' | 'score' | 'group') {
        const options = this.chartOptions.get(distance)?.get(target);

        if (options) {
            return options[type]
        }

        return {};
    }

    activeDistanceIndexChange() {
        this.activeTargetIndex = 0;
        this.activeTypeIndex = 0;
    }

    activeTargetIndexChange() {
        this.activeTypeIndex = 0;
    }
}
