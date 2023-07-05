import {DocumentBackInterface, HasIdWithInterface} from "../document";

export interface Viewfinder {
    distance: number,
    set: number
}

export interface UserInterface extends DocumentBackInterface {
    email: string;
    viewfinders?: Viewfinder[]
}

export type UserStoredInterface = HasIdWithInterface<UserInterface>;
