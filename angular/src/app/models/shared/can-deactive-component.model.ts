import { Observable } from 'rxjs';

export interface CanDeactivateComponent {
  canDeactivate(): Observable<boolean> | boolean;
  canUnload($event: BeforeUnloadEvent): BeforeUnloadEvent;
}
