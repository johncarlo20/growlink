import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'fuse-no-subscription-dialog',
  templateUrl: './no-subscription-dialog.component.html',
  styleUrls: ['./no-subscription-dialog.component.scss'],
})
export class NoSubscriptionDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<NoSubscriptionDialogComponent>
  ) {}

  ngOnInit() {}

  onCancel() {
    this.dialogRef.close(null);
  }
}
