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

export class ShootingModel extends DocumentModel implements HasIdInterface {
    private _date: Date;
    private _distance: number;
    private _target: number;
    private _score: number;
    private _groupingScore: number;
    private _center: CoordinateInterface | null = null;
    private _arrows: ArrowModel[];

    constructor(shooting?: Partial<ShootingFrontInterface> | ShootingStoredInterface) {
        const date = shooting && shooting.date ? shooting.date
            : shooting && shooting.dateSeconds ? new Date(shooting.dateSeconds)
                : new Date();

        const arrows = ((shooting && shooting.arrows) ? shooting.arrows : [])
            .map((arrow) => new ArrowModel(arrow));

        const shootingData = {
            ...shooting,
            id: shooting && shooting.id ? shooting.id : '',
            date: date,
            distance: shooting && shooting.distance ? shooting.distance : 0,
            target: shooting && shooting.target ? shooting.target : 0,
            score: shooting && shooting.score ? shooting.score : 0,
            groupingScore: shooting && shooting.groupingScore ? shooting.groupingScore : 0,
            arrows: arrows
        }

        super(shootingData as ShootingStoredInterface);

        this._date = shootingData.date;
        this._distance = shootingData.distance;
        this._target = shootingData.target;
        this._score = shootingData.score;
        this._groupingScore = shootingData.groupingScore;
        this._arrows = shootingData.arrows;
    }

    get date(): Date {
        return this._date;
    }

    set date(date: Date) {
        this._date = date;
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

    get groupingScore(): number {
        return this._groupingScore;
    }

    set groupingScore(groupingScore: number) {
        this._groupingScore = groupingScore;
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
            dateSeconds: this._date.getTime(),
            distance: this._distance,
            target: this._target,
            score: this._score,
            groupingScore: this._groupingScore,
            center: this._center,
            arrows: this._arrows.map(arrow => arrow.toFirestore()),
        }
    }

    toDialogForm(): ShootingFormInterface {
        return {
            date: this._date,
            distance: this._distance,
            target: this._target,
        };
    }

    updateNameAndSlug() {
        this._name = this._date.toLocaleDateString("fr").substring(0, 5);
        this._slug = slugify(this._name);
    }
}
