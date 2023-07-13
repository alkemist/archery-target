import {ChangeDetectionStrategy, Component, HostBinding} from "@angular/core";
import BaseComponent from "@base-component";
import {CoordinateInterface} from "@models";

@Component({
    template: `
        +
    `,
    styleUrls: ["./center.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterComponent extends BaseComponent {
    static size = 50;

    @HostBinding("style.left") x = "0px";
    @HostBinding("style.top") y = "0px";
    @HostBinding("style.width") w = `${CenterComponent.size}px`;
    @HostBinding("style.height") h = `${CenterComponent.size}px`;
    @HostBinding("style.borderRadius") r = `${CenterComponent.size}px`;
    @HostBinding("style.fontSize") f = `${CenterComponent.size}px`;

    constructor() {
        super();
    }

    setPosition(center: CoordinateInterface) {
        this.x = center.x + "px";
        this.y = center.y + "px";
    }
}
