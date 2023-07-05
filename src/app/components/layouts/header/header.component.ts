import {ChangeDetectionStrategy, Component, signal} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {map, Subject} from "rxjs";
import {Title} from "@angular/platform-browser";
import {AppService, UserService} from "@services";
import {MenuItem} from "primeng/api";
import {DataModelMenuItems, LogoutMenuItem, MenuItems} from "./menuItems.data";
import {default as NoSleep} from "nosleep.js";
import BaseComponent from "@base-component";
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";


@Component({
    selector: "app-header",
    templateUrl: "./header.component.html",
    styleUrls: ["./header.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent extends BaseComponent {
    loading = signal(false);
    logged = signal(false);
    title;
    menuItems: MenuItem[] = MenuItems;
    services: Record<string, any> = {};
    noSleep = new NoSleep();
    appIsVisible$ = new Subject<boolean>();

    constructor(
        titleService: Title,
        private router: Router,
        private route: ActivatedRoute,
        private appService: AppService,
        private userService: UserService,
    ) {
        super();

        this.title = toSignal(router.events.pipe(
            map(_ => titleService.getTitle().replaceAll("-", "/"))
        ));

        document.addEventListener("visibilitychange", _ => {
            this.appIsVisible$.next(document.visibilityState === "visible");
        });

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

        this.menuItems.push({
            separator: true
        });

        this.menuItems.push({
            ...LogoutMenuItem, command: () => {
                this.userService.logout().then(async () => {
                    await this.userService.logout();
                    void this.router.navigate(["../login"]);
                });
            }
        });

        this.userService.isLoggedIn()
            .pipe(takeUntilDestroyed())
            .subscribe((logged) => {
                this.logged.set(logged);
                this.loading.set(false);
            });
    }
}
