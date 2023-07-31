export class SmartMap<K, V> extends Map<K, V> {
    constructor() {
        super();
    }

    toArray(): V[] {
        return [...this.values()];
    }
}
