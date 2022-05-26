import { FormControl, Validators } from '@angular/forms';

export class EmailFormControl extends FormControl {
  // set validators to required and email format
  constructor() {
    super('', [
      Validators.required,
      Validators.email,
    ]);
  }
}
