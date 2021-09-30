import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  type: string;
}


@Component({
  selector: 'fuse-calendar-irrigation-event-dialog',
  templateUrl: './calendar-irrigation-event-dialog.component.html',
  styleUrls: ['./calendar-irrigation-event-dialog.component.scss'],
})
export class CalendarIrrigationEventDialogComponent {
   constructor(
    public dialogRef: MatDialogRef<CalendarIrrigationEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
