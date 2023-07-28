import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {
    ArrowComponent,
    BlockableComponent,
    CenterComponent,
    HeaderComponent,
    LoginComponent,
    SettingsComponent,
    ShootingComponent,
    ShootingsComponent,
    StatsComponent
} from '@components';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './modules/app-routing.module';
import {StoringModule} from './modules/storing.module';
import {SharingModule} from './modules/sharing.module';
import './app.database';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        ShootingComponent,
        ShootingsComponent,
        SettingsComponent,
        StatsComponent,
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
