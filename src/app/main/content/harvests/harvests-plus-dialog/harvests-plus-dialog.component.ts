import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  type: string;
}


@Component({
  selector: 'fuse-harvests-plus-dialog',
  templateUrl: './harvests-plus-dialog.component.html',
  styleUrls: ['./harvests-plus-dialog.component.scss'],
})
export class HarvestsPlusDialogComponent {

  counter: number = 0

  constructor(
    public dialogRef: MatDialogRef<HarvestsPlusDialogComponent>,
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
