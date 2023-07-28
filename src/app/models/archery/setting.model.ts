import {DocumentModel, HasIdInterface, SettingBackInterface} from "@models";
import {SettingStoredInterface} from "./setting.interface";
import {slugify} from "@tools";

export class SettingModel extends DocumentModel implements HasIdInterface {
    private _distance: number;
    private _value: number;

    constructor(setting?: SettingStoredInterface) {
        super(setting ?? {id: '', name: '', slug: ''});

        this._distance = setting?.distance ?? 0;
        this._value = setting?.value ?? 0;
    }

    get distance(): number {
        return this._distance;
    }

    set distance(distance: number) {
        this._distance = distance;
    }

    get value(): number {
        return this._value;
    }

    set value(value: number) {
        this._value = value;
    }

    updateNameAndSlug() {
        this._name = this._distance.toString();
        this._slug = slugify(this._name);
    }

    override toFirestore(): SettingBackInterface {
        return {
            ...super.toFirestore(),
            distance: this._distance,
            value: this._value,
        }
    }
}