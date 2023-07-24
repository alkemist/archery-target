import {Directive} from "@angular/core";
import {Observable} from "rxjs";

@Directive()
export default abstract class BaseComponent {
    protected constructor() {

    }

    canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
        return true;
    }
}
