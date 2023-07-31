import {DocumentModel, HasIdInterface} from "@models";
import {StatisticBackInterface, StatisticStoredInterface} from "./statistic.interface";
import {DateHelper, slugify} from "@tools";

export class StatisticModel extends DocumentModel implements HasIdInterface {
    totalScore = 0;
    totalGroup = 0;
    countGroup = 0;

    private _distance: number;
    private _target: number;
    private _dateSeconds: number;
    private _averageArrow: number;
    private _averageGroup: number;
    private _averageScore: number;
    private _arrows: number;

    constructor(statistic: Partial<StatisticStoredInterface> | StatisticStoredInterface) {
        super(statistic ?? {id: '', name: '', slug: ''});

        this._dateSeconds = statistic.dateSeconds ?? (new Date()).getTime();
        this._distance = statistic?.distance ?? 0;
        this._target = statistic?.target ?? 0;
        this._averageArrow = statistic?.averageArrow ?? 0;
        this._averageGroup = statistic?.averageGroup ?? 0;
        this._averageScore = statistic?.averageScore ?? 0;
        this._arrows = statistic?.arrows ?? 0;

        this.updateNameAndSlug();
    }

    get dateStr(): string {
        return DateHelper.secondToName(this._dateSeconds);
    }

    get arrows(): number {
        return this._arrows
    }

    set arrows(arrows: number) {
        this._arrows = arrows;
    }

    get distance(): number {
        return this._distance;
    }

    set distance(distance: number) {
        this._distance = distance;
    }

    get target(): number {
        return this._target;
    }

    set target(target: number) {
        this._target = target;
    }

    get dateSeconds(): number {
        return this._dateSeconds;
    }

    set dateSeconds(dateSeconds: number) {
        this._dateSeconds = dateSeconds;
    }

    get averageArrow(): number {
        return this._averageArrow;
    }

    set averageArrow(averageArrow: number) {
        this._averageArrow = averageArrow;
    }

    get averageGroup(): number {
        return this._averageGroup;
    }

    set averageGroup(averageGroup: number) {
        this._averageGroup = averageGroup;
    }

    get averageScore(): number {
        return this._averageScore;
    }

    set averageScore(averageScore: number) {
        this._averageScore = averageScore;
    }

    updateNameAndSlug() {
        this._name = `${this.dateStr} - ${this.distance} - ${this.target}`;
        this._slug = slugify(this._name);
    }

    override toFirestore(): StatisticBackInterface {
        return {
            ...super.toFirestore(),
            distance: this._distance,
            target: this._target,
            dateSeconds: this._dateSeconds,
            averageArrow: this._averageArrow,
            averageGroup: this._averageGroup,
            averageScore: this._averageScore,
            arrows: this._arrows,
        }
    }
}