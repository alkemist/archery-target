import {ChangeDetectionStrategy, Component, HostBinding} from "@angular/core";
import BaseComponent from "@base-component";
import {ArrowModel} from "../../models/archery/arrow.model";

@Component({
    template: `
        ×
    `,
    styleUrls: ["./arrow.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrowComponent extends BaseComponent {
    static size = 100;
    @HostBinding("style.left") x = "0px";
    @HostBinding("style.top") y = "0px";
    @HostBinding("style.width") w = `${ArrowComponent.size}px`;
    @HostBinding("style.height") h = `${ArrowComponent.size}px`;
    @HostBinding("style.borderRadius") z = `${ArrowComponent.size}px`;

    constructor() {
        super();
    }

    setPosition(arrow: ArrowModel) {
        this.x = arrow.x + "px";
        this.y = arrow.y + "px";
    }
}
