import {
    ArrowInterface,
    CoordinateInterface,
    DocumentBackInterface,
    DocumentFrontInterface,
    HasIdWithInterface
} from "@models";

export interface ShootingFrontInterface extends DocumentFrontInterface {
    date: Date,
    dateSeconds?: number,
    distance: number,
    target: number,
    score: number,
    groupingScore: number | null,
    center: CoordinateInterface | null,
    arrows: ArrowInterface[]
}

export interface ShootingFormInterface {
    date: Date | null,
    distance: number | null,
    target: number | null,
}

export type ShootingBackInterface = Partial<ShootingFrontInterface> & DocumentBackInterface;

export type ShootingStoredInterface = HasIdWithInterface<ShootingBackInterface>;
