import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef
} from "@angular/core";
import BaseComponent from "@base-component";
import {MapBuilder} from "../../../services/map.builder";

@Component({
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
    host: {
        class: "page-container"
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild("container", {read: ViewContainerRef, static: true}) viewContainerRef?: ViewContainerRef;
    @ViewChild("page") pageRef?: ElementRef;
    @ViewChild("map") mapRef?: ElementRef;
    @ViewChild("target") targetRef?: ElementRef;

    shootingLoading: boolean = true;
    targetLoading: boolean = true;
    isLandscape?: boolean;

    constructor(
        private mapBuilder: MapBuilder,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super();
    }

    ngOnInit(): void {
        this.shootingLoading = false;
    }

    async ngAfterViewInit(): Promise<void> {
        this.mapBuilder.setAllElements(this.viewContainerRef, this.pageRef as ElementRef, this.mapRef as ElementRef);

        if (this.targetRef) {
            this.targetRef.nativeElement.onload = (onLoadResult: Event) => {
                this.targetLoading = false;
                this.mapBuilder.setTargetElement(onLoadResult.target as HTMLImageElement);
            };
            this.targetRef.nativeElement.src = `/assets/images/WA_80_cm_archery_target.svg`;
            this.changeDetectorRef.detectChanges();
        }
    }

    // @ts-ignore
    override ngOnDestroy() {
        this.mapBuilder.reset();
    }

}
