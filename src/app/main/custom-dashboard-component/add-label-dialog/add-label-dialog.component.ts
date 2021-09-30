import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ProgressBarService, DashboardService } from '@services';
import { Dashboard, DashboardItem, DashboardItemRequest, DashboardItemResponse, GenerationStatus } from '@models';
import { AddWidgetDialog } from '../add-dialog-base';

@Component({
  selector: 'fuse-add-label-dialog',
  templateUrl: './add-label-dialog.component.html',
  styleUrls: ['./add-label-dialog.component.scss'],
})
export class AddLabelDialogComponent extends AddWidgetDialog implements OnInit {
  addLabelForm: FormGroup;
  dashboard: Dashboard;
  labelSizeOptions = [
    { value: 'small', caption: 'Small' },
    { value: 'normal', caption: 'Regular' },
    { value: 'larger', caption: 'Larger' },
    { value: 'large', caption: 'Largest' },
  ];
  alignOptions = [
    { value: 'left', caption: 'Left' },
    { value: 'center', caption: 'Center' },
    { value: 'right', caption: 'Right' },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { dashboard: Dashboard; curPos: GenerationStatus },
    public dialogRef: MatDialogRef<AddLabelDialogComponent, boolean>,
    private dashboardService: DashboardService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(data.dashboard, progressBarService, snackbar);
    this.curPos = data.curPos;
  }

  ngOnInit() {
    this.addLabelForm = new FormGroup({
      caption: new FormControl('New Label'),
      labelSize: new FormControl('normal'),
      align: new FormControl('left'),
      underline: new FormControl(false),
      bold: new FormControl(false),
    });
  }

  submit() {
    const position = this.getDashboardAvailableSpot(3, 1);
    const labelRequest: DashboardItemRequest = {
      DashboardId: this.dashboard.Id,
      Type: 'label',
      CustomName: this.caption.value,
      X: position.xPos,
      Y: position.yPos,
      Layer: 5,
      W: 3,
      Options: {
        FontSize: this.labelSize.value,
        Align: this.align.value,
        Bold: this.bold.value,
        Underline: this.underline.value,
      },
    };

    if (this.dashboard.Id === 'generated') {
      const usedIds = this.dashboard.Items.map((dbItem) => parseInt(dbItem.id, 10));
      const newId = Math.max(...usedIds) + 1;
      labelRequest.Id = newId.toString();

      const itemResponse = new DashboardItemResponse(labelRequest);
      this.addLabelToDashboard(itemResponse);

      return;
    }

    this.dashboardService.addDashboardItem(labelRequest).subscribe((result) => {
      this.addLabelToDashboard(result);
    });
  }

  private addLabelToDashboard(dashboardItem: DashboardItemResponse) {
    const newLabel = new DashboardItem(dashboardItem);
    this.dashboard.Items.push(newLabel);
  }

  get caption() {
    return this.addLabelForm.get('caption') as FormControl;
  }
  get labelSize() {
    return this.addLabelForm.get('labelSize') as FormControl;
  }
  get align() {
    return this.addLabelForm.get('align') as FormControl;
  }
  get underline() {
    return this.addLabelForm.get('underline') as FormControl;
  }
  get bold() {
    return this.addLabelForm.get('bold') as FormControl;
  }
}
