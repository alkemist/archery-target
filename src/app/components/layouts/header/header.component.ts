import {ChangeDetectionStrategy, Component, computed, signal} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {map, shareReplay, Subject} from "rxjs";
import {Title} from "@angular/platform-browser";
import {AppService, UserService} from "@services";
import {ConfirmationService, MenuItem, MessageService} from "primeng/api";
import {BaseMenuItems, DataModelMenuItems, LoginMenuItem, LogoutMenuItem} from "./menuItems.data";
import {default as NoSleep} from "nosleep.js";
import BaseComponent from "@base-component";
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";
import {FormControl} from "@angular/forms";
import {MapBuilder} from "../../../services/map.builder";
import {ShootingModel} from "@models";
import {ShootingService} from "../../../services/shooting.service";


@Component({
    selector: "app-header",
    templateUrl: "./header.component.html",
    styleUrls: ["./header.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent extends BaseComponent {
    loading = signal(false);
    logged = signal(false);
    shooting = signal<ShootingModel | null>(null);
    hasArrows = computed(() => {
        const shooting = this.shooting()
        return shooting ? shooting.arrows.length > 0 : false
    });

    title;
    menuItems: MenuItem[] = [...BaseMenuItems];
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
        private shootingService: ShootingService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
    ) {
        super();
        this.services["shooting"] = this.shootingService;

        this.title = toSignal(router.events.pipe(
            map(_ => titleService.getTitle().replaceAll("-", "/"))
        ));

        document.addEventListener("visibilitychange", _ => {
            this.appIsVisible$.next(document.visibilityState === "visible");
        });

        this.userService.isLoggedIn()
            .pipe(takeUntilDestroyed(), shareReplay({refCount: true, bufferSize: 1}))
            .subscribe((logged) => {
                this.logged.set(logged);
                this.loading.set(false);
                this.buildMenu();
            });

        this.mapBuilder.onShootingChange$
            .pipe(takeUntilDestroyed())
            .subscribe((shooting) => {
                this.shooting.set(shooting);
                if (shooting.arrows.length === 0) {
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
            DataModelMenuItems.forEach((menuItem) => {
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
            });
        }

        if (this.logged()) {
            this.menuItems.push({
                separator: true
            });

            this.menuItems.push({
                ...LogoutMenuItem, command: () => {
                    void this.userService.logout();
                }
            });
        } else {
            this.menuItems.push(LoginMenuItem)
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

    submitShooting() {
        const isNew = !this.shooting()?.id;

        this.mapBuilder.saveShooting().then((shootingStored) => {
            if (isNew) {
                void this.router.navigate(['shooting', shootingStored.id]);
            }
        })
    }
}
