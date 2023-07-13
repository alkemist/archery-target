import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    OnDestroy,
    OnInit,
    signal,
    ViewChild,
    ViewContainerRef
} from "@angular/core";
import BaseComponent from "@base-component";
import {MapBuilder} from "../../../services/map.builder";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {FormControl, FormGroup} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {ShootingModel} from "@models";
import {combineLatest, shareReplay} from "rxjs";
import {UserService} from "@services";
import {CompareHelper} from "@alkemist/compare-engine";

@Component({
    templateUrl: "./shooting.component.html",
    styleUrls: ["./shooting.component.scss"],
    host: {
        class: "page-container"
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShootingComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild("container", {read: ViewContainerRef, static: true}) viewContainerRef?: ViewContainerRef;
    @ViewChild("page") pageRef?: ElementRef;
    @ViewChild("map") mapRef?: ElementRef;
    @ViewChild("target") targetRef?: ElementRef;

    logged = signal(false);
    shooting = signal<ShootingModel | null>(null);

    shootingLoading: boolean = true;
    targetLoading: boolean = true;
    isLandscape?: boolean;

    margin = MapBuilder.TARGET_MARGIN + 'px'

    shootingForm = new FormGroup<{
        date: FormControl<Date | null>
        distance: FormControl<number | null>
    }>({
        date: new FormControl<Date>(new Date()),
        distance: new FormControl<number | null>(null),
    });

    constructor(
        private userService: UserService,
        public mapBuilder: MapBuilder,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super();

        this.mapBuilder.mapShowed.set(true);

        this.userService.isLoggedIn()
            .pipe(takeUntilDestroyed(), shareReplay({refCount: true, bufferSize: 1}))
            .subscribe((logged) => {
                this.logged.set(logged);
            });

        this.mapBuilder.onShootingChange$
            .pipe(takeUntilDestroyed())
            .subscribe((shooting) => {
                this.shooting.set(shooting);
                this.changeDetectorRef.detectChanges();
            })

        combineLatest([
            this.activatedRoute.data,
            this.mapBuilder.loaded$
        ])
            .pipe(takeUntilDestroyed())
            .subscribe(
                (mixedData) => {
                    const [routeData] = mixedData as
                        [{ shooting: ShootingModel | null }, boolean];

                    if (routeData && routeData["shooting"]) {
                        const shooting = CompareHelper.deepClone(routeData["shooting"]);

                        this.mapBuilder.updateShootingByQuery(shooting)
                        this.shootingForm.setValue(shooting.toDialogForm());
                    } else {
                        this.mapBuilder.updateShootingByQuery(new ShootingModel())
                        this.mapBuilder.updateShootingByForm(this.shootingForm.value)
                    }
                });

        this.shootingForm.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe(() => {
                this.mapBuilder.updateShootingByForm(this.shootingForm.value)
            })
    }

    get modalOpened(): boolean {
        return this.mapBuilder.modalOpened();
    };

    set modalOpened(modalOpened: boolean) {
        this.mapBuilder.modalOpened.set(modalOpened);
    };

    ngOnInit(): void {
        this.shootingLoading = false;
    }

    @HostListener("window:resize", ["$event"])
    onResize() {
        this.mapBuilder.updateSize()
        this.mapBuilder.checkScale();
    }

    async ngAfterViewInit(): Promise<void> {
        this.mapBuilder.setAllElements(this.viewContainerRef, this.pageRef as ElementRef, this.mapRef as ElementRef);

        if (this.targetRef) {
            this.targetRef.nativeElement.onload = (onLoadResult: Event) => {
                this.targetLoading = false;
                this.mapBuilder.setTargetElement(onLoadResult.target as HTMLImageElement);
            };
            this.targetRef.nativeElement.src = `/assets/images/WA_80_cm_archery_target.svg`;
        }
    }

    ngOnDestroy() {
        this.mapBuilder.reset();
    }

    override canDeactivate() {
        return true;
    }

    submitShooting() {
        const isNew = !this.shooting()?.id;

        this.mapBuilder.saveShooting().then((shootingStored) => {
            if (isNew) {
                void this.router.navigate(['shooting', shootingStored.id]);
            }
        })
    }
}
