import {ArrowInterface, DocumentBackInterface, DocumentFrontInterface, HasIdWithInterface} from "@models";

export interface ShootingFrontInterface extends DocumentFrontInterface {
    date: Date,
    dateSeconds?: number,
    distance: number,
    score: number,
    arrows: ArrowInterface[]
}

export interface ShootingFormInterface {
    date: Date | null,
    distance: number | null,
}

export type ShootingBackInterface = Partial<ShootingFrontInterface> & DocumentBackInterface;

export type ShootingStoredInterface = HasIdWithInterface<ShootingBackInterface>;
