import { FormControl, Validators } from '@angular/forms';

export class NameFormControl extends FormControl {
  // set validators to required
  constructor() {
    super('', [
      Validators.required,
    ]);
  }
}
