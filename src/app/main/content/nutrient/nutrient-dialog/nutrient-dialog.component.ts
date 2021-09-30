import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  type: string;
}


@Component({
  selector: 'fuse-nutrient-dialog',
  templateUrl: './nutrient-dialog.component.html',
  styleUrls: ['./nutrient-dialog.component.scss'],
})
export class NutrientDialogComponent {
   constructor(
    public dialogRef: MatDialogRef<NutrientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
