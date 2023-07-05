import {ChangeDetectionStrategy, Component, OnInit} from "@angular/core";
import BaseComponent from "@base-component";

@Component({
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
    host: {
        class: "page-container"
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent extends BaseComponent implements OnInit {
    constructor() {
        super();
    }

    ngOnInit(): void {

    }
}
