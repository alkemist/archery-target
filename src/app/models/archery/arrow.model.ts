import {ArrowInterface, CoordinateInterface} from "@models";
import {ArrowComponent} from "@components";

export class ArrowModel {
    private readonly _x: number;
    private readonly _y: number;
    private _score: number = 0;
    private readonly _center: CoordinateInterface = {
        x: 0,
        y: 0
    }

    constructor(data: ArrowInterface) {
        const componentOffset = ArrowComponent.size / 2;

        this._center = {
            x: data.x,
            y: data.y
        }

        this._x = this._center.x - componentOffset;
        this._y = this._center.y - componentOffset;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }

    get center(): CoordinateInterface {
        return this._center;
    }

    get score(): number {
        return this._score;
    }

    set score(score: number) {
        this._score = score;
    }
}