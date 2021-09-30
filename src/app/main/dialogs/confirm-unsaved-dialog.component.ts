import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'fuse-confirm-unsaved-dialog',
  templateUrl: './confirm-unsaved-dialog.component.html',
  styleUrls: ['./confirm-unsaved-dialog.component.scss']
})
export class ConfirmUnsavedDialogComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: { message: string },
    public dialogRef: MatDialogRef<ConfirmUnsavedDialogComponent>) { }

  ngOnInit() {
  }

  onConfirm() {
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
