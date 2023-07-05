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
import {HomeComponent, LoginComponent} from "@components";
import {AppService, UserService} from "@services";
import {map, Observable} from "rxjs";

const logginInGuard: CanActivateFn = (): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
    const userService = inject(UserService);
    const router = inject(Router);
    return userService.isLoggedIn().pipe(map(isLogged => {
        if (isLogged) {
            void router.navigate(["/home"]);
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
    {path: "", redirectTo: "home", pathMatch: "full"},
    {
        path: "login",
        canActivate: [logginInGuard],
        component: LoginComponent,
        title: "Login",
    },
    {
        path: "home",
        canActivate: [loggedInGuard],
        component: HomeComponent,
        title: "Home",
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
