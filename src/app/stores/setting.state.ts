import {Injectable} from "@angular/core";
import {Action, Selector, State, StateContext} from "@ngxs/store";
import {append, patch, removeItem, updateItem} from "@ngxs/store/operators";
import {environment} from "../../environments/environment";
import {SettingStoredInterface} from "@models";
import {AddSetting, FillSettings, InvalideSettings, RemoveSetting, UpdateSetting} from "./setting.action";

export interface SettingStateInterface {
    all: SettingStoredInterface[];
    lastUpdated: Date | null;
}

@Injectable()
@State<SettingStateInterface>({
    name: "settings",
    defaults: {
        all: [],
        lastUpdated: null,
    }
})
export class SettingState {
    @Selector()
    static lastUpdated(state: SettingStateInterface): Date | null {
        return state.lastUpdated;
    }

    @Selector()
    static all(state: SettingStateInterface): SettingStoredInterface[] {
        return state.all;
    }

    @Action(FillSettings)
    fill({
             getState,
             patchState
         }: StateContext<SettingStateInterface>, {payload}: FillSettings) {
        patchState({
            all: payload,
            lastUpdated: environment["APP_OFFLINE"] ? null : new Date()
        });
    }

    @Action(InvalideSettings)
    invalidate({
                   patchState
               }: StateContext<SettingStateInterface>, {}: FillSettings) {
        patchState({
            all: [],
            lastUpdated: null
        });
    }

    @Action(AddSetting)
    add({setState}: StateContext<SettingStateInterface>, {payload}: AddSetting) {
        setState(
            patch({
                all: append([payload])
            })
        );
    }

    @Action(RemoveSetting)
    remove({setState}: StateContext<SettingStateInterface>, {payload}: RemoveSetting) {
        setState(
            patch({
                all: removeItem<SettingStoredInterface>((item?: SettingStoredInterface) => item?.id === payload.id)
            })
        );
    }

    @Action(UpdateSetting)
    update({
               getState,
               patchState,
               setState
           }: StateContext<SettingStateInterface>, {payload}: UpdateSetting) {
        setState(
            patch({
                all: updateItem<SettingStoredInterface>((item?: SettingStoredInterface) => item?.id === payload.id, payload)
            })
        );
    }
}
