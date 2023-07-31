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
import {MapBuilder} from "../../../services/map.builder";
import {SettingModel, ShootingModel} from "@models";
import {ShootingService} from "../../../services/shooting.service";
import {SettingService} from "../../../services/setting.service";
import {StatisticService} from "../../../services/statistic.service";


@Component({
    selector: "app-header",
    templateUrl: "./header.component.html",
    styleUrls: ["./header.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent extends BaseComponent {
    loading = signal(false);
    logged = signal(false);
    sidebarShowed = signal(false);
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

    constructor(
        titleService: Title,
        public mapBuilder: MapBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private appService: AppService,
        private userService: UserService,
        private shootingService: ShootingService,
        private settingService: SettingService,
        private statisticService: StatisticService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
    ) {
        super();
        this.services["shooting"] = this.shootingService;
        this.services["settingService"] = this.settingService;
        this.services["statisticService"] = this.statisticService;

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

                this.mapBuilder.reloadSettings();
            });

        this.mapBuilder.onShootingChange$
            .pipe(takeUntilDestroyed())
            .subscribe((shooting) => {
                this.shooting.set(shooting);
                if (shooting.arrows.length === 0) {
                    if (this.sidebarShowed) {
                        this.sidebarShowed.set(false);
                    }
                }
            });

        this.mapBuilder.onSettingsChange$
            .pipe(takeUntilDestroyed())
            .subscribe((settings) => {
                this.buildMenu(settings);
            });

    }

    buildMenu(settings: SettingModel[] = []) {
        this.menuItems = [...BaseMenuItems];

        if (this.logged()) {
            this.menuItems.push(
                {
                    label: $localize`Shootings`,
                    icon: "pi pi-list",
                    routerLink: ['/', 'shootings'],
                }
            );

            this.menuItems.push({
                separator: true
            });

            this.menuItems.push(
                {
                    label: $localize`Settings`,
                    icon: "pi pi-search-plus",
                    items: [
                        {
                            label: $localize`List`,
                            icon: "pi pi-list",
                            routerLink: ['/', 'settings']
                        },
                        ...settings.map((setting) => ({
                            label: `${setting.name} m : ${setting.value}`,
                        }))
                    ]
                }
            );

            this.menuItems.push(
                {
                    label: $localize`Statistics`,
                    icon: "pi pi-chart-bar",
                    routerLink: ['/', 'statistics'],
                }
            );

            this.menuItems.push({
                separator: true
            });

            this.menuItems.push(
                {
                    label: $localize`Other`,
                    icon: "pi pi-cog",
                    items: [
                        {
                            label: $localize`Invalid shootings`,
                            icon: "pi pi-refresh",
                            command: () => {
                                void this.shootingService.invalidStoredData();
                                window.location.reload();
                            }
                        },
                        {
                            label: $localize`Invalid settings`,
                            icon: "pi pi-refresh",
                            command: () => {
                                void this.settingService.invalidStoredData();
                                window.location.reload();
                            }
                        },
                        {
                            label: $localize`Invalid statistics`,
                            icon: "pi pi-refresh",
                            command: () => {
                                void this.statisticService.invalidStoredData();
                                window.location.reload();
                            }
                        }
                    ]
                }
            );

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
            key: "header",
            message: $localize`Are you sure you want to remove all arrows ?`,
            accept: () => {
                this.mapBuilder.clear();
            }
        });
    }
}
