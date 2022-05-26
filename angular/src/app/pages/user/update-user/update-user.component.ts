import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Observable, Subscription } from 'rxjs';

import { UserApiService } from 'src/app/services/user/user-api.service';
import { CanDeactivateComponent } from 'src/app/models/shared/can-deactive-component.model';
import { DialogComponent } from 'src/app/components/dialog/dialog.component';
import { User } from 'src/app/models/user/user.model';
import { NameFormControl } from 'src/app/services/state-matcher/name.state-matcher';
import { ConfirmPasswordErrorStateMatcher, confirmPasswordValidator, NewPasswordFormControl, PasswordFormControl } from 'src/app/services/state-matcher/password.state-matcher';

@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.scss']
})
export class UpdateUserComponent implements OnInit, CanDeactivateComponent, OnDestroy {

  // user details
  user = new User();

  // form group to update user
  updateForm = new FormGroup({
    name: new NameFormControl(),
    password: new PasswordFormControl(),
    updatePassword: new FormControl()
  });
  matcher = new ErrorStateMatcher();
  newPasswordMatcher = new ConfirmPasswordErrorStateMatcher();

  // password states
  hidePassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  // states
  updating = false;
  deleting = false;

  // subscriptions to unsubscribe
  private subscriptions: Subscription[] = [];

  constructor(
    private userApiService: UserApiService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // set user details from user api service
    this.user = this.userApiService.getCurrentUser();
    // set user details in form
    this.updateForm.patchValue({
      name: this.user.name,
      updatePassword: false
    });
  }

  updatePasswordToggle(event: MatSlideToggleChange): void {
    if (event.checked) {
      // add nested form group when update password
      this.updateForm.addControl('newPassword', new FormGroup({
        newPassword: new NewPasswordFormControl(),
        confirmNewPassword: new PasswordFormControl()
      }, [
        confirmPasswordValidator
      ]));
    } else {
      // remove nested form group to prevent validation
      this.updateForm.removeControl('newPassword');
    }
  }

  update(): void {
    // check if all fields are valid
    if (this.updateForm.valid) {
      // update status
      this.updating = true;
      // add to subscriptions
      this.subscriptions.push(
        // update user
        this.userApiService.updateUser({
          name: this.updateForm.get('name')?.value,
          password: this.updateForm.get('password')?.value,
          updatePassword: this.updateForm.get('updatePassword')?.value,
          newPassword: this.updateForm.get('newPassword.newPassword')?.value
        })
          .subscribe({
            next: (status) => {
              // show message
              this.snackBar.open(status, 'OK', { duration: 3000 });
              // set update form as unedited
              this.updateForm.markAsPristine();
              // update user name to update menu
              this.userApiService.setCurrentUserName(this.updateForm.get('name')?.value);
              // update state
              this.updating = false;
            },
            error: (error: Error) => {
              // show error message
              this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 });
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
      // open a dialog to warn deleting account
      this.dialog.open(DialogComponent, {
        data: {
          title: 'Warning',
          question: 'Deleted account cannot be recovered. Are you sure?'
        }
      }).afterClosed()
        .subscribe({
          next: (confirm) => {
            // delete user when confirmed
            if (confirm) {
              this.delete();
            }
          }
        })
    );
  }

  private delete(): void {
  // update state
  this.deleting = true;
  // delete user
  this.userApiService.deleteUser()
    .subscribe({
      next: (status) => {
        // show message
        this.snackBar.open(status, 'OK', { duration: 3000 });
        // return to login page
        this.router.navigateByUrl('/users/login');
        // update state
        this.deleting = false;
      },
      error: (error: Error) => {
        // show message
        this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 });
        // update state
        this.deleting = false;
      }
    });
  }

  canDeactivate(): Observable<boolean> | boolean {
    // open a dialog to warn leaving edited form without saving
    if (this.updateForm.dirty) {
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
    // warn leaving edited form without saving
    if (this.updateForm.dirty) {
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
