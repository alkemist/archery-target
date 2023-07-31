import {DocumentBackInterface, DocumentFrontInterface, HasIdWithInterface} from "@models";

export interface StatisticFrontInterface extends DocumentFrontInterface {
    distance: number,
    target: number,
    dateSeconds: number,
    averageArrow: number,
    averageGroup: number,
    averageScore: number,
    arrows: number,
}

export interface StatisticCalcul {
    average: {
        score: number,
        group: number
        arrow: number,
    },
    total: {
        score: number,
        group: number,
        arrows: number,
        scoreShootings: number
        groupArrows: number
    },
}

export type StatisticBackInterface = Partial<StatisticFrontInterface> & DocumentBackInterface;

export type StatisticStoredInterface = HasIdWithInterface<StatisticBackInterface>;