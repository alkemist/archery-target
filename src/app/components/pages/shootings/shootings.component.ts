import {ChangeDetectionStrategy, Component, signal} from "@angular/core";
import BaseComponent from "@base-component";
import {ShootingService} from "../../../services/shooting.service";
import {ShootingModel} from "@models";
import {CompareHelper} from "@alkemist/compare-engine";
import {ConfirmationService} from "primeng/api";


@Component({
    templateUrl: "./shootings.component.html",
    styleUrls: ["./shootings.component.scss"],
    host: {
        class: "page-container"
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShootingsComponent extends BaseComponent {
    shootings = signal<ShootingModel[]>([]);
    loading = signal<boolean>(true);
    typeToken?: ShootingModel
    toShootingModel = CompareHelper.isT<ShootingModel>;

    constructor(
        private shootingService: ShootingService,
        private confirmationService: ConfirmationService,
    ) {
        super();
    }

    async ngOnInit(): Promise<void> {
        return this.loadShootings();
    }

    loadShootings() {
        return this.shootingService.getListOrRefresh().then((shootings) => {
            this.shootings.set(shootings);
            this.loading.set(false);
        });
    }

    remove(shooting: ShootingModel) {
        this.confirmationService.confirm({
            key: "shooting",
            message: $localize`Are you sure you want to remove shooting ?`,
            accept: () => {
                this.shootingService.remove(shooting).then(() => {
                    return this.loadShootings();
                })
            }
        });
    }
}
