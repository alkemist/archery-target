import {MathHelper} from "@tools";
import {ArrowModel, CoordinateInterface, ShootingModel} from "@models";

export class ScoreCalculator {
    static ERROR_MARGIN = 10;

    // Value with default target image
    static DEFAULT_RAYON = 151.2;
    static DEFAULT_CENTER: CoordinateInterface = {x: 1612, y: 1612};

    rayons: number[] = [];

    constructor(
        private targetCenter: CoordinateInterface = ScoreCalculator.DEFAULT_CENTER,
        rayon: number = ScoreCalculator.DEFAULT_RAYON,
        distance?: number,
        target?: number
    ) {
        let multiplicator = 1;

        if (distance && target) {
            const default_target = distance < 60 ? 80 : 122;
            multiplicator = default_target / target;
        }

        this.rayons = Array.from({length: 10}, (_, i) =>
            MathHelper.round(((rayon * (i + 1)) + ScoreCalculator.ERROR_MARGIN) * multiplicator)
        )
    }

    calculStatisticScore(shooting: ShootingModel) {
        return shooting.arrows.reduce((score, arrow) => score + this.calculScore(arrow), 0)
    }

    calculScore(arrow: ArrowModel): number {
        const index = this.rayons.findIndex((rayon) =>
            MathHelper.inCircle(arrow.center, this.targetCenter, rayon)
        )

        return 10 - (index > -1 ? index : 10);
    }
}