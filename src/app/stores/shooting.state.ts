import {Injectable} from "@angular/core";
import {ShootingStoredInterface} from "@models";
import {Action, Selector, State, StateContext} from "@ngxs/store";
import {append, patch, removeItem, updateItem} from "@ngxs/store/operators";
import {AddShooting, FillShootings, InvalideShootings, RemoveShooting, UpdateShooting} from "./shooting.action";
import {environment} from "../../environments/environment";

export interface ShootingStateInterface {
    all: ShootingStoredInterface[];
    lastUpdated: Date | null;
}

@Injectable()
@State<ShootingStateInterface>({
    name: "shootings",
    defaults: {
        all: [],
        lastUpdated: null,
    }
})
export class ShootingState {
    @Selector()
    static lastUpdated(state: ShootingStateInterface): Date | null {
        return state.lastUpdated;
    }

    @Selector()
    static all(state: ShootingStateInterface): ShootingStoredInterface[] {
        return state.all;
    }

    @Action(FillShootings)
    fill({
             getState,
             patchState
         }: StateContext<ShootingStateInterface>, {payload}: FillShootings) {
        patchState({
            all: payload,
            lastUpdated: environment["APP_OFFLINE"] ? null : new Date()
        });
    }

    @Action(InvalideShootings)
    invalidate({
                   patchState
               }: StateContext<ShootingStateInterface>, {}: FillShootings) {
        patchState({
            all: [],
            lastUpdated: null
        });
    }

    @Action(AddShooting)
    add({setState}: StateContext<ShootingStateInterface>, {payload}: AddShooting) {
        setState(
            patch({
                all: append([payload])
            })
        );
    }

    @Action(RemoveShooting)
    remove({setState}: StateContext<ShootingStateInterface>, {payload}: RemoveShooting) {
        setState(
            patch({
                all: removeItem<ShootingStoredInterface>((item?: ShootingStoredInterface) => item?.id === payload.id)
            })
        );
    }

    @Action(UpdateShooting)
    update({
               getState,
               patchState,
               setState
           }: StateContext<ShootingStateInterface>, {payload}: UpdateShooting) {
        setState(
            patch({
                all: updateItem<ShootingStoredInterface>((item?: ShootingStoredInterface) => item?.id === payload.id, payload)
            })
        );
    }
}
