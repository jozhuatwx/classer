import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription } from 'rxjs';

import { SessionApiService } from 'src/app/services/session/session-api.service';
import { SnapshotApiService } from 'src/app/services/snapshot/snapshot-api.service';
import { CanDeactivateComponent } from 'src/app/models/shared/can-deactive-component.model';
import { DialogComponent } from 'src/app/components/dialog/dialog.component';
import { Session } from 'src/app/models/session/session.model';
import { Snapshot } from 'src/app/models/snapshot/snapshot.model';
import { SessionNameFormControl } from 'src/app/services/state-matcher/session-name.state-matcher';

@Component({
  selector: 'app-session-details',
  templateUrl: './session-details.component.html',
  styleUrls: ['./session-details.component.scss']
})
export class SessionDetailsComponent implements OnInit, CanDeactivateComponent, OnDestroy {

  // session details
  id = '';
  startDateTime = 0;

  // collection of snapshots data
  snapshots: Snapshot[] = [];

  // form group to update session
  updateForm = new FormGroup({
    sessionName: new SessionNameFormControl(),
    note: new FormControl()
  });
  matcher = new ErrorStateMatcher();

  // states
  loading = [false, false];
  updating = false;
  deleting = false;
  captureStarted = false;

  // subscriptions to unsubcribe
  private subscriptions: Subscription[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private sessionApiService: SessionApiService,
    private snapshotApiService: SnapshotApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // disable update form
    this.updateForm.disable();
  }

  ngOnInit(): void {
    // update state
    this.loading[0] = true;
    // add to subscriptions
    this.subscriptions.push(
      // get id from url parameter
      this.activatedRoute.params
      .subscribe({
        next: (params) => {
          // set session id
          this.id = params.id;
          // add to subscriptions
          this.subscriptions.push(
            // get session details
            this.sessionApiService.getSession(this.id)
              .subscribe({
                next: (response) => {
                  if (Session.isSession(response)) {
                    // set session start date time
                    this.startDateTime = response.startDateTime;
                    // set session details in form
                    this.updateForm.setValue({
                      sessionName: response.sessionName,
                      note: response.note
                    });
                  } else {
                    // return to sessions page if session does not exist
                    this.router.navigateByUrl('/sessions');
                    // show error message
                    this.snackBar.open(response, 'OK', { duration: 3000 });
                  }
                  // update state
                  this.loading[0] = false;
                },
                error: (error: Error) => {
                  // return to sessions page if error
                  this.router.navigateByUrl('/sessions');
                  // show error message
                  this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 });
                  // update state
                  this.loading[0] = false;
                }
              })
          );
          // update state
          this.loading[1] = true;
          // add to subscriptions
          this.subscriptions.push(
            // get all snapshots of session
            this.snapshotApiService.getAllSnapshots(this.id)
              .subscribe({
                next: (response) => {
                  if (Snapshot.isSnapshots(response)) {
                    // set snapshots data if any
                    this.snapshots = response;
                  } else {
                    // show message
                    this.snackBar.open(response, 'OK', { duration: 3000 });
                  }
                  // update state
                  this.loading[1] = false;
                },
                error: (error: Error) => {
                  // return to sessions page if error
                  this.router.navigateByUrl('/sessions');
                  // show error message
                  this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 });
                  // update state
                  this.loading[1] = false;
                }
              })
          );
        },
        error: (error: Error) => {
          // return to sessions page if error
          this.router.navigateByUrl('/sessions');
          // show error message
          this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 });
          // update state
          this.loading[0] = false;
        }
      })
    );
  }

  update(): void {
    // check if all fields are valid
    if (this.updateForm.valid) {
      // update state
      this.updating = true;
      // add to subscriptions
      this.subscriptions.push(
        // update session
        this.sessionApiService.updateSession(this.id, {
          sessionName: this.updateForm.get('sessionName')?.value,
          note: this.updateForm.get('note')?.value
        })
          .subscribe({
            next: (status) => {
              // show message
              this.snackBar.open(status, 'OK', { duration: 3000 });
              // disable update form
              this.updateForm.disable();
              // set update form as unedited
              this.updateForm.markAsPristine();
              // update state
              this.updating = false;
            },
            error: (error: Error) => {
              // show error message
              this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 })
              // update state
              this.updating = false;
            }
          })
      );
    }
  }

  confirmDelete(): void {
    // add to subscriptions
    this.subscriptions.push(
      // open a dialog to warn deleting
      this.dialog.open(DialogComponent, {
        data: {
          title: 'Warning',
          question: 'Deleted session cannot be recovered. Are you sure?'
        }
      })
        .afterClosed().subscribe((confirm) => {
          // delete session when confirmed
          if (confirm) {
            this.delete();
          }
        })
    );
  }

  private delete(): void {
    // update state
    this.deleting = true;
    // add to subscriptions
    this.subscriptions.push(
      // delete session
      this.sessionApiService.deleteSession(this.id)
      .subscribe({
        next: (status) => {
          // show message
          this.snackBar.open(status, 'OK', { duration: 3000 });
          // return to sessions page
          this.router.navigateByUrl('/sessions');
          // update state
          this.deleting = false;
        },
        error: (error: Error) => {
          // show error message
          this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 })
          // update state
          this.deleting = false;
        }
      })
    );
  }

  canDeactivate(): Observable<boolean> | boolean {
    // open a dialog to warn leaving when recording or edited form without saving
    if (this.captureStarted) {
      return this.dialog.open(DialogComponent, {
        data: {
          title: 'Warning',
          question: 'Leaving will stop recording session. Do you confirm?'
        }
      }).afterClosed();
    } else if (this.updateForm.dirty) {
      return this.dialog.open(DialogComponent, {
        data: {
          title: 'Warning',
          question: 'Changes you made may not be saved. Do you confirm?'
        }
      }).afterClosed();
    }
    return true;
  }

  @HostListener('window:beforeunload', ['$event'])
  canUnload($event: BeforeUnloadEvent): BeforeUnloadEvent {
    // warn leaving when recording or edited form without saving
    if (this.captureStarted) {
      $event.preventDefault();
      $event.returnValue = 'Leaving will stop recording session.';
    } else if (this.updateForm.dirty) {
      $event.preventDefault();
      $event.returnValue = 'Changes you made may not be saved.';
    }
    return $event;
  }

  ngOnDestroy(): void {
    // unsubscribe from all subscriptions
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
