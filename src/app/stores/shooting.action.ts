import {HasIdInterface, ShootingStoredInterface} from '@models';
import {AddDocument, FillDocuments, InvalideDocuments, RemoveDocument, UpdateDocument} from './document.action';

export class AddShooting extends AddDocument<ShootingStoredInterface> {
    static override readonly type: string = '[Shooting] Added';

    constructor(payload: ShootingStoredInterface) {
        super(payload);
    }
}

export class UpdateShooting extends UpdateDocument<ShootingStoredInterface> {
    static override readonly type: string = '[Shooting] Updated';

    constructor(payload: ShootingStoredInterface) {
        super(payload);
    }
}

export class RemoveShooting extends RemoveDocument<HasIdInterface> {
    static override readonly type: string = '[Shooting] Removed';

    constructor(payload: HasIdInterface) {
        super(payload);
    }
}

export class FillShootings extends FillDocuments<ShootingStoredInterface> {
    static override readonly type: string = '[Shooting] Filled';

    constructor(payload: ShootingStoredInterface[]) {
        super(payload);
    }
}

export class InvalideShootings extends InvalideDocuments<ShootingStoredInterface> {
    static override readonly type: string = '[Shooting] Invalided';

    constructor() {
        super();
    }
}
