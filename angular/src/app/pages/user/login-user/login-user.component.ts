import { Component, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription } from 'rxjs';

import { UserApiService } from 'src/app/services/user/user-api.service';
import { CanDeactivateComponent } from 'src/app/models/shared/can-deactive-component.model';
import { DialogComponent } from 'src/app/components/dialog/dialog.component';
import { EmailFormControl } from 'src/app/services/state-matcher/email.state-matcher';
import { NameFormControl } from 'src/app/services/state-matcher/name.state-matcher';
import { ConfirmPasswordErrorStateMatcher, confirmPasswordValidator, NewPasswordFormControl, PasswordFormControl } from 'src/app/services/state-matcher/password.state-matcher';

@Component({
  selector: 'app-login-user',
  templateUrl: './login-user.component.html',
  styleUrls: ['./login-user.component.scss']
})
export class LoginUserComponent implements CanDeactivateComponent, OnDestroy {

  // form group to login and register
  loginForm = new FormGroup({
    email: new EmailFormControl(),
    password: new PasswordFormControl(),
    stayLoggedIn: new FormControl(true)
  });
  registerForm = new FormGroup({
    name: new NameFormControl(),
    email: new EmailFormControl(),
    newPassword: new FormGroup({
      newPassword: new NewPasswordFormControl(),
      confirmNewPassword: new PasswordFormControl()
    }, [
      confirmPasswordValidator
    ]),
    stayLoggedIn: new FormControl(true)
  });
  matcher = new ErrorStateMatcher();
  passwordMatcher = new ConfirmPasswordErrorStateMatcher();

  // password states
  hidePassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  // states
  loggingIn = false;
  registering = false;

  // subscriptions to unsubscribe
  private subscriptions: Subscription[] = [];

  constructor(
    private userApiService: UserApiService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  register(): void {
    // check if all fields are valid
    if (this.registerForm.valid) {
      // update state
      this.registering = true;
      // add to subscriptions
      this.subscriptions.push(
        // create a new user
        this.userApiService.createUser({
          name: this.registerForm.get('name')?.value,
          email: this.registerForm.get('email')?.value,
          password: this.registerForm.get('newPassword.newPassword')?.value
        }, this.registerForm.get('stayLoggedIn')?.value)
          .subscribe({
            next: ([status, message]) => {
              if (status) {
                // redirect user to sessions page
                this.router.navigateByUrl('/sessions');
              } else {
                // show message
                this.snackBar.open(message, 'OK', { duration: 3000 });
              }
              // update state
              this.registering = false;
            },
            error: (error: Error) => {
              // show error message
              this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 });
              // update state
              this.registering = false;
            }
          })
      );
    }
  }

  login(): void {
    // check if all fields are valid
    if (this.loginForm.valid) {
      // update state
      this.loggingIn = true;
      // add to subscriptions
      this.subscriptions.push(
        // get user details
        this.userApiService.getUser({
          email: this.loginForm.get('email')?.value,
          password: this.loginForm.get('password')?.value
        }, this.loginForm.get('stayLoggedIn')?.value)
          .subscribe({
            next: ([status, message]) => {
              if (status) {
                // redirect user to sessions page
                this.router.navigateByUrl('/sessions');
              } else {
                // show message
                this.snackBar.open(message, 'OK', { duration: 3000 });
              }
              // update state
              this.loggingIn = false;
            },
            error: (error: Error) => {
              // show error message
              this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 });
              // update state
              this.loggingIn = false;
            }
          })
      );
    }
  }

  canDeactivate(): Observable<boolean> | boolean {
    return true;
  }

  @HostListener('window:beforeunload', ['$event'])
  canUnload($event: BeforeUnloadEvent): BeforeUnloadEvent {
    // warn leaving when edited form without saving
    if (this.registerForm.dirty) {
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
