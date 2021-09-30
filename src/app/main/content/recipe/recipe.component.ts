import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  ProgressBarService,
} from '@services';
import { BaseAPIComponent } from '@util';

@Component({
  selector: 'fuse-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss'],
})
export class RecipeComponent extends BaseAPIComponent implements OnInit {

  items: Array<any> = [
    {
      name: 'Set point',
      expanded: true,
      expandItems: [
        { name: 'Veg week 01' },
        { name: 'Veg week 02' }
      ]
    },
    {
      name: 'Task',
      expanded: true,
      expandItems: [
        { name: 'Veg week 03' },
        { name: 'Add taks..' }
      ]
    }
  ];

  constructor(
    snackbar: MatSnackBar,
    progressBarService: ProgressBarService
  ) {
    super(snackbar, progressBarService);
    this.progressBarService.SetCurrentPage([
      { icon: 'dashboard', caption: 'Organization Dashboard' },
    ]);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }
}
