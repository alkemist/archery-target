import {ChangeDetectionStrategy, Component, OnInit} from "@angular/core";
import BaseComponent from "@base-component";
import {ShootingService} from "../../../services/shooting.service";

@Component({
    templateUrl: "./stats.component.html",
    styleUrls: ["./stats.component.scss"],
    host: {
        class: "page-container"
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsComponent extends BaseComponent implements OnInit {

    constructor(
        private shootingService: ShootingService,
    ) {
        super();
    }


    async ngOnInit() {
        // Par distance et par cible :
        //  - Max
        //      - Score
        //      - Groupement
        //  - Moyenne
        //      - Score
        //      - Groupement
        // Nombre de flèches
        //  - Total
        //  - Par mois


        return this.shootingService.getListOrRefresh().then((shootings) => {

        });
    }
}
