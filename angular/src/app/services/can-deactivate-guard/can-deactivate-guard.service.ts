import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

import { CanDeactivateComponent } from 'src/app/models/shared/can-deactive-component.model';

@Injectable({
  providedIn: 'root'
})
export class CanDeactivateGuardService implements CanDeactivate<CanDeactivateComponent> {

  canDeactivate(component: CanDeactivateComponent): Observable<boolean> | boolean {
    // return if component can be deactivated
    return component.canDeactivate ? component.canDeactivate() : true;
  }
}
