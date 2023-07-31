export abstract class DateHelper {
    static seconds(date: Date = new Date()) {
        return Math.round(date.getTime() / 1000);
    }

    static dateToName(date: Date) {
        return date.toLocaleDateString("fr").substring(0, 5)
    }

    static secondToName(second: number) {
        return DateHelper.dateToName(new Date(second))
    }
}
