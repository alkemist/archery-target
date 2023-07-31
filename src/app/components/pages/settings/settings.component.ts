import {ChangeDetectionStrategy, Component, signal, ViewChild} from "@angular/core";
import BaseComponent from "@base-component";
import {SettingModel} from "@models";
import {ConfirmationService, SortEvent} from "primeng/api";
import {CompareHelper} from "@alkemist/ng-form-supervisor";
import {ArrayHelper} from "@tools";
import {Table} from "primeng/table";
import {TARGETS} from "../../../models/archery/targets";
import {DISTANCES} from "../../../models/archery/distances";
import {MapBuilder} from "../../../services/map.builder";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {SettingService} from "../../../services/setting.service";


@Component({
    templateUrl: "./settings.component.html",
    styleUrls: ["./settings.component.scss"],
    host: {
        class: "page-container"
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent extends BaseComponent {
    @ViewChild('dt', {static: false}) table?: Table

    distances = DISTANCES;
    settings = signal<SettingModel[]>([]);
    loading = signal<boolean>(true);
    toSettingModel = CompareHelper.isT<SettingModel>;
    clonedSettings: { [s: string]: SettingModel } = {};

    targets = [
        40,
        60,
        80,
        120
    ]
    protected readonly TARGETS = TARGETS;

    constructor(
        private mapBuilder: MapBuilder,
        private settingService: SettingService,
        private confirmationService: ConfirmationService,
    ) {
        super();

        this.mapBuilder.onSettingsChange$
            .pipe(takeUntilDestroyed())
            .subscribe((settings) => {
                this.settings.set(settings)
                this.loading.set(false);
            })

        this.mapBuilder.reloadSettings();
    }

    add() {
        const setting = new SettingModel();
        this.settings().push(setting);
        this.table?.initRowEdit(setting);
    }

    onRowEditInit(setting: SettingModel) {
        this.clonedSettings[setting.id] = CompareHelper.deepClone(setting);
    }

    onRowEditSave(setting: SettingModel) {
        setting.distance = parseInt(setting.distance.toString())

        setting.updateNameAndSlug();

        if (setting.id) {
            this.settingService.update(setting).then(() => {
                delete this.clonedSettings[setting.id as string];

                this.table?.sortSingle();

                return this.mapBuilder.reloadSettings();
            })
        } else {
            this.settingService.add(setting).then(() => {
                this.table?.sortSingle();

                return this.mapBuilder.reloadSettings();
            });
        }
    }

    onRowEditCancel(setting: SettingModel, index: number) {
        this.settings()[index] = this.clonedSettings[setting.id as string];
        delete this.clonedSettings[setting.id as string];
    }

    remove(setting: SettingModel) {
        this.confirmationService.confirm({
            key: "header",
            message: $localize`Are you sure you want to remove setting ?`,
            accept: () => {
                this.settingService.remove(setting).then(() => {
                    return this.mapBuilder.reloadSettings();
                })
            }
        });
    }

    customSort(event: SortEvent) {
        event.data?.sort((data1, data2) => ArrayHelper.sortTable(event, data1, data2));
    }
}
