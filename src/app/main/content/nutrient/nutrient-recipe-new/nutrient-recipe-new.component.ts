import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ProgressBarService,
} from '@services';
import { BaseAPIComponent } from '@util';

@Component({
  selector: 'fuse-nutrient-recipe-new',
  templateUrl: './nutrient-recipe-new.component.html',
  styleUrls: ['./nutrient-recipe-new.component.scss'],
})
export class NutrientRecipeNewComponent extends BaseAPIComponent implements OnInit {
  scale: number = 30

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
