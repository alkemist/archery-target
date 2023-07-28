import {ChangeDetectionStrategy, Component, computed, signal} from "@angular/core";
import BaseComponent from "@base-component";
import {ShootingService} from "../../../services/shooting.service";
import {ShootingModel} from "@models";
import {ConfirmationService, SortEvent} from "primeng/api";
import {CompareHelper} from "@alkemist/ng-form-supervisor";
import {ArrayHelper} from "@tools";


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
    toShootingModel = CompareHelper.isT<ShootingModel>;

    filteredShootings = signal<ShootingModel[]>([]);
    selectedShootings = signal<ShootingModel[]>([]);

    totalScore = computed(() =>
        this.selectedShootings().length > 1
            ? this.selectedShootings().reduce((total: number, shooting: ShootingModel) => total + shooting.score, 0)
            : this.filteredShootings().reduce((total: number, shooting: ShootingModel) => total + shooting.score, 0)
    );
    totalArrows = computed(() =>
        this.selectedShootings().length > 1
            ? this.selectedShootings().reduce((total: number, shooting: ShootingModel) => total + shooting.arrows.length, 0)
            : this.filteredShootings().reduce((total: number, shooting: ShootingModel) => total + shooting.arrows.length, 0)
    );

    targets = [
        40,
        60,
        80,
        120
    ]

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
            this.filteredShootings.set(shootings);
            this.loading.set(false);
        });
    }

    remove(shooting: ShootingModel) {
        this.confirmationService.confirm({
            key: "header",
            message: $localize`Are you sure you want to remove shooting ?`,
            accept: () => {
                this.shootingService.remove(shooting).then(() => {
                    return this.loadShootings();
                })
            }
        });
    }

    customSort(event: SortEvent) {
        event.data?.sort((data1, data2) => ArrayHelper.sort(event, data1, data2));
    }

    onFilter($event: any) {
        this.filteredShootings.set($event.filteredValue);
    }

    onSelection(selectedShootings: ShootingModel[]) {
        this.selectedShootings.set(selectedShootings)
    }
}
