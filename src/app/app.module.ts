import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {HeaderComponent, HomeComponent, LoginComponent} from '@components';

import './app.database';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './modules/app-routing.module';
import {StoringModule} from './modules/storing.module';
import {SharingModule} from './modules/sharing.module';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        HomeComponent,
        HeaderComponent,
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
