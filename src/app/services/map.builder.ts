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
    private _rangeMin: CoordinateInterface = {x: 0, y: 0};
    private _rangeMax: CoordinateInterface = {x: 0, y: 0};
    private _currentMapPosition: CoordinateInterface = {x: 0, y: 0};
    private _mapPosition: CoordinateInterface = {x: 0, y: 0};
    private _hammerEnabled = true;
    private _isDragging = false;
    private _isZooming = false;
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
        this._rangeMin = {x: 0, y: 0};
        this._rangeMax = {x: 0, y: 0};
        this._currentMapPosition = {x: 0, y: 0};
        this._mapPosition = {x: 0, y: 0};
        this._hammerEnabled = true;
        this._isDragging = false;
        this._isZooming = false;
    }

    build(arrows: Arrow[]) {

    }

    updateCurrentPosition(position: CoordinateInterface, offset?: SizeInterface) {
        if (offset) {
            const newPosX = MathHelper.round(position.x + MathHelper.round(offset.w * this._currentScale));
            const newPosY = MathHelper.round(position.y + MathHelper.round(offset.h * this._currentScale));

            if (MathHelper.isBetween(newPosX, this._rangeMin.x, this._rangeMax.x)) {
                position.x = MathHelper.round(position.x + offset.w);
            }
            if (MathHelper.isBetween(newPosY, this._rangeMin.y, this._rangeMax.y)) {
                position.y = MathHelper.round(position.y + offset.h);
            }
        }

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
            (this._containerSize.w * 100 / this._mapSize.w) / 100,
            (this._containerSize.h * 100 / this._mapSize.h) / 100
        );

        const diff = MathHelper.ceil(
            (this._containerSize.w + this._containerSize.h) / (this._mapSize.w + this._mapSize.h)
        );

        this._scaleMin = MathHelper.floor(minScale);
        this._scaleMax = this._scaleMin + diff * 2;
    }

    checkScale() {
        if (this._scale < this._scaleMin || this._scale > this._scaleMax) {
            this._scale = this._currentScale = MathHelper.clamp(
                this._scale,
                this._scaleMin, this._scaleMax
            );
            this.updateMap(this._scale);
        }
    }

    updateRange() {
        const rangeX = Math.max(0, MathHelper.round(this._mapSize.w * this._currentScale) - this._containerSize.w);
        const rangeY = Math.max(0, MathHelper.round(this._mapSize.h * this._currentScale) - this._containerSize.h);

        this._rangeMax.x = MathHelper.round(rangeX / 2);
        this._rangeMin.x = MathHelper.round(0 - this._rangeMax.x);

        this._rangeMax.y = MathHelper.round(rangeY / 2);
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
            if (!this._isZooming) {
                this._isDragging = true;

                this.updateCurrentPosition({
                    x: MathHelper.round(this._mapPosition.x + event.deltaX),
                    y: MathHelper.round(this._mapPosition.y + event.deltaY)
                });

                this.updateMap(this._scale);
            }
        });

        this.hammer.on('pinch', (event) => {
            if (!this._isDragging) {
                this._isZooming = true;

                this.zoom(
                    this._scale * MathHelper.round(event.scale),
                    {
                        x: MathHelper.round(event.center.x - (document.body.scrollWidth - this._containerSize.w)),
                        y: MathHelper.round(event.center.y - (document.body.scrollHeight - this._containerSize.h)),
                    }
                )
            }
        });

        this.hammer.on('tap', (event) => {
            this.addArrow(event.center)
        });

        this.hammer.on('panend pancancel pinchend pinchcancel', () => {
            this.updateValues();

            setTimeout(() => {
                this._isDragging = false;
                this._isZooming = false;
            }, 200)
        });
    }

    setTargetElement(targetElement: HTMLImageElement) {
        this._targetElement = targetElement;
        this._mapSize.w = targetElement.naturalWidth;
        this._mapSize.h = targetElement.naturalHeight;

        this.updateSize();

        this._scale = this._currentScale = this._scaleMin;
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

                const event = e as WheelEventCustom;

                this.zoom(
                    this._scale + (event.wheelDelta / 2000),
                    {
                        x: event.clientX - (document.body.scrollWidth - this._containerSize.w),
                        y: event.clientY - (document.body.scrollHeight - this._containerSize.h),
                    },
                    event.wheelDelta)

                this.updateValues();
            }, {passive: false});
        }
    }

    private zoom(scale: number, cursorPosition: CoordinateInterface, direction: number = 1) {
        const newScale =
            MathHelper.clamp(
                MathHelper.round(scale),
                this._scaleMin,
                this._scaleMax
            );

        const centerPosition = {
            x: this._containerSize.w / 2,
            y: this._containerSize.h / 2
        }

        const offset = {
            w: direction > 0 ? centerPosition.x - cursorPosition.x : cursorPosition.x - centerPosition.x,
            h: direction > 0 ? centerPosition.y - cursorPosition.y : cursorPosition.y - centerPosition.y,
        }

        if (this._currentScale !== newScale) {
            this._currentScale = newScale;
            this.updateRange();
            this.updateCurrentPosition(this._currentMapPosition, offset);
            this.updateMap(this._currentScale);
        }
    }

    private updateValues() {
        this._scale = this._currentScale;
        this._mapPosition.x = this._currentMapPosition.x;
        this._mapPosition.y = this._currentMapPosition.y;
    }

    private addArrow(center: CoordinateInterface) {
        
    }
}

interface WheelEventCustom extends WheelEvent {
    wheelDelta: number;
    layerX: number;
    layerY: number;
}