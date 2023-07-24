import {
    ArrowModel,
    CoordinateInterface,
    DocumentModel,
    HasIdInterface,
    ShootingBackInterface,
    ShootingFormInterface,
    ShootingFrontInterface,
    ShootingStoredInterface
} from "@models";
import {MathHelper, slugify} from "@tools";
import {CompareHelper} from "@alkemist/ng-form-supervisor";

export class ShootingModel extends DocumentModel implements HasIdInterface {
    private _date: Date;
    private readonly _dateSeconds: number;
    private _distance: number;
    private _target: number;
    private _score: number;
    private _groupingScore: number | null;
    private _center: CoordinateInterface | null = null;
    private _arrows: ArrowModel[];

    constructor(shooting?: Partial<ShootingFrontInterface> | ShootingStoredInterface) {
        const date = shooting && shooting.date ? shooting.date
            : shooting && shooting.dateSeconds ? new Date(shooting.dateSeconds)
                : new Date();

        if (!shooting?.date && !shooting?.dateSeconds) {
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
        }

        const arrows = ((shooting && shooting.arrows) ? shooting.arrows : [])
            .map((arrow) => new ArrowModel(arrow));

        const shootingData = {
            ...shooting,
            id: shooting && CompareHelper.isEvaluable(shooting.id) ? shooting.id : '',
            date: date,
            dateSeconds: shooting && CompareHelper.isEvaluable(shooting.dateSeconds) ? shooting.dateSeconds : 0,
            distance: shooting && CompareHelper.isEvaluable(shooting.distance) ? shooting.distance : 0,
            target: shooting && CompareHelper.isEvaluable(shooting.target) ? shooting.target : 0,
            score: shooting && CompareHelper.isEvaluable(shooting.score) ? shooting.score : 0,
            groupingScore: shooting && CompareHelper.isEvaluable(shooting.groupingScore) ? shooting.groupingScore : null,
            arrows: arrows
        }

        super(shootingData as ShootingStoredInterface);

        this._date = shootingData.date;
        this._dateSeconds = shootingData.dateSeconds;
        this._distance = shootingData.distance;
        this._target = shootingData.target;
        this._score = shootingData.score;
        this._groupingScore = shootingData.groupingScore;
        this._arrows = shootingData.arrows;
    }

    get description(): string {
        let specifications = [];
        if (this._distance) {
            specifications.push(this._distance + 'm');
        }
        if (this._target) {
            specifications.push(this._target + 'cm');
        }
        return specifications.join(" / ")
    }

    get date(): Date {
        return this._date;
    }

    set date(date: Date) {
        this._date = date;
    }

    get dateSeconds(): number {
        return this._dateSeconds;
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

    get score(): number {
        return this._score;
    }

    set score(score: number) {
        this._score = score;
    }

    get groupingScore(): number | null {
        return this._groupingScore;
    }

    set groupingScore(groupingScore: number | null) {
        this._groupingScore = groupingScore;
    }

    get arrowCount(): number {
        return this._arrows.length;
    }

    get center(): CoordinateInterface | null {
        return this._center;
    }

    set center(center: CoordinateInterface | null) {
        this._center = center;
    }

    get arrows(): ArrowModel[] {
        return this._arrows;
    }

    set arrows(arrows: ArrowModel[]) {
        this._arrows = arrows;
    }

    addArrow(arrow: ArrowModel) {
        this._arrows.push(arrow);
        this.sortArrows();
        this._score = this.calculScore();
        this._center = this.calculCenter();
    }

    removeArrow(index: number) {
        this._arrows.splice(index, 1);
        this._score = this.calculScore();
        this._center = this.calculCenter();
    }

    calculScore() {
        return this._arrows.reduce((score, arrow) => score + arrow.score, 0);
    }

    calculCenter(): CoordinateInterface | null {
        return MathHelper.center(this._arrows.map(arrow => arrow.center))
    }

    sortArrows() {
        this._arrows = this._arrows
            .sort((arrow1, arrow2) => arrow1.distance - arrow2.distance)
    }

    override toFirestore(): ShootingBackInterface {
        return {
            ...super.toFirestore(),
            dateSeconds: MathHelper.round(this._date.getTime(), 0),
            distance: this._distance,
            target: this._target,
            score: this._score,
            groupingScore: this._groupingScore,
            center: this._center,
            arrows: this._arrows.map(arrow => arrow.toFirestore()),
        }
    }

    toFormData(): ShootingFormInterface {
        return {
            date: this._date,
            distance: this._distance,
            target: this._target,
            arrows: this._arrows.map(arrow => arrow.toFormData())
        };
    }

    updateNameAndSlug() {
        this._name = this._date.toLocaleDateString("fr").substring(0, 5);
        this._slug = slugify(this._name);
    }
}
