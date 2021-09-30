import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HarvestsAddDialogComponent } from './harvests-add-dialog/harvests-add-dialog.component'
import { HarvestsPlusDialogComponent } from './harvests-plus-dialog/harvests-plus-dialog.component'

import {
  ProgressBarService,
} from '@services';
import { BaseAPIComponent } from '@util';

@Component({
  selector: 'fuse-harvests',
  templateUrl: './harvests.component.html',
  styleUrls: ['./harvests.component.scss'],
})
export class HarvestsComponent extends BaseAPIComponent implements OnInit {

  items: Array<any> = [
    {
      groups: '2021128_OG',
      cultivar: 'Cookies',
      plantCount: 500,
      stageDays: 'Veg/33',
      location: 'Veg/33',
      startDate: '8/12/2021',
      finishDate: '12/6/2021'
    },
    {
      groups: '2021128_OG',
      cultivar: 'Cookies',
      plantCount: 500,
      stageDays: 'Veg/33',
      location: 'Veg/33',
      startDate: '8/12/2021',
      finishDate: '12/6/2021'
    },
    {
      groups: '2021128_OG',
      cultivar: 'Cookies',
      plantCount: 500,
      stageDays: 'Veg/33',
      location: 'Veg/33',
      startDate: '8/12/2021',
      finishDate: '12/6/2021'
    },
    {
      groups: '2021128_OG',
      cultivar: 'Cookies',
      plantCount: 500,
      stageDays: 'Veg/33',
      location: 'Veg/33',
      startDate: '8/12/2021',
      finishDate: '12/6/2021'
    },
    {
      groups: '2021128_OG',
      cultivar: 'Cookies',
      plantCount: 500,
      stageDays: 'Veg/33',
      location: 'Veg/33',
      startDate: '8/12/2021',
      finishDate: '12/6/2021'
    },
    {
      groups: '2021128_OG',
      cultivar: 'Cookies',
      plantCount: 500,
      stageDays: 'Veg/33',
      location: 'Veg/33',
      startDate: '8/12/2021',
      finishDate: '12/6/2021'
    },
    {
      groups: '2021128_OG',
      cultivar: 'Cookies',
      plantCount: 500,
      stageDays: 'Veg/33',
      location: 'Veg/33',
      startDate: '8/12/2021',
      finishDate: '12/6/2021'
    },
    {
      groups: '2021128_OG',
      cultivar: 'Cookies',
      plantCount: 500,
      stageDays: 'Veg/33',
      location: 'Veg/33',
      startDate: '8/12/2021',
      finishDate: '12/6/2021'
    },
    {
      groups: '2021128_OG',
      cultivar: 'Cookies',
      plantCount: 500,
      stageDays: 'Veg/33',
      location: 'Veg/33',
      startDate: '8/12/2021',
      finishDate: '12/6/2021'
    },
    {
      groups: '2021128_OG',
      cultivar: 'Cookies',
      plantCount: 500,
      stageDays: 'Veg/33',
      location: 'Veg/33',
      startDate: '8/12/2021',
      finishDate: '12/6/2021'
    },
    {
      groups: '2021128_OG',
      cultivar: 'Cookies',
      plantCount: 500,
      stageDays: 'Veg/33',
      location: 'Veg/33',
      startDate: '8/12/2021',
      finishDate: '12/6/2021'
    }
  ];

  displayedColumns: string[] = [
    'groups', 
    'cultivar',
    'plantCount',
    'stageDays',
    'location',
    'startDate',
    'finishDate',
    'action'
  ];

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

  openDialog(): void {
    const dialogRef = this.dialog.open(HarvestsAddDialogComponent, {
      width: '800px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  openHarvestDialog(e): void {
    e.preventDefault()
    
    const dialogRef = this.dialog.open(HarvestsPlusDialogComponent, {
      width: '800px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }
}
