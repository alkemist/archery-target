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
import {FormArray, FormControl, FormGroup} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {ArrowInterface, ShootingFormInterface, ShootingModel} from "@models";
import {combineLatest, shareReplay} from "rxjs";
import {UserService} from "@services";
import {ConfirmationService} from "primeng/api";
import {CompareHelper, FormGroupSupervisor, RecursivePartial} from "@alkemist/ng-form-supervisor";

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

    shootingForm = new FormGroup({
        date: new FormControl<Date | null>(new Date()),
        distance: new FormControl<number | null>(null),
        target: new FormControl<number | null>(null),
        arrows: new FormArray([
            new FormControl<ArrowInterface | null>({
                x: 0,
                y: 0,
                value: 0,
                distance: 0,
                score: 0,
                center: {x: 0, y: 0},
            } as ArrowInterface)
        ])
    });

    shootingSupervisor = new FormGroupSupervisor(
        this.shootingForm,
        this.shootingForm.value as ShootingFormInterface
    );

    deleteModeControl = new FormControl<boolean>(false);

    constructor(
        private userService: UserService,
        public mapBuilder: MapBuilder,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private confirmationService: ConfirmationService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super();
        this.mapBuilder.reset();

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

                if (shooting.arrows.length === 0) {
                    if (this.deleteModeControl.value) {
                        this.deleteModeControl.setValue(false);
                    }
                }

                this.shootingSupervisor.setValue(shooting.toFormData(), {emitEvent: false});

                console.log('- Shooting change ?', this.shootingSupervisor.hasChange())
                console.log('- Shooting change', this.shootingSupervisor.getChanges())
                console.log('- Shooting compare', this.shootingSupervisor['compareEngine']['panels'])


                this.changeDetectorRef.detectChanges();
            })

        this.deleteModeControl.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe((editMode) => {
                this.mapBuilder.isAdding = !editMode ?? true;
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

                    const shooting = routeData && routeData["shooting"]
                        ? CompareHelper.deepClone(routeData["shooting"])
                        : new ShootingModel()

                    this.shootingSupervisor.setValue(shooting.toFormData(), {emitEvent: false});
                    this.shootingSupervisor.resetInitialValue();

                    this.mapBuilder.updateShootingByQuery(shooting as ShootingModel);

                    console.log('- Shooting change ?', this.shootingSupervisor.hasChange())
                    console.log('- Shooting change', this.shootingSupervisor.getChanges())
                    console.log('- Shooting compare', this.shootingSupervisor['compareEngine']['panels'])
                });

        this.shootingForm.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe(() => {
                console.log('Update form', this.shootingForm.value);

                this.mapBuilder.updateShootingByForm(this.shootingForm.value as RecursivePartial<ArrowInterface>);

                console.log('- Shooting change ?', this.shootingSupervisor.hasChange())
                console.log('- Shooting change', this.shootingSupervisor.getChanges())
                console.log('- Shooting compare', this.shootingSupervisor['compareEngine']['panels'])
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
        console.log('- Shooting change ?', this.shootingSupervisor.hasChange())

        if (this.shootingSupervisor.hasChange()) {
            return new Promise<boolean>((resolve) => {
                this.confirmationService.confirm({
                    key: "shooting",
                    message: "You have unsaved changes. Are you sure you want to leave this page?",
                    accept: () => {
                        resolve(true);
                    },
                    reject: () => {
                        resolve(false);
                    }
                });
            });
        }
        return true;
    }

    submitShooting() {
        const isNew = !this.shooting()?.id;

        this.mapBuilder.saveShooting().then((shootingStored) => {
            this.modalOpened = false;
            if (isNew) {
                void this.router.navigate(['shooting', shootingStored.id]);
            }
        })
    }
}
