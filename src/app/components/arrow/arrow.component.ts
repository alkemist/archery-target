import {ChangeDetectionStrategy, Component, HostBinding} from "@angular/core";
import BaseComponent from "@base-component";
import {ArrowComponentInterface} from "@models";

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
    @HostBinding("style.borderRadius") r = `${ArrowComponent.size}px`;
    @HostBinding("style.fontSize") f = `${ArrowComponent.size}px`;
    @HostBinding("style.backgroundColor") bgColor = "";
    @HostBinding("style.color") color = "";

    constructor() {
        super();
    }

    setPosition(arrow: ArrowComponentInterface) {
        this.x = arrow.x + "px";
        this.y = arrow.y + "px";

        this.bgColor = arrow.bgColor;
        this.color = arrow.fontColor;
    }
}
