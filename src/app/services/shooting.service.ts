import {DatastoreService} from "./datastore.service";
import {inject, Injectable} from "@angular/core";
import {ShootingModel, ShootingStoredInterface} from "@models";
import {Select, Store} from "@ngxs/store";
import {LoggerService} from "./logger.service";
import {ActivatedRouteSnapshot, ResolveFn} from "@angular/router";
import {AddShooting, FillShootings, InvalideShootings, RemoveShooting, ShootingState, UpdateShooting} from "@stores";
import {MessageService} from "primeng/api";
import {Observable} from "rxjs";
import {ArrayHelper} from "@tools";

@Injectable({
    providedIn: 'root'
})
export class ShootingService extends DatastoreService<ShootingStoredInterface, ShootingModel> {
    @Select(ShootingState.lastUpdated) override lastUpdated$?: Observable<Date>;
    // Données du store
    @Select(ShootingState.all) protected override all$?: Observable<ShootingStoredInterface[]>;

    constructor(messageService: MessageService,
                protected override loggerService: LoggerService,
                store: Store) {
        super(messageService, loggerService, 'shooting', $localize`shooting`, ShootingModel, store,
            AddShooting, UpdateShooting, RemoveShooting, FillShootings, InvalideShootings);
    }

    async lastByDistanceAndTarget(distance: number, target: number) {
        const shootings = (await this.getListOrRefresh())
            .filter(shooting =>
                shooting.distance === distance
                && shooting.target === target)
        if (shootings.length === 0) return null;

        return ArrayHelper.sortBy(shootings, 'dateSeconds')[0];
    }
}

export const shootingResolver: ResolveFn<ShootingModel | undefined> =
    (route: ActivatedRouteSnapshot) => {
        return inject(ShootingService).getById(route.paramMap.get('id')!);
    };
