import {UserInterface, UserStoredInterface, Viewfinder} from "./user.interface";
import {DocumentModel} from "../document";


export class UserModel extends DocumentModel {
    protected _email: string;
    protected _viewfinders: Viewfinder[]

    constructor(user: UserStoredInterface) {
        super(user);
        this._email = user.email ?? "";
        this._viewfinders = user.viewfinders ?? [];
    }

    override toFirestore(): UserInterface {
        return {
            ...super.toFirestore(),
            email: this._email,
        };
    }
}
