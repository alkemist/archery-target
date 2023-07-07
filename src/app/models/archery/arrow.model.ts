import {ArrowInterface, CoordinateInterface} from "@models";
import {ArrowComponent} from "@components";
import {MapBuilder} from "../../services/map.builder";
import {ViewRef} from "@angular/core";
import {ColorInterface, StyleHelper} from "../../tools/style.helper";

export class ArrowModel {
    static COLORS: { color: ColorInterface, bgOffset: ColorInterface, fontColor: string }[] = [
        {color: {r: 0, g: 0, b: 0}, bgOffset: {r: 0, g: 0, b: 0, a: 0.8}, fontColor: 'white'},// Out
        {color: {r: 255, g: 255, b: 255}, bgOffset: {r: -40, g: -40, b: -40, a: 0.6}, fontColor: 'black'},// 1 - white
        {color: {r: 255, g: 255, b: 255}, bgOffset: {r: -230, g: -230, b: -230, a: 0.4}, fontColor: 'white'},// 2 - white
        {color: {r: 0, g: 0, b: 0}, bgOffset: {r: 140, g: 140, b: 140, a: 0.6}, fontColor: 'black'},// 3 - black
        {color: {r: 0, g: 0, b: 0}, bgOffset: {r: 40, g: 40, b: 40, a: 0.6}, fontColor: 'white'},// 4 - black
        {color: {r: 65, g: 183, b: 200}, bgOffset: {r: 55, g: 55, b: 55, a: 0.6}, fontColor: 'black'},// 5 - blue
        {color: {r: 65, g: 183, b: 200}, bgOffset: {r: 65 - 45, g: 183 - 45, b: 200 - 45, a: 0.4}, fontColor: 'white'},// 6 - blue
        {color: {r: 253, g: 27, b: 20}, bgOffset: {r: 2, g: 102, b: 102, a: 0.6}, fontColor: 'black'},// 7 - red
        {color: {r: 253, g: 27, b: 20}, bgOffset: {r: -98, g: -58, b: -58, a: 0.4}, fontColor: 'white'},// 8 - red
        {color: {r: 255, g: 245, b: 53}, bgOffset: {r: 0, g: 5, b: 105, a: 0.6}, fontColor: 'black'},// 9 - yellow
        {color: {r: 255, g: 245, b: 53}, bgOffset: {r: -150, g: -150, b: -53, a: 0.4}, fontColor: 'white'},// 10 - yellow
    ];

    private readonly _x: number;
    private readonly _y: number;
    private _score: number = 0;
    private _distance: number = 0;
    private _viewRef?: ViewRef;
    private _color: string = '';
    private _bgColor: string = '';
    private _fontColor: string = '';

    private readonly _center: CoordinateInterface = {
        x: 0,
        y: 0
    }

    constructor(data: ArrowInterface) {
        const componentOffset = ArrowComponent.size / 2;
        const margin = MapBuilder.TARGET_MARGIN / 2

        this._center = {
            x: data.x - margin,
            y: data.y - margin
        }

        this._x = data.x - componentOffset;
        this._y = data.y - componentOffset;
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

        const colorConfiguration = ArrowModel.COLORS[this.score];
        this._color = StyleHelper.rgbaToString(colorConfiguration.color);
        this._bgColor = StyleHelper.rgbaToString({
            r: colorConfiguration.color.r + colorConfiguration.bgOffset.r,
            g: colorConfiguration.color.g + colorConfiguration.bgOffset.g,
            b: colorConfiguration.color.b + colorConfiguration.bgOffset.b,
            a: colorConfiguration.bgOffset.a,
        })
        this._fontColor = colorConfiguration.fontColor;
    }

    get color(): string {
        return this._color;
    }

    get bgColor(): string {
        return this._bgColor;
    }

    get fontColor(): string {
        return this._fontColor;
    }

    get distance(): number {
        return this._distance;
    }

    set distance(distance: number) {
        this._distance = distance;
    }

    get viewRef(): ViewRef {
        return this._viewRef as ViewRef;
    }

    set viewRef(viewRef: ViewRef) {
        this._viewRef = viewRef;
    }

    hasPoint(point: ArrowModel) {
        return point.center.x >= this.center.x - ArrowComponent.size / 2
            && point.center.x <= this.center.x + ArrowComponent.size / 2
            && point.center.y >= this.center.y - ArrowComponent.size / 2
            && point.center.y <= this.center.y + ArrowComponent.size / 2;
    }
}