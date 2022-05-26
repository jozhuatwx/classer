import { AbstractControl, FormControl, FormGroupDirective, NgForm, ValidationErrors, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export class PasswordFormControl extends FormControl {
  // set validators to required
  constructor() {
    super('', [
      Validators.required
    ]);
  }
}

export class NewPasswordFormControl extends FormControl {
  // set validators to required and with pattern
  constructor() {
    super('', [
      Validators.required,
      // password is must be at least 8 characters and contains at least 1 uppercase letter, 1 lowercase letter, and 1 number
      Validators.pattern('^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$')
    ]);
  }
}

export class ConfirmPasswordErrorStateMatcher implements ErrorStateMatcher {
  // error state matcher to show error when new and confirm password fields do not match
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const invalidCtrl = !!(control?.invalid && control?.parent?.dirty);
    const invalidParent = !!(control?.parent?.invalid && control?.parent?.dirty);

    return invalidCtrl || invalidParent;
  }
}

export function confirmPasswordValidator(group: AbstractControl): ValidationErrors | null {
  // custom validator to match new and confirm password fields
  const password = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmNewPassword')?.value
  return password === confirmPassword ? null : { notSame: true }
}
