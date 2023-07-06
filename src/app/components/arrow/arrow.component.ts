import {ChangeDetectionStrategy, Component} from "@angular/core";
import BaseComponent from "@base-component";

@Component({
    template: `
        <div class="arrow"></div>
    `,
    styleUrls: ["./arrow.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrowComponent extends BaseComponent {
    constructor() {
        super();
    }
}
