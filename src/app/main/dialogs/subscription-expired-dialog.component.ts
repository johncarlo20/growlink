import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'fuse-subscription-expired-dialog',
  templateUrl: './subscription-expired-dialog.component.html'
})
export class SubscriptionExpiredDialogComponent implements OnInit {
  IsAccountAdmin = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public isAccountAdmin: boolean,
    public dialogRef: MatDialogRef<SubscriptionExpiredDialogComponent>
  ) {
    this.IsAccountAdmin = isAccountAdmin;
  }

  ngOnInit() {}

  onCancel() {
    this.dialogRef.close(null);
  }
}
