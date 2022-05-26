import { Component, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { SessionApiService } from 'src/app/services/session/session-api.service';
import { Session } from 'src/app/models/session/session.model';
import { SessionNameFormControl } from 'src/app/services/state-matcher/session-name.state-matcher';

@Component({
  selector: 'app-session-card',
  templateUrl: './session-card.component.html',
  styleUrls: ['./session-card.component.scss']
})
export class SessionCardComponent implements OnDestroy {

  // session data
  @Input() session: Session | undefined;

  // form group to create session
  createForm = new FormGroup({
    sessionName: new SessionNameFormControl()
  });
  matcher = new ErrorStateMatcher();

  // states
  creating = false;

  // subscriptions to unsubcribe
  private subscriptions: Subscription[] = [];

  constructor(
    private sessionApiService: SessionApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  create(): void {
    // check if all fields are valid
    if (this.createForm.valid) {
      // update state
      this.creating = true;
      // add to subscriptions
      this.subscriptions.push(
        // create a new session
        this.sessionApiService.createSession({
          sessionName: this.createForm.get('sessionName')?.value
        })
          .subscribe({
            next: (id) => {
              // go to session details page
              this.router.navigateByUrl('/sessions/' + id);
              // update state
              this.creating = false;
            },
            error: (error: Error) => {
              // show error
              this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 });
              // update state
              this.creating = false;
            }
          })
      );
    }
  }

  ngOnDestroy(): void {
    // unsubscribe from all subscriptions
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
