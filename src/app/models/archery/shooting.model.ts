import {
    ArrowModel,
    DocumentModel,
    HasIdInterface,
    ShootingBackInterface,
    ShootingFormInterface,
    ShootingFrontInterface,
    ShootingStoredInterface
} from "@models";
import {slugify} from "@tools";

export class ShootingModel extends DocumentModel implements HasIdInterface {
    private _date: Date;
    private _distance: number;
    private _score: number;
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
            score: shooting && shooting.score ? shooting.score : 0,
            arrows: arrows
        }

        super(shootingData as ShootingStoredInterface);

        this._date = shootingData.date;
        this._distance = shootingData.distance;
        this._score = shootingData.score;
        this._arrows = shootingData.arrows;
        this.updateScore();
        this.updateNameAndSlug();
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

    get score(): number {
        return this._score;
    }

    set score(score: number) {
        this._score = score;
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
        this.updateScore();
    }

    removeArrow(index: number) {
        this._arrows.splice(index, 1);
        this.updateScore();
    }

    updateScore() {
        this._score = this._arrows.reduce((score, arrow) => score + arrow.score, 0)
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
            score: this._score,
            arrows: this._arrows.map(arrow => arrow.toFirestore()),
        }
    }

    toDialogForm(): ShootingFormInterface {
        return {
            date: this._date,
            distance: this._distance,
        };
    }

    updateNameAndSlug() {
        this._name = this._date.toLocaleDateString("fr").substring(0, 5);
        this._slug = slugify(this._name);
    }
}
