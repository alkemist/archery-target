import {ComponentRef, ElementRef, Injectable, signal, ViewContainerRef} from '@angular/core';

import 'hammerjs';
import {ArrowModel, CoordinateInterface, ShootingFormInterface, ShootingModel, SizeInterface} from "@models";
import {MathHelper} from "@tools";
import {ArrowComponent} from "@components";
import {Subject} from "rxjs";
import {ShootingService} from "./shooting.service";
import {CompareHelper} from "@alkemist/compare-engine";
import {CenterComponent} from "../components/center/center.component";


@Injectable({
    providedIn: 'root'
})
export class MapBuilder {
    // @TODO Sauvegarder les paramètres viseurs
    // @TODO Determiner le reglage du viseur optimal

    static TARGET_MARGIN = 200;
    static ERROR_MARGIN = 10;

    modalOpened = signal(false);
    mapShowed = signal(false);
    isAdding = true;

    private _viewContainerRef?: ViewContainerRef;
    private _containerSize: SizeInterface = {w: 0, h: 0};
    private _targetSize: SizeInterface = {w: 0, h: 0};
    private _targetCenter: CoordinateInterface = {x: 0, y: 0};
    private _currentScale: number = 1;
    private _scale: number = 1;
    private _scaleMin: number = 1;
    private _scaleMax: number = 1;
    private _shootingCenterMaxDistance = 0;
    private _rangeMin: CoordinateInterface = {x: 0, y: 0};
    private _rangeMax: CoordinateInterface = {x: 0, y: 0};
    private _currentMapPosition: CoordinateInterface = {x: 0, y: 0};
    private _mapPosition: CoordinateInterface = {x: 0, y: 0};
    private _hammerEnabled = true;
    private _isDragging = false;
    private _isZooming = false;
    private _targetElement?: HTMLImageElement;
    private _shootingChanged = new Subject<ShootingModel>();
    private _loaded = new Subject<boolean>();
    private _hammer?: HammerManager;
    private _pageElement?: HTMLElement;
    private _mapElement?: HTMLElement;
    private _rayons: number[] = [];
    private _shooting: ShootingModel | null = null;
    private _shootingCenterViewRef?: ComponentRef<CenterComponent>;

    constructor(
        private shootingService: ShootingService
    ) {

    }

    get arrowsCount() {
        return this.shooting?.arrows.length ?? 0
    };

    get onShootingChange$() {
        return this._shootingChanged.asObservable();
    }

    get loaded$() {
        return this._loaded.asObservable();
    }

    private get shooting(): ShootingModel {
        return this._shooting as ShootingModel;
    }

    private get hammer(): HammerManager {
        return this._hammer as HammerManager;
    }

    private get pageElement(): HTMLElement {
        return this._pageElement as HTMLElement;
    }

    private get mapElement(): HTMLElement {
        return this._mapElement as HTMLElement;
    }

    saveShooting() {
        return this.shootingService.addOrUpdate(this.shooting);
    }

    reset() {
        this._mapElement = undefined;
        this._pageElement = undefined;
        this._hammer = undefined;
        this._containerSize = {w: 0, h: 0};
        this._targetSize = {w: 0, h: 0};
        this._targetCenter = {x: 0, y: 0};
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
        this._rayons = [];
        this.mapShowed.set(false);
        this._viewContainerRef = undefined;
        this._shootingCenterViewRef = undefined;

        this.clear();
    }

    clear() {
        this.shooting.arrows.forEach((arrow) => {
            const viewRefIndex = this._viewContainerRef?.indexOf(arrow.viewRef);

            if (viewRefIndex !== undefined && viewRefIndex > -1) {
                this._viewContainerRef?.remove(viewRefIndex);
            }
        });
        this.shooting.arrows = [];
        this.updateShootingCenter();
        this._shootingChanged.next(this.shooting);
    }

    build(arrows: ArrowModel[]) {
        arrows.forEach(arrow => this.addArrow(arrow));
        this.updateShootingCenter();
    }

    updateShootingCenter() {
        const shootingCenter = this.shooting.calculCenter();

        if (CompareHelper.isEvaluable(shootingCenter)) {
            let shootingCenterDistance = this.shooting.arrows
                .reduce((shootingCenterDistance, arrow) =>
                    shootingCenterDistance + MathHelper.flatDistance(arrow.center, shootingCenter), 0);
            shootingCenterDistance = MathHelper.round(shootingCenterDistance / this.shooting.arrows.length);

            this.shooting.groupingScore = Math.max(0,
                MathHelper.round(100 - (shootingCenterDistance / this._shootingCenterMaxDistance * 100), 0)
            );

            if (!this._shootingCenterViewRef) {
                this._shootingCenterViewRef = this._viewContainerRef?.createComponent(CenterComponent);
            }

            this._shootingCenterViewRef?.instance.setPosition({
                x: shootingCenter.x + MapBuilder.TARGET_MARGIN / 2 - CenterComponent.size / 2,
                y: shootingCenter.y + MapBuilder.TARGET_MARGIN / 2 - CenterComponent.size / 2,
            });
        } else if (this._shootingCenterViewRef) {
            const index = this._viewContainerRef?.indexOf(this._shootingCenterViewRef.hostView);
            if (index !== undefined && index > -1) {
                this._viewContainerRef?.remove(
                    this._viewContainerRef?.indexOf(this._shootingCenterViewRef.hostView)
                );
            }
            this._shootingCenterViewRef = undefined;
        }

        this.shooting.center = shootingCenter;
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
        this._pageElement = pageRef.nativeElement;
        this._mapElement = mapRef.nativeElement;
    }


    updateSize() {
        this._containerSize.w = this.pageElement.offsetWidth;
        this._containerSize.h = this.pageElement.offsetHeight;

        const minScale = Math.min(
            (this._containerSize.w * 100 / this._targetSize.w) / 100,
            (this._containerSize.h * 100 / this._targetSize.h) / 100
        );

        const diff = MathHelper.ceil(
            (this._containerSize.w + this._containerSize.h) / (this._targetSize.w + this._targetSize.h)
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
        const rangeX = Math.max(0, MathHelper.round(this._targetSize.w * this._currentScale) - this._containerSize.w);
        const rangeY = Math.max(0, MathHelper.round(this._targetSize.h * this._currentScale) - this._containerSize.h);

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
            if (this.isAdding) {
                this.addArrowByUser(event.center)
            } else if (event.target.nodeName === "NG-COMPONENT" && event.target.innerHTML === " × ") {
                this.removeArrowByPoint(event.center)
            }
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
        this._targetSize.w = targetElement.naturalWidth + MapBuilder.TARGET_MARGIN;
        this._targetSize.h = targetElement.naturalHeight + MapBuilder.TARGET_MARGIN;
        this._targetCenter.x = this._targetSize.w / 2;
        this._targetCenter.y = this._targetSize.h / 2;
        this._shootingCenterMaxDistance = ((this._targetSize.w - MapBuilder.TARGET_MARGIN) / 2) - MapBuilder.ERROR_MARGIN;

        const rayon = MathHelper.round((this._targetSize.w - MapBuilder.TARGET_MARGIN) / 20)
        this._rayons = Array.from({length: 10}, (_, i) =>
            MathHelper.round(rayon * (i + 1)) + MapBuilder.ERROR_MARGIN)

        this.updateSize();

        this._scale = this._currentScale = this._scaleMin;
        this.updateMap(this._scale);

        this.checkPageStatus();
    }

    removeArrowByIndex(index: number) {
        const arrow = this.shooting.arrows[index];
        const viewRefIndex = this._viewContainerRef?.indexOf(arrow.viewRef);

        if (viewRefIndex !== undefined && viewRefIndex > -1) {
            this._viewContainerRef?.remove(viewRefIndex);
            this.shooting.removeArrow(index);
            this.updateShootingCenter();
            this._shootingChanged.next(this.shooting);
        } else {
            throw new Error("Unknown arrow by index")
        }
    }

    updateShootingByForm(value: Partial<ShootingFormInterface>) {
        if (value.date) {
            this.shooting.date = value.date;
            this.shooting.updateNameAndSlug();
        }
        if (value.distance) {
            this.shooting.distance = value.distance;
        }
        if (value.target) {
            this.shooting.target = value.target;
        }
        this._shootingChanged.next(this.shooting);
    }

    updateShootingByQuery(shooting: ShootingModel) {
        this._shooting = shooting;
        this.build(shooting.arrows);
    }

    private checkPageStatus() {
        if (this._viewContainerRef && this._targetSize.w && this._targetSize.h) {
            this.initHammer();
            this.pageElement.addEventListener('wheel', (e) => {
                if (!this._hammerEnabled) {
                    return;
                }

                const event = e as WheelEventCustom;

                this.zoom(
                    this._scale + (event.wheelDelta / 2000),
                    this.removeOffset({
                        x: event.clientX,
                        y: event.clientY,
                    }),
                    event.wheelDelta)

                this.updateValues();
            }, {passive: false});
            this._loaded.next(true);
        }
    }

    private removeOffset(point: CoordinateInterface) {
        return {
            x: point.x - (document.body.scrollWidth - this._containerSize.w),
            y: point.y - (document.body.scrollHeight - this._containerSize.h)
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

    private calculScore(arrow: ArrowModel): number {
        const index = this._rayons.findIndex((rayon) =>
            MathHelper.inCircle(arrow.center, this._targetCenter, rayon)
        )

        return 10 - (index > -1 ? index : 10);
    }

    private placeArrow(point: CoordinateInterface): ArrowModel {
        const position: CoordinateInterface = this.removeOffset(point);

        position.x -= this._mapPosition.x - MapBuilder.TARGET_MARGIN * this._scale / 2;
        position.x -= (this._containerSize.w - this._targetSize.w * this._scale) / 2

        position.y -= this._mapPosition.y - MapBuilder.TARGET_MARGIN * this._scale / 2;
        position.y -= (this._containerSize.h - this._targetSize.h * this._scale) / 2;

        position.x /= this._scale;
        position.y /= this._scale;

        const componentOffset = ArrowComponent.size / 2;
        const targetOffset = MapBuilder.TARGET_MARGIN / 2

        const arrow = new ArrowModel({
            x: position.x - componentOffset,
            y: position.y - componentOffset,
            center: {
                x: position.x - targetOffset,
                y: position.y - targetOffset
            }
        });

        arrow.score = this.calculScore(arrow)
        arrow.distance = MathHelper.round(MathHelper.flatDistance(arrow.center, this._targetCenter));

        return arrow;
    }

    private isInMap(arrow: ArrowModel) {
        const totalDistance = arrow.distance + ArrowComponent.size - MapBuilder.TARGET_MARGIN;

        return totalDistance <= (this._targetSize.w / 2)
            && totalDistance <= (this._targetSize.h / 2);
    }

    private addArrowByUser(point: CoordinateInterface) {
        const arrow = this.placeArrow(point);

        if (this.isInMap(arrow)) {
            this.addArrow(arrow);
            this.shooting.addArrow(arrow);
            this.updateShootingCenter();
            this._shootingChanged.next(this.shooting);

        }
    }

    private addArrow(arrow: ArrowModel) {
        const componentRef = this._viewContainerRef?.createComponent(ArrowComponent);

        if (componentRef) {
            arrow.viewRef = componentRef.hostView;

            const componentInstance = componentRef.instance;

            componentInstance.setPosition(arrow.forComponent());
        }
    }

    private removeArrowByPoint(point: CoordinateInterface) {
        const arrowPoint = this.placeArrow(point);
        const index = this.shooting.arrows.findIndex(arrow => arrow.hasPoint(arrowPoint))

        if (index > -1) {
            this.removeArrowByIndex(index);
            this.updateShootingCenter();
            this._shootingChanged.next(this.shooting);
        } else {
            throw new Error("Unknown arrow by point")
        }
    }
}

interface WheelEventCustom extends WheelEvent {
    wheelDelta: number;
    layerX: number;
    layerY: number;
}