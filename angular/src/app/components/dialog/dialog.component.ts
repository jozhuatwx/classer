import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { DialogData } from 'src/app/models/shared/dialog-data.model';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html'
})
export class DialogComponent {

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  confirm(): void {
    // close dialog and return true
    this.dialogRef.close(true);
  }

  cancel(): void {
    // close dialog and return false
    this.dialogRef.close(false);
  }
}
