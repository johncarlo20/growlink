import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  ProgressBarService,
} from '@services';
import { BaseAPIComponent } from '@util';

@Component({
  selector: 'fuse-batch-tanks',
  templateUrl: './batch-tanks.component.html',
  styleUrls: ['./batch-tanks.component.scss'],
})
export class BatchTanksComponent extends BaseAPIComponent implements OnInit {
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

  openDialog(s) {

  }
}
