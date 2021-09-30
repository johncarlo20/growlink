import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { BaseAPIComponent } from '@util';
import { ProgressBarService, DashboardService } from '@services';
import { Dashboard, DashboardFullRequest } from '@models';

@Component({
  selector: 'fuse-save-dashboard-dialog',
  templateUrl: './save-dashboard-dialog.component.html',
  styleUrls: ['./save-dashboard-dialog.component.scss'],
})
export class SaveDashboardDialogComponent extends BaseAPIComponent implements OnInit {
  saveDashboardForm: FormGroup;
  dashboard: DashboardFullRequest;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { dashboard: DashboardFullRequest },
    public dialogRef: MatDialogRef<SaveDashboardDialogComponent, Dashboard>,
    private dashboardService: DashboardService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);

    this.dashboard = data.dashboard;
  }

  ngOnInit() {
    this.saveDashboardForm = new FormGroup({
      name: new FormControl(this.dashboard.Name, [Validators.required]),
    });

    this.subs.add(
      this.saveDashboardForm.valueChanges.subscribe(() => {
        this.dashboard.Name = this.name.value;
      })
    );
  }

  get name() {
    return this.saveDashboardForm.get('name');
  }

  submit() {
    this.dashboardService.saveGeneratedDashboard(this.dashboard).subscribe((addedDashboard) => {
      const newDashboard = new Dashboard(addedDashboard);
      this.dialogRef.close(newDashboard);
    });
  }
}
