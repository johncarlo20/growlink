import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ProgressBarService,
} from '@services';
import { BaseAPIComponent } from '@util';
import { MatDialog } from '@angular/material/dialog';
import { CalendarIrrigationEventDialogComponent } from '../calendar-irrigation-event-dialog/calendar-irrigation-event-dialog.component';

@Component({
  selector: 'fuse-calendar-irrigation-event',
  templateUrl: './calendar-irrigation-event.component.html',
  styleUrls: ['./calendar-irrigation-event.component.scss'],
})
export class CalendarIrrigationEventComponent extends BaseAPIComponent implements OnInit {
  scale: number = 35
  scale1: number = 95
  eventType: string = 'direct-feed-timer'
  chooseTime: boolean = false

  constructor(
    snackbar: MatSnackBar,
    progressBarService: ProgressBarService,
    public dialog: MatDialog
  ) {
    super(snackbar, progressBarService);
    this.progressBarService.SetCurrentPage([
      { icon: 'dashboard', caption: 'Organization Dashboard' },
    ]);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  openDialog(type): void {
    const dialogRef = this.dialog.open(CalendarIrrigationEventDialogComponent, {
      width: '800px',
      panelClass: 'full-width-dialog',
      data: { type }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }
}
