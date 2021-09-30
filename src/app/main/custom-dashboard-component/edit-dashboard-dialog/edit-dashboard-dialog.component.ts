import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { BaseAPIComponent } from '@util';
import { ProgressBarService, DashboardService } from '@services';
import { Dashboard, DashboardRequest, DashboardResponse } from '@models';
import { Controller } from '@models';

@Component({
  selector: 'fuse-edit-dashboard-dialog',
  templateUrl: './edit-dashboard-dialog.component.html',
  styleUrls: ['./edit-dashboard-dialog.component.scss']
})
export class EditDashboardDialogComponent extends BaseAPIComponent implements OnInit {
  editDashboardForm: FormGroup;
  dashboard: DashboardRequest;
  controller: Controller;
  changes = false;
  durationOptions = [
    {value: 10, caption: '10 Minutes'},
    {value: 60, caption: '1 Hour'},
    {value: 1440, caption: '1 Day'},
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { controller: Controller, dashboard: DashboardRequest },
    public dialogRef: MatDialogRef<EditDashboardDialogComponent, Dashboard>,
    private dashboardService: DashboardService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);

    this.dashboard = data.dashboard;
    this.controller = data.controller;
  }

  ngOnInit() {
    this.editDashboardForm = new FormGroup({
      name: new FormControl(this.dashboard.Name, [Validators.required]),
      chartsDuration: new FormControl(this.dashboard.ChartDuration, [Validators.required]),
    });

    this.subs.add(
      this.editDashboardForm.valueChanges.subscribe(() => {
        this.dashboard.Name = this.name.value;
        this.dashboard.ChartDuration = this.chartsDuration.value;
      })
    );
  }

  get name() {
    return this.editDashboardForm.get('name') as FormControl;
  }

  get chartsDuration() {
    return this.editDashboardForm.get('chartsDuration') as FormControl;
  }

  get generatedDashboard() {
    return this.dashboard.Id === 'generated';
  }

  submit() {
    if (!this.dashboard.Id) {
      this.dashboardService.addDashboard(this.dashboard).subscribe(addedDashboard => {
        const newDashboard = new Dashboard(addedDashboard);
        this.dialogRef.close(newDashboard);
      });
    } else if (this.dashboard.Id === 'generated') {
      const updatedDashboard = new DashboardResponse(this.dashboard);
      const newDashboard = new Dashboard(updatedDashboard);
      this.dialogRef.close(newDashboard);
  } else {
      this.dashboardService.updateDashboard(this.dashboard).subscribe(updatedDashboard => {
        const newDashboard = new Dashboard(updatedDashboard);
        this.dialogRef.close(newDashboard);
      });
    }
  }
}
