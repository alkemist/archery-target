import {NgModule} from "@angular/core";
import {NgxsReduxDevtoolsPluginModule} from "@ngxs/devtools-plugin";
import {NgxsLoggerPluginModule} from "@ngxs/logger-plugin";
import {NgxsStoragePluginModule} from "@ngxs/storage-plugin";
import {NgxsModule} from "@ngxs/store";
import {SettingState, ShootingState, StatisticState} from "@stores";
import {environment} from "../../environments/environment";


const states = [
    ShootingState,
    SettingState,
    StatisticState
];

@NgModule({
    imports: [
        NgxsModule.forRoot(states, {
            developmentMode: environment["APP_DEBUG"]
        }),
        NgxsReduxDevtoolsPluginModule.forRoot({
            disabled: !environment["APP_DEBUG"],
        }),
        NgxsLoggerPluginModule.forRoot({
            disabled: !environment["APP_DEBUG"],
        }),
        NgxsStoragePluginModule.forRoot()
    ],
    exports: [
        NgxsModule
    ],
})
export class StoringModule {
}
