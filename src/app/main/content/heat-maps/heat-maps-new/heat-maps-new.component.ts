import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HeatMapsAddSensorDialogComponent } from '../heat-maps-add-sensor-dialog/heat-maps-add-sensor-dialog.component'

import {
  ProgressBarService,
} from '@services';
import { BaseAPIComponent } from '@util';

export interface DialogData {
  type: string;
}

export interface RangeType {
  min: number;
  max: number;
}

@Component({
  selector: 'fuse-heat-map-new',
  templateUrl: './heat-maps-new.component.html',
  styleUrls: ['./heat-maps-new.component.scss'],
})
export class HeatMapsNewComponent extends BaseAPIComponent implements OnInit {

  rangeMin: number = 10
  rangeMax: number = 100
  imgPreviewSrc: any = null

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

  output(range: RangeType) {
    this.rangeMin = range.min
    this.rangeMax = range.max
  }

  openDialog(type): void {
    const dialogRef = this.dialog.open(HeatMapsAddSensorDialogComponent, {
      width: '800px',
      data: { type }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  imageChange(fileInputEvent: any) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imgPreviewSrc =  e.target.result;
    }   
    reader.readAsDataURL(fileInputEvent.target.files[0]);
  }
}
