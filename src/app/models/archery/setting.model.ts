import {DocumentModel, HasIdInterface, SettingBackInterface} from "@models";
import {SettingStoredInterface} from "./setting.interface";
import {slugify} from "@tools";

export class SettingModel extends DocumentModel implements HasIdInterface {
    private _distance: number;
    private _valueMin: number;
    private _valueMax: number;

    constructor(setting?: SettingStoredInterface) {
        super(setting ?? {id: '', name: '', slug: ''});

        this._distance = setting?.distance ?? 0;
        this._valueMin = setting?.valueMin ?? 0;
        this._valueMax = setting?.valueMax ?? 0;
    }

    get valueStr() {
        const values: number[] = [];
        if (this._valueMin) {
            values.push(this.valueMin);
        }
        if (this._valueMax && this._valueMax !== this._valueMin) {
            values.push(this._valueMax);
        }
        return values.join(' / ')
    }

    get distance(): number {
        return this._distance;
    }

    set distance(distance: number) {
        this._distance = distance;
    }

    get valueMin(): number {
        return this._valueMin;
    }

    set valueMin(valueMin: number) {
        this._valueMin = valueMin;
    }

    get valueMax(): number {
        return this._valueMax;
    }

    set valueMax(valueMax: number) {
        this._valueMax = valueMax;
    }

    updateNameAndSlug() {
        this._name = this._distance.toString();
        this._slug = slugify(this._name);
    }

    override toFirestore(): SettingBackInterface {
        return {
            ...super.toFirestore(),
            distance: this._distance,
            valueMin: this._valueMin,
            valueMax: this._valueMax,
        }
    }
}