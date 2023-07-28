import {DocumentFrontInterface} from "@models";

export interface SettingInterface extends DocumentFrontInterface {
    distance: number,
    value: number,
}