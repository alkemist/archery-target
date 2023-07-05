import {DocumentBackInterface, DocumentFrontInterface, HasIdWithInterface} from "@models";

export interface DeviceBackInterface extends DocumentBackInterface {

}

export interface DeviceFrontInterface extends DocumentFrontInterface {
}

export type DeviceStoredInterface = HasIdWithInterface<DeviceBackInterface>;
