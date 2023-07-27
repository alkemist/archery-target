import {ChangeDetectionStrategy, Component, computed, signal} from "@angular/core";
import BaseComponent from "@base-component";
import {ShootingService} from "../../../services/shooting.service";
import {ShootingModel} from "@models";
import {ConfirmationService, SortEvent} from "primeng/api";
import {CompareHelper} from "@alkemist/ng-form-supervisor";


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
            key: "shooting",
            message: $localize`Are you sure you want to remove shooting ?`,
            accept: () => {
                this.shootingService.remove(shooting).then(() => {
                    return this.loadShootings();
                })
            }
        });
    }

    customSort(event: SortEvent) {
        event.data?.sort((data1, data2) => {
            if (event.field && event.order) {
                let value1 = data1[event.field];
                let value2 = data2[event.field];
                let result;

                if (value1 == null && value2 != null) result = 1;
                else if (value1 != null && value2 == null) result = -1;
                else if (value1 == null && value2 == null) result = 0;
                else if (typeof value1 === 'string' && typeof value2 === 'string') result = value1.localeCompare(value2);
                else result = value1 < value2 ? 1 : value1 > value2 ? -1 : 0;

                return event.order * result;
            }
            return 0;
        });
    }

    onFilter($event: any) {
        this.filteredShootings.set($event.filteredValue);
    }

    onSelection(selectedShootings: ShootingModel[]) {
        this.selectedShootings.set(selectedShootings)
    }
}
