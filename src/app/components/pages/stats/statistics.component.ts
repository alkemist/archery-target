import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit, signal} from "@angular/core";
import BaseComponent from "@base-component";
import {StatisticService} from "../../../services/statistic.service";
import {EChartsOption, SeriesOption} from "echarts";
import {StatisticModel} from "@models";
import {ArrayHelper, DateHelper} from "@tools";

type ChartType = 'arrow' | 'score' | 'group' | 'arrows';
type Charts = Record<ChartType, EChartsOption>

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
    statistics: Map<number, Map<number, Map<number, StatisticModel>>> | null = null;
    activeDistanceIndex = 0;
    activeTargetIndex = 0;
    activeTypeIndex = 0;

    //chartOptions = new Map<number, Map<number, Charts>>();
    chartOptions: Charts = {
        score: {},
        group: {},
        arrow: {},
        arrows: {},
    };

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
            console.log(statisticData);

            if (statisticData) {
                this.statistics = statisticData.statistics;

                //this.chartOptions = new Map<number, Map<number, Charts>>();
                const scoreSeries: SeriesOption[] = [],
                    arrowsSeries: SeriesOption[] = [];
                const configurations: string[] = [];
                const lines: string[] = [];
                const dates = statisticData.dates;
                const baseOptions: EChartsOption = {
                    darkMode: true,
                    tooltip: {
                        trigger: 'axis'
                    },
                    grid: {
                        bottom: '20%'
                    },
                    title: {
                        textStyle: {
                            color: '#fff'
                        }
                    },
                    legend: {
                        textStyle: {
                            color: '#fff'
                        },
                        orient: 'horizontal',
                        itemGap: 50,
                        bottom: 0
                    },
                    xAxis: {
                        //boundaryGap: false,
                    },
                    yAxis: {
                        splitLine: {
                            show: true,
                            lineStyle: {
                                color: "rgba(255,255,255)",
                                opacity: 1
                            }
                        },
                        minorSplitLine: {
                            show: true,
                            lineStyle: {
                                type: "dashed",
                                color: "rgba(255,255,255)",
                                opacity: 0.2
                            }
                        }
                    }
                };
                const baseSerie = {
                    smooth: true,
                }
                const colors = [
                    'red', 'blue', 'yellow', 'green', 'orange'
                ];

                this.statistics.forEach((statisticsByDistance, distance) => {
                    statisticsByDistance.forEach((statisticsByTarget, target) => {
                        //const dates = [...statisticsByTarget.keys()];
                        const averagesScore = [...statisticsByTarget.values()].map((value) => value.averageScore);
                        const averagesGroup = [...statisticsByTarget.values()].map((value) => value.averageGroup);
                        const averagesArrow = [...statisticsByTarget.values()].map((value) => value.averageArrow);

                        const configuration = `${distance} m - ${target} cm`;
                        const scoreLine = `Score ${configuration}`;
                        const arrowsLine = `Arrow ${configuration}`;

                        if (configurations.indexOf(configuration) === -1) {
                            configurations.push(configuration);
                            lines.push(scoreLine)
                            lines.push(arrowsLine)
                        }

                        scoreSeries.push({
                            ...baseSerie,
                            name: scoreLine,
                            type: 'line',
                            color: colors[configurations.indexOf(configuration)],
                            data: dates.map(date => ({
                                name: DateHelper.secondToName(date),
                                value: statisticsByTarget.get(date)?.averageScore as number
                            }))
                        })

                        scoreSeries.push({
                            name: arrowsLine,
                            type: 'bar',
                            color: colors[configurations.indexOf(configuration)],
                            data: dates.map(date => ({
                                name: DateHelper.secondToName(date),
                                value: statisticsByTarget.get(date)?.arrows as number
                            }))
                        })
                    });
                });

                this.chartOptions['score'] = {
                    ...baseOptions,
                    title: {
                        ...baseOptions.title,
                        text: 'Score / 360',
                    },
                    legend: {
                        ...baseOptions.legend,
                        data: lines,
                    },
                    xAxis: {
                        ...baseOptions.xAxis,
                        type: 'category',
                        data: dates.map(date => DateHelper.secondToName(date)),
                    },
                    yAxis: {
                        ...baseOptions.yAxis,
                        type: 'value',
                        min: 0,
                        max: 360,
                    },
                    series: scoreSeries
                };
            }

            this.loading.set(false);
        })
    }

    /*getOptions(distance: any, target: any, type: 'arrow' | 'score' | 'group') {
        const options = this.chartOptions.get(distance)?.get(target);

        if (options) {
            return options[type]
        }

        return {};
    }*/
    getOptions(type: ChartType) {
        return this.chartOptions[type];
    }

    activeDistanceIndexChange() {
        this.activeTargetIndex = 0;
        this.activeTypeIndex = 0;
    }

    activeTargetIndexChange() {
        this.activeTypeIndex = 0;
    }
}
