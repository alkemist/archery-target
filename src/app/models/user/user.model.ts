import {UserInterface, UserStoredInterface} from "./user.interface";
import {DocumentModel} from "../document";
import {OauthTokensModel} from "../oauth";


export class UserModel extends DocumentModel {
    protected _email: string;

    constructor(user: UserStoredInterface) {
        super(user);
        this._email = user.email ?? "";
        this._google = new OauthTokensModel(user.google ?? {});
    }

    protected _google: OauthTokensModel;

    get google() {
        return this._google;
    }

    set google(oauthToken: OauthTokensModel) {
        this._google = oauthToken;
    }

    override toFirestore(): UserInterface {
        return {
            ...super.toFirestore(),
            email: this._email,
        };
    }
}
