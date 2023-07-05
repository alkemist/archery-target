import {DocumentBackInterface, DocumentFrontInterface, HasIdWithInterface} from "@models";

export interface Arrow {
    x: number,
    y: number,
    score: number
}

export interface ShootingFrontInterface extends DocumentFrontInterface {
    date: Date,
    arrows: Arrow[]
}

export type ShootingBackInterface = Partial<ShootingFrontInterface> & DocumentBackInterface;

export type ShootingStoredInterface = HasIdWithInterface<ShootingBackInterface>;
