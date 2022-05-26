import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { SessionApiService } from 'src/app/services/session/session-api.service';
import { Session } from 'src/app/models/session/session.model';

@Component({
  selector: 'app-sessions',
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss']
})
export class SessionsComponent implements OnInit, OnDestroy {

  // collection of sessions
  sessions: Session[] = [];
  filteredSessions: Session[] = [];

  // search keyword
  keyword = '';

  // states
  loading = false;

  // subscriptions to unsubscribe
  private subscriptions: Subscription[] = [];

  constructor(
    private sessionApiService: SessionApiService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // update state
    this.loading = true;
    // add to subscriptions
    this.subscriptions.push(
      // get all sessions
      this.sessionApiService.getAllSessions()
        .subscribe({
          next: (response) => {
            if (Session.isSessions(response)) {
              // set sessions
              this.sessions = response;
              this.filteredSessions = response;
            } else {
              // show message
              this.snackBar.open(response, 'OK', { duration: 3000 });
            }
            // update state
            this.loading = false;
          },
          error: (error: Error) => {
            // show error message
            this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 });
            // update state
            this.loading = false;
          }
        })
    );
  }

  search(): void {
    // update state
    this.loading = true;
    // filter session based on session name using keyword
    this.filteredSessions = this.sessions.filter(session => session.sessionName.toUpperCase().includes(this.keyword.toUpperCase()));
    // update state
    this.loading = false;
  }

  create(): void {
    // add a temporary new session at the start of collection
    this.sessions.unshift({ id: '', userId: '', sessionName: '', note: '', startDateTime: 0, lastUpdatedDateTime: 0 });
  }

  ngOnDestroy(): void {
    // unsubscribe from all subscriptions
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
