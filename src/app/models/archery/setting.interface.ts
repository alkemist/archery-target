import {DocumentBackInterface, DocumentFrontInterface, HasIdWithInterface} from "@models";

export interface SettingFrontInterface extends DocumentFrontInterface {
    distance: number,
    valueMin: number,
    valueMax: number,
}

export type SettingBackInterface = Partial<SettingFrontInterface> & DocumentBackInterface;

export type SettingStoredInterface = HasIdWithInterface<SettingBackInterface>;