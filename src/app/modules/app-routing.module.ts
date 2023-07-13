import {inject, Injectable, NgModule} from "@angular/core";
import {
    CanActivateFn,
    Router,
    RouterModule,
    RouterStateSnapshot,
    Routes,
    TitleStrategy,
    UrlTree
} from "@angular/router";
import {LoginComponent, ShootingComponent} from "@components";
import {AppService, UserService} from "@services";
import {map, Observable} from "rxjs";
import {shootingResolver} from "../services/shooting.service";
import BaseComponent from "@base-component";
import {ShootingsComponent} from "../components/pages/shootings/shootings.component";

const logginInGuard: CanActivateFn = (): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
    const userService = inject(UserService);
    const router = inject(Router);
    return userService.isLoggedIn().pipe(map(isLogged => {
        if (isLogged) {
            void router.navigate(["/shooting"]);
        }
        return !isLogged;
    }));
};
const loggedInGuard: CanActivateFn = (): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
    const userService = inject(UserService);
    const router = inject(Router);
    return userService.isLoggedIn().pipe(map(isLogged => {
        if (!isLogged) {
            void router.navigate(["/login"]);
        }
        return isLogged;
    }));
};

const routes: Routes = [
    {path: "", redirectTo: "shooting", pathMatch: "full"},
    {
        path: "login",
        canActivate: [logginInGuard],
        component: LoginComponent,
        title: "Login",
    },
    {
        path: "shooting",
        canActivate: [],
        component: ShootingComponent,
        title: "Shooting",
    },
    {
        path: "shootings",
        canActivate: [loggedInGuard],
        component: ShootingsComponent,
        title: "Shootings",
    },
    {
        path: "shooting/:id",
        canActivate: [loggedInGuard],
        component: ShootingComponent,
        canDeactivate: [(component: BaseComponent) => component.canDeactivate()],
        resolve: {shooting: shootingResolver},
        title: "Shootings",
    },
];

@Injectable()
export class TemplatePageTitleStrategy extends TitleStrategy {
    constructor(private readonly appService: AppService) {
        super();
    }

    override updateTitle(routerState: RouterStateSnapshot) {
        const title = this.buildTitle(routerState);
        this.appService.setTitle(title);
    }
}

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
    providers: [
        {
            provide: TitleStrategy,
            useClass: TemplatePageTitleStrategy
        }
    ]
})
export class AppRoutingModule {
}
