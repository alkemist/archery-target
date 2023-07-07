import {ChangeDetectionStrategy, Component, computed, signal} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {map, Subject} from "rxjs";
import {Title} from "@angular/platform-browser";
import {AppService, UserService} from "@services";
import {ConfirmationService, MenuItem} from "primeng/api";
import {BaseMenuItems} from "./menuItems.data";
import {default as NoSleep} from "nosleep.js";
import BaseComponent from "@base-component";
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";
import {FormControl} from "@angular/forms";
import {MapBuilder} from "../../../services/map.builder";
import {ArrowModel} from "../../../models/archery/arrow.model";


@Component({
    selector: "app-header",
    templateUrl: "./header.component.html",
    styleUrls: ["./header.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent extends BaseComponent {
    loading = signal(false);
    logged = signal(false);
    arrows = signal<ArrowModel[]>([]);
    totalScore = computed(() =>
        this.arrows().reduce((total, arrow) => total + arrow.score, 0)
    );
    hasArrows = computed(() =>
        this.arrows().length > 0
    );

    title;
    menuItems: MenuItem[] = BaseMenuItems;
    notLoggedMenuItems: MenuItem[] = [...BaseMenuItems];
    services: Record<string, any> = {};
    noSleep = new NoSleep();
    appIsVisible$ = new Subject<boolean>();
    sidebarShowed = false;

    deleteModeControl = new FormControl<boolean>(false);

    constructor(
        titleService: Title,
        public mapBuilder: MapBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private appService: AppService,
        private userService: UserService,
        private confirmationService: ConfirmationService,
    ) {
        super();

        this.title = toSignal(router.events.pipe(
            map(_ => titleService.getTitle().replaceAll("-", "/"))
        ));

        document.addEventListener("visibilitychange", _ => {
            this.appIsVisible$.next(document.visibilityState === "visible");
        });

        this.userService.isLoggedIn()
            .pipe(takeUntilDestroyed())
            .subscribe((logged) => {
                this.logged.set(logged);
                this.loading.set(false);
                this.buildMenu();
            });

        this.mapBuilder.onArrowsChange$
            .pipe(takeUntilDestroyed())
            .subscribe((arrows) => {
                this.arrows.set(arrows);
                if (arrows.length === 0) {
                    if (this.deleteModeControl.value) {
                        this.deleteModeControl.setValue(false);
                    }
                    if (this.sidebarShowed) {
                        this.sidebarShowed = false;
                    }
                }
            })

        this.deleteModeControl.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe((editMode) => {
                this.mapBuilder.isAdding = !editMode ?? true;
            })
    }

    buildMenu() {
        this.menuItems = [...BaseMenuItems];

        if (this.logged()) {
            /*DataModelMenuItems.forEach((menuItem) => {
                this.menuItems.push({
                    ...menuItem, items: [
                        {
                            label: $localize`List`,
                            icon: "pi pi-list",
                            routerLink: menuItem.listRouterLink,
                        },
                        {
                            label: $localize`Add`,
                            icon: "pi pi-plus",
                            routerLink: menuItem.addRouterLink,
                        },
                        {
                            label: $localize`Invalid store`,
                            icon: "pi pi-refresh",
                            command: () => {
                                this.services[menuItem.service].invalidStoredData();
                                window.location.reload();
                            }
                        }
                    ],
                });
            });*/
        }

        if (this.logged()) {
            /*this.menuItems.push({
                separator: true
            });

            this.menuItems.push({
                ...LogoutMenuItem, command: () => {
                    void this.userService.logout();
                }
            });*/
        } else {
            //this.menuItems.push(LoginMenuItem)
        }
    }

    removeAllArrows() {
        this.confirmationService.confirm({
            key: "shooting",
            message: $localize`Are you sure you want to remove all arrows ?`,
            accept: () => {
                this.mapBuilder.clear();
            }
        });
    }
}
