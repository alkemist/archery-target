import {ElementRef, Injectable, ViewContainerRef} from '@angular/core';

import 'hammerjs';
import {Arrow, CoordinateInterface, SizeInterface} from "@models";
import {MathHelper} from "@tools";


@Injectable({
    providedIn: 'root'
})
export class MapBuilder {
    private _viewContainerRef?: ViewContainerRef;
    private _containerSize: SizeInterface = {w: 0, h: 0};
    private _mapSize: SizeInterface = {w: 0, h: 0};
    private _currentScale: number = 1;
    private _scale: number = 1;
    private _scaleMin: number = 1;
    private _scaleMax: number = 1;
    private _range: CoordinateInterface = {x: 0, y: 0};
    private _rangeMin: CoordinateInterface = {x: 0, y: 0};
    private _rangeMax: CoordinateInterface = {x: 0, y: 0};
    private _currentMapPosition: CoordinateInterface = {x: 0, y: 0};
    private _mapPosition: CoordinateInterface = {x: 0, y: 0};
    private _hammerEnabled = true;
    private _isDragging = true;
    private _targetElement?: HTMLImageElement;

    constructor() {
    }

    private _hammer?: HammerManager;

    private get hammer(): HammerManager {
        return this._hammer as HammerManager;
    }

    private _pageElement?: HTMLElement;

    private get pageElement(): HTMLElement {
        return this._pageElement as HTMLElement;
    }

    private _mapElement?: HTMLElement;

    private get mapElement(): HTMLElement {
        return this._mapElement as HTMLElement;
    }

    reset() {
        this._viewContainerRef = undefined;
        this._mapElement = undefined;
        this._pageElement = undefined;
        this._hammer = undefined;
        this._containerSize = {w: 0, h: 0};
        this._mapSize = {w: 0, h: 0};
        this._currentScale = 1;
        this._scale = 1;
        this._scaleMin = 1;
        this._scaleMax = 1;
        this._range = {x: 0, y: 0};
        this._rangeMin = {x: 0, y: 0};
        this._rangeMax = {x: 0, y: 0};
        this._currentMapPosition = {x: 0, y: 0};
        this._mapPosition = {x: 0, y: 0};
        this._hammerEnabled = true;
        this._isDragging = false;
    }

    build(arrows: Arrow[]) {

    }

    updateCurrentPosition(position: CoordinateInterface) {
        this._currentMapPosition.x = MathHelper.clamp(position.x, this._rangeMin.x, this._rangeMax.x);
        this._currentMapPosition.y = MathHelper.clamp(position.y, this._rangeMin.y, this._rangeMax.y);
    }

    setAllElements(viewContainerRef: ViewContainerRef | undefined, pageRef: ElementRef, mapRef: ElementRef) {
        this._viewContainerRef = viewContainerRef;

        this.setHtmlElements(pageRef, mapRef);
        this.checkPageStatus();
    }

    setHtmlElements(pageRef: ElementRef, mapRef: ElementRef) {
        this._pageElement = pageRef.nativeElement;
        this._mapElement = mapRef.nativeElement;
    }

    updateSize() {
        this._containerSize.w = this.pageElement.offsetWidth;
        this._containerSize.h = this.pageElement.offsetHeight;

        const minScale = Math.min(
            MathHelper.round(this._containerSize.w / this._mapSize.w),
            MathHelper.round(this._containerSize.h / this._mapSize.h)
        );
        this._scale = this._currentScale = this._scaleMin = MathHelper.floor(minScale);
        this._scaleMax = this._scaleMin + 1;
    }

    updateRange() {
        this._range.x = Math.max(0, MathHelper.round(this._mapSize.w * this._currentScale) - this._containerSize.w);
        this._range.y = Math.max(0, MathHelper.round(this._mapSize.h * this._currentScale) - this._containerSize.h);

        this._rangeMax.x = MathHelper.round(this._range.x / 2);
        this._rangeMin.x = MathHelper.round(0 - this._rangeMax.x);

        this._rangeMax.y = MathHelper.round(this._range.y / 2);
        this._rangeMin.y = MathHelper.round(0 - this._rangeMax.y);
    }

    updateMap(scale: number) {
        this.mapElement.style.transform =
            'translateX(' + this._currentMapPosition.x + 'px) translateY(' + this._currentMapPosition.y + 'px) translateZ(0px) scale(' + scale + ',' + scale + ')';
    }

    initHammer() {
        this._hammer = new Hammer(this.pageElement);
        this.hammer.get('pinch').set({enable: true});
        this.hammer.get('pan').set({enable: true, direction: Hammer.DIRECTION_ALL});

        this.hammer.on('pan', (event) => {
            this._isDragging = true;

            this.updateCurrentPosition({
                x: MathHelper.round(this._mapPosition.x + event.deltaX),
                y: MathHelper.round(this._mapPosition.y + event.deltaY)
            });

            this.updateMap(this._scale);
        });

        this.hammer.on('pinch pinchmove', (event) => {
            this._isDragging = true;

            this._currentScale = MathHelper.clamp(
                MathHelper.round(this._scale * event.scale),
                this._scaleMin, this._scaleMax
            );

            this.updateCurrentPosition({
                x: MathHelper.round(this._mapPosition.x + event.deltaX),
                y: MathHelper.round(this._mapPosition.y + event.deltaY)
            });
            this.updateRange();
            this.updateMap(this._currentScale);
        });

        this.hammer.on('panend pancancel pinchend pinchcancel', () => {
            this.updateValues();

            setTimeout(() => {
                this._isDragging = false;
            }, 200)
        });
    }

    setTargetElement(targetElement: HTMLImageElement) {
        this._targetElement = targetElement;
        this._mapSize.w = targetElement.naturalWidth;
        this._mapSize.h = targetElement.naturalHeight;

        this.updateSize();
        this.updateMap(this._scale);

        this.checkPageStatus();
    }

    private checkPageStatus() {
        if (this._viewContainerRef && this._mapSize.w && this._mapSize.h) {
            this.initHammer();
            this.pageElement.addEventListener('wheel', (e) => {
                if (!this._hammerEnabled) {
                    return;
                }

                const event = e as WheelEventCustom

                this._currentScale =
                    MathHelper.clamp(
                        MathHelper.round(this._scale + (event.wheelDelta / 800)),
                        this._scaleMin,
                        this._scaleMax
                    );

                this.updateCurrentPosition({
                    x: this._currentMapPosition.x,
                    y: this._currentMapPosition.y
                });
                this.updateRange();
                this.updateMap(this._currentScale);

                this.updateValues();
            }, {passive: false});
        }
    }

    private updateValues() {
        this._scale = this._currentScale;
        this._mapPosition.x = this._currentMapPosition.x;
        this._mapPosition.y = this._currentMapPosition.y;
    }
}

interface WheelEventCustom extends WheelEvent {
    wheelDelta: number;
}