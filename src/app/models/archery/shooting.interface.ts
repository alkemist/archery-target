import {DocumentBackInterface, DocumentFrontInterface, HasIdWithInterface} from "@models";

export interface ArrowInterface {
    x: number,
    y: number,
    score?: number
}

export interface ShootingFrontInterface extends DocumentFrontInterface {
    date: Date,
    arrows: ArrowInterface[]
}

export type ShootingBackInterface = Partial<ShootingFrontInterface> & DocumentBackInterface;

export type ShootingStoredInterface = HasIdWithInterface<ShootingBackInterface>;
