import {Injectable} from "@angular/core";
import {Action, Selector, State, StateContext} from "@ngxs/store";
import {append, patch, removeItem, updateItem} from "@ngxs/store/operators";
import {environment} from "../../environments/environment";
import {StatisticStoredInterface} from "@models";
import {AddStatistic, FillStatistics, InvalideStatistics, RemoveStatistic, UpdateStatistic} from "./statistic.action";

export interface StatisticStateInterface {
    all: StatisticStoredInterface[];
    lastUpdated: Date | null;
}

@Injectable()
@State<StatisticStateInterface>({
    name: "statistics",
    defaults: {
        all: [],
        lastUpdated: null,
    }
})
export class StatisticState {
    @Selector()
    static lastUpdated(state: StatisticStateInterface): Date | null {
        return state.lastUpdated;
    }

    @Selector()
    static all(state: StatisticStateInterface): StatisticStoredInterface[] {
        return state.all;
    }

    @Action(FillStatistics)
    fill({
             getState,
             patchState
         }: StateContext<StatisticStateInterface>, {payload}: FillStatistics) {
        patchState({
            all: payload,
            lastUpdated: environment["APP_OFFLINE"] ? null : new Date()
        });
    }

    @Action(InvalideStatistics)
    invalidate({
                   patchState
               }: StateContext<StatisticStateInterface>, {}: FillStatistics) {
        patchState({
            all: [],
            lastUpdated: null
        });
    }

    @Action(AddStatistic)
    add({setState}: StateContext<StatisticStateInterface>, {payload}: AddStatistic) {
        setState(
            patch({
                all: append([payload])
            })
        );
    }

    @Action(RemoveStatistic)
    remove({setState}: StateContext<StatisticStateInterface>, {payload}: RemoveStatistic) {
        setState(
            patch({
                all: removeItem<StatisticStoredInterface>((item?: StatisticStoredInterface) => item?.id === payload.id)
            })
        );
    }

    @Action(UpdateStatistic)
    update({
               getState,
               patchState,
               setState
           }: StateContext<StatisticStateInterface>, {payload}: UpdateStatistic) {
        setState(
            patch({
                all: updateItem<StatisticStoredInterface>((item?: StatisticStoredInterface) => item?.id === payload.id, payload)
            })
        );
    }
}
