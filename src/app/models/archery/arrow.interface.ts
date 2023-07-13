import {CoordinateInterface} from "../coordinate";

export interface ArrowInterface {
    x: number,
    y: number,
    score?: number,
    distance?: number,
    center?: CoordinateInterface
}

export interface ArrowComponentInterface extends CoordinateInterface {
    fontColor: string,
    bgColor: string
}