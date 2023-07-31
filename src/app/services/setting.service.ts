import {DatastoreService} from "./datastore.service";
import {inject, Injectable} from "@angular/core";
import {SettingModel, SettingStoredInterface} from "@models";
import {Select, Store} from "@ngxs/store";
import {LoggerService} from "./logger.service";
import {ActivatedRouteSnapshot, ResolveFn} from "@angular/router";
import {MessageService} from "primeng/api";
import {Observable} from "rxjs";
import {AddSetting, FillSettings, InvalideSettings, RemoveSetting, SettingState, UpdateSetting} from "@stores";

@Injectable({
    providedIn: 'root'
})
export class SettingService extends DatastoreService<SettingStoredInterface, SettingModel> {
    @Select(SettingState.lastUpdated) override lastUpdated$?: Observable<Date>;
    // Données du store
    @Select(SettingState.all) protected override all$?: Observable<SettingStoredInterface[]>;

    constructor(messageService: MessageService,
                protected override loggerService: LoggerService,
                store: Store) {
        super(messageService, loggerService, 'setting', $localize`setting`, SettingModel, store,
            AddSetting, UpdateSetting, RemoveSetting, FillSettings, InvalideSettings);
    }
}

export const settingResolver: ResolveFn<SettingModel | undefined> =
    (route: ActivatedRouteSnapshot) => {
        return inject(SettingService).getById(route.paramMap.get('id')!);
    };
