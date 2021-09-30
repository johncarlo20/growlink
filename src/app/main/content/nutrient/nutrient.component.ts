import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  ProgressBarService,
} from '@services';
import { BaseAPIComponent } from '@util';
import { NutrientDialogComponent } from './nutrient-dialog/nutrient-dialog.component';

@Component({
  selector: 'fuse-nutrient',
  templateUrl: './nutrient.component.html',
  styleUrls: ['./nutrient.component.scss'],
})
export class NutrientComponent extends BaseAPIComponent implements OnInit {
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
    const dialogRef = this.dialog.open(NutrientDialogComponent, {
      width: '800px',
      data: { type }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }
}
