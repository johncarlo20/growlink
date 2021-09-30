import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  type: string;
}


@Component({
  selector: 'fuse-heat-map-add-sensor-dialog',
  templateUrl: './heat-maps-add-sensor-dialog.component.html',
  styleUrls: ['./heat-maps-add-sensor-dialog.component.scss'],
})
export class HeatMapsAddSensorDialogComponent {
   constructor(
    public dialogRef: MatDialogRef<HeatMapsAddSensorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
