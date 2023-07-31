import {HasIdInterface, StatisticStoredInterface} from '@models';
import {AddDocument, FillDocuments, InvalideDocuments, RemoveDocument, UpdateDocument} from './document.action';

export class AddStatistic extends AddDocument<StatisticStoredInterface> {
    static override readonly type: string = '[Statistic] Added';

    constructor(payload: StatisticStoredInterface) {
        super(payload);
    }
}

export class UpdateStatistic extends UpdateDocument<StatisticStoredInterface> {
    static override readonly type: string = '[Statistic] Updated';

    constructor(payload: StatisticStoredInterface) {
        super(payload);
    }
}

export class RemoveStatistic extends RemoveDocument<HasIdInterface> {
    static override readonly type: string = '[Statistic] Removed';

    constructor(payload: HasIdInterface) {
        super(payload);
    }
}

export class FillStatistics extends FillDocuments<StatisticStoredInterface> {
    static override readonly type: string = '[Statistic] Filled';

    constructor(payload: StatisticStoredInterface[]) {
        super(payload);
    }
}

export class InvalideStatistics extends InvalideDocuments<StatisticStoredInterface> {
    static override readonly type: string = '[Statistic] Invalided';

    constructor() {
        super();
    }
}
