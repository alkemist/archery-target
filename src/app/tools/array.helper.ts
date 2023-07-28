import {slugify} from './slugify';
import {KeyValue} from '@angular/common';
import {SortEvent} from "primeng/api";

export abstract class ArrayHelper {
    static sortBy<T>(array: T[], field: string): T[] {
        return array.sort((a: any, b: any) => {
            const aValue = slugify(a[field]!);
            const bValue = slugify(b[field]!);
            return (aValue > bValue) ? 1 : ((bValue > aValue) ? -1 : 0);
        });
    }

    static recordToList<T extends string, U>(record: Record<T, U>): KeyValue<string, U>[] {
        return Object.entries<U>(record).map(([t, u]: [string, U]) => ({
            key: t,
            value: u as U
        }));
    }

    static listToRecord<
        T extends { [K in keyof T]: string | number },
        K extends keyof T
    >(array: T[], selector: K): Record<T[K], T> {
        return array.reduce(
            (acc, item) => {
                acc[item[selector]] = item;
                return acc;
            }, {} as Record<T[K], T>
        )
    }

    static sort(event: SortEvent, data1: any, data2: any) {
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
    }
}
