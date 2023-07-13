import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {ArrowComponent, BlockableComponent, HeaderComponent, LoginComponent, ShootingComponent} from '@components';

import './app.database';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './modules/app-routing.module';
import {StoringModule} from './modules/storing.module';
import {SharingModule} from './modules/sharing.module';
import {ShootingsComponent} from "./components/pages/shootings/shootings.component";
import {CenterComponent} from "./components/center/center.component";

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        ShootingComponent,
        ShootingsComponent,
        HeaderComponent,
        BlockableComponent,
        ArrowComponent,
        CenterComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        StoringModule,
        SharingModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
