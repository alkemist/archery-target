import {HasIdInterface, SettingStoredInterface} from '@models';
import {AddDocument, FillDocuments, InvalideDocuments, RemoveDocument, UpdateDocument} from './document.action';

export class AddSetting extends AddDocument<SettingStoredInterface> {
    static override readonly type: string = '[Setting] Added';

    constructor(payload: SettingStoredInterface) {
        super(payload);
    }
}

export class UpdateSetting extends UpdateDocument<SettingStoredInterface> {
    static override readonly type: string = '[Setting] Updated';

    constructor(payload: SettingStoredInterface) {
        super(payload);
    }
}

export class RemoveSetting extends RemoveDocument<HasIdInterface> {
    static override readonly type: string = '[Setting] Removed';

    constructor(payload: HasIdInterface) {
        super(payload);
    }
}

export class FillSettings extends FillDocuments<SettingStoredInterface> {
    static override readonly type: string = '[Setting] Filled';

    constructor(payload: SettingStoredInterface[]) {
        super(payload);
    }
}

export class InvalideSettings extends InvalideDocuments<SettingStoredInterface> {
    static override readonly type: string = '[Setting] Invalided';

    constructor() {
        super();
    }
}
