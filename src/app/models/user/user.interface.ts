import {DocumentBackInterface, HasIdWithInterface} from "../document";
import {OauthTokensInterface} from "../oauth";


export interface UserInterface extends DocumentBackInterface {
    email: string;
    google?: OauthTokensInterface;
}

export type UserStoredInterface = HasIdWithInterface<UserInterface>;
