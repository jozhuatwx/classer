import { FormControl, Validators } from '@angular/forms';

export class SessionNameFormControl extends FormControl {
  // set validators to required
  constructor() {
    super('', [
      Validators.required,
    ]);
  }
}
