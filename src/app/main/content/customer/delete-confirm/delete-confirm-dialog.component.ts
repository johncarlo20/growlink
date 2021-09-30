import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Customer, ControllerResponse } from '@models';

@Component({
  selector: 'fuse-delete-confirm-dialog',
  templateUrl: './delete-confirm-dialog.component.html',
  styleUrls: ['./delete-confirm-dialog.component.scss']
})
export class DeleteConfirmDialogComponent implements OnInit {
  public customer: Customer;
  public ownedControllers: ControllerResponse[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      customer: Customer;
      ownedControllers: ControllerResponse[];
    },
    public dialogRef: MatDialogRef<DeleteConfirmDialogComponent>
    ) {
      this.customer = data.customer;
      this.ownedControllers = data.ownedControllers;
    }

  ngOnInit() {
  }

  onConfirm() {
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
