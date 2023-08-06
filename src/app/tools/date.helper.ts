export abstract class DateHelper {
  static seconds(date: Date = new Date()) {
    return Math.round(date.getTime() / 1000);
  }

  static dateToName(date: Date) {
    return date.toLocaleDateString("fr").substring(0, 5)
      + '/'
      + date.toLocaleDateString("fr").substring(8, 10)
  }

  static secondToName(second: number) {
    return DateHelper.dateToName(new Date(second))
  }

  static reset(date: Date) {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }
}
