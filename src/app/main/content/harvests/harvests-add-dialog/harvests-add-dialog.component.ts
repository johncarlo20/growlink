import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  type: string;
}


@Component({
  selector: 'fuse-harvests-add-dialog',
  templateUrl: './harvests-add-dialog.component.html',
  styleUrls: ['./harvests-add-dialog.component.scss'],
})
export class HarvestsAddDialogComponent {

  counter: number = 0

  constructor(
    public dialogRef: MatDialogRef<HarvestsAddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  minus(): void {
    if (this.counter > 0) {
      --this.counter
    }
  }

  plus(): void {
    ++this.counter
  }
}
