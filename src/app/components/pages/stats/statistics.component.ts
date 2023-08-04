import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit, signal} from "@angular/core";
import BaseComponent from "@base-component";
import {StatisticService} from "../../../services/statistic.service";
import {EChartsOption, SeriesOption} from "echarts";
import {StatisticModel} from "@models";
import {DateHelper} from "@tools";

type ChartType = 'score' | 'group' | 'arrow';
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
    loading = signal<boolean>(true);
    activeTypeIndex = signal<number>(0);
    statistics: Map<number, Map<number, Map<number, StatisticModel>>> | null = null;
    chartOptions: Charts = {
        score: {},
        group: {},
        arrow: {},
    };

    constructor(
        private statisticService: StatisticService,
    ) {
        super();
    }

    ngOnInit() {

    }

    async ngAfterViewInit() {
        this.statisticService.getStatistics().then((statisticData) => {
            if (statisticData) {
                this.statistics = statisticData.statistics;

                const scoreSeries: SeriesOption[] = [],
                    groupSeries: SeriesOption[] = [],
                    arrowSeries: SeriesOption[] = [];
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
                        bottom: 0,
                    },
                    xAxis: {
                        type: 'category',
                    },
                    yAxis: {
                        type: 'value',
                        splitNumber: 10,
                        min: 'dataMin',
                        axisLine: {
                            onZero: false
                        },
                        splitLine: {
                            show: true,
                            lineStyle: {
                                color: "rgba(255,255,255)",
                                opacity: 1
                            }
                        },
                        minorTick: {
                            splitNumber: 2,
                        },
                        minorSplitLine: {
                            show: true,
                            lineStyle: {
                                type: "dashed",
                                color: "rgba(255,255,255)",
                                opacity: 0.2
                            }
                        },
                    }
                };
                
                const baseSerie = {
                    smooth: true,
                }

                const colors: Record<number, string> = {
                    10: 'white',
                    15: 'black',
                    20: 'blue',
                    25: 'red',
                    30: 'yellow',
                    40: 'yellow',
                    50: 'yellow',
                    60: 'yellow',
                }

                this.statistics.forEach((statisticsByDistance, distance) => {
                    statisticsByDistance.forEach((statisticsByTarget, target) => {
                        const configuration = `${distance} m - ${target} cm`;
                        const scoreLine = `Score ${configuration}`;

                        if (configurations.indexOf(configuration) === -1) {
                            configurations.push(configuration);
                            lines.push(scoreLine)
                        }

                        const color = colors[distance]

                        scoreSeries.push({
                            type: 'line',
                            ...baseSerie,
                            color,
                            name: scoreLine,
                            data: dates.map(date =>
                                this.getPoint(date,
                                    statisticsByTarget.get(date) as StatisticModel,
                                    'averageScore'
                                )
                            )
                        })

                        groupSeries.push({
                            type: 'line',
                            ...baseSerie,
                            color,
                            name: scoreLine,
                            data: dates.map(date =>
                                this.getPoint(date,
                                    statisticsByTarget.get(date) as StatisticModel,
                                    'averageGroup'
                                )
                            )
                        })

                        arrowSeries.push({
                            type: 'line',
                            ...baseSerie,
                            color,
                            name: scoreLine,
                            data: dates.map(date =>
                                this.getPoint(date,
                                    statisticsByTarget.get(date) as StatisticModel,
                                    'averageArrow'
                                )
                            )
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
                        max: 360,
                    },
                    series: scoreSeries
                };

                this.chartOptions['group'] = {
                    ...baseOptions,
                    title: {
                        ...baseOptions.title,
                        text: 'Group / 100',
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
                        max: 100,
                    },
                    series: groupSeries
                };

                this.chartOptions['arrow'] = {
                    ...baseOptions,
                    title: {
                        ...baseOptions.title,
                        text: 'Arrow / 10',
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
                        max: 10,
                    },
                    series: arrowSeries
                };
            }

            this.loading.set(false);
        })
    }

    private getPoint(date: number, point: StatisticModel, field: keyof StatisticModel) {
        return {
            name: DateHelper.secondToName(date),
            value: point ? point[field] as number : undefined,
            label: {
                show: true,
                fontSize: 14,
                formatter: () => `${point[field]} ★ ${point.arrows.toString()} ↑`
            }
        };
    }
}
