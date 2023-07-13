import {CoordinateInterface} from "@models";

export class PointModel {

    constructor(public x: number, public y: number) {
    }

    toJson(): CoordinateInterface {
        return {
            x: this.x,
            y: this.y,
        }
    }
}