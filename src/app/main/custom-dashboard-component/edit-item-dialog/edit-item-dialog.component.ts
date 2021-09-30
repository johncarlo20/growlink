import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { BaseAPIComponent } from '@util';
import { ProgressBarService, DashboardService } from '@services';
import {
  DashboardItem,
  DashboardItemRequest,
  DashboardItemResponse,
  UnitOfMeasure,
  WidgetOptions,
} from '@models';
import { Controller } from '@models';

@Component({
  selector: 'fuse-edit-item-dialog',
  templateUrl: './edit-item-dialog.component.html',
  styleUrls: ['./edit-item-dialog.component.scss'],
})
export class EditItemDialogComponent extends BaseAPIComponent implements OnInit {
  editDashboardItemForm: FormGroup;
  dashboardItem: DashboardItemRequest;
  options: WidgetOptions;
  controller: Controller;
  changes = false;
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
    @Inject(MAT_DIALOG_DATA)
    public data: { controller: Controller; dashboardItem: DashboardItemRequest },
    public dialogRef: MatDialogRef<EditItemDialogComponent, DashboardItem | number>,
    private dashboardService: DashboardService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);

    this.dashboardItem = data.dashboardItem;
    this.options = this.dashboardItem.Options;
    this.controller = data.controller;
  }

  ngOnInit() {
    this.editDashboardItemForm = new FormGroup({
      customName: new FormControl(this.dashboardItem.CustomName),
      labelSize: new FormControl(this.options && this.options.FontSize ? this.options.FontSize : 'normal'),
      align: new FormControl(this.options && this.options.Align ? this.options.Align : 'left'),
      underline: new FormControl(this.options && this.options.Underline ? true : false),
      bold: new FormControl(this.options && this.options.Bold ? true : false),
      euMin: new FormControl(this.options && this.options.EUMin ? this.options.EUMin : undefined),
      euMax: new FormControl(this.options && this.options.EUMax ? this.options.EUMax : undefined),
      hasEUMin: new FormControl(this.options && this.options.EUMin ? true : false),
      hasEUMax: new FormControl(this.options && this.options.EUMax ? true : false),
      onThreshold: new FormControl(this.options && this.options.OnThreshold ? this.options.OnThreshold : undefined),
    });

    if (this.hasEUMin.value === false) {
      this.euMin.disable();
    }
    if (this.hasEUMax.value === false) {
      this.euMax.disable();
    }

    this.subs.add(
      this.editDashboardItemForm.valueChanges.subscribe(() => {
        this.dashboardItem.CustomName = this.customName.value;
        if (this.dashboardItem.Type === 'label') {
          this.options = {
            FontSize: this.labelSize.value,
            Align: this.align.value,
            Underline: this.underline.value,
            Bold: this.bold.value,
          };
        }
        if (this.dashboardItem.Type === 'gauge') {
          if (this.hasEUMin.value === false && this.euMin.enabled) {
            this.euMin.disable();
          } else if (this.hasEUMin.value === true && this.euMin.disabled) {
            this.euMin.enable();
          }
          if (this.hasEUMax.value === false && this.euMax.enabled) {
            this.euMax.disable();
          } else if (this.hasEUMax.value === true && this.euMax.disabled) {
            this.euMax.enable();
          }

          this.options = {
            EUMin: this.hasEUMin.value ? this.euMin.value : undefined,
            EUMax: this.hasEUMax.value ? this.euMax.value : undefined,
          };
        }
        if (this.dashboardItem.Type === 'light-sensor') {
          this.options = {
            WidgetSize: this.options.WidgetSize,
            OnThreshold: this.onThreshold.value,
            Align: this.align.value
          };
        }

        this.dashboardItem.Options = this.options;
      })
    );
  }

  get customName() {
    return this.editDashboardItemForm.get('customName') as FormControl;
  }
  get labelSize() {
    return this.editDashboardItemForm.get('labelSize') as FormControl;
  }
  get align() {
    return this.editDashboardItemForm.get('align') as FormControl;
  }
  get underline() {
    return this.editDashboardItemForm.get('underline') as FormControl;
  }
  get bold() {
    return this.editDashboardItemForm.get('bold') as FormControl;
  }
  get euMin() {
    return this.editDashboardItemForm.get('euMin') as FormControl;
  }
  get euMax() {
    return this.editDashboardItemForm.get('euMax') as FormControl;
  }
  get hasEUMin() {
    return this.editDashboardItemForm.get('hasEUMin') as FormControl;
  }
  get hasEUMax() {
    return this.editDashboardItemForm.get('hasEUMax') as FormControl;
  }
  get onThreshold() {
    return this.editDashboardItemForm.get('onThreshold') as FormControl;
  }

  get lightLevelDisplayUnit(): string {
    if (!this.controller || !this.controller.Units) {
      return null;
    }

    switch (this.controller.Units.lightLevel) {
      case UnitOfMeasure.Lux:
        return 'Lux';
      case UnitOfMeasure.PPFD:
      case UnitOfMeasure.PPFD_Cmh3000K:
      case UnitOfMeasure.PPFD_HalogenLamp3000K:
      case UnitOfMeasure.PPFD_HighCriLed3000K:
      case UnitOfMeasure.PPFD_HighCriLed4000K:
      case UnitOfMeasure.PPFD_HighCriLed6500K:
      case UnitOfMeasure.PPFD_Hps2000K:
      case UnitOfMeasure.PPFD_LowCriLed3500K:
      case UnitOfMeasure.PPFD_LowCriLed6500K:
      case UnitOfMeasure.PPFD_NaturalDaylight6500K:
        return 'PPFD';
      default:
        return 'UNKNOWN';
    }
  }

  get itemType() {
    switch (this.dashboardItem.Type) {
      case 'chart':
        return 'Sensor Chart';
      case 'gauge':
        return 'Sensor Gauge';
      case 'device':
        return 'Device';
      case 'task':
        return 'Manual Task';
      case 'label':
        return 'Label';
      default:
        return 'UNKNOWN';
    }
  }

  submit() {
    if (this.dashboardItem.DashboardId === 'generated') {
      const newItem = new DashboardItem(new DashboardItemResponse(this.dashboardItem));
      this.dialogRef.close(newItem);
      return;
    }

    this.dashboardService.updateDashboardItem(this.dashboardItem).subscribe((updatedItem) => {
      const newItem = new DashboardItem(updatedItem);
      this.dialogRef.close(newItem);
    });
  }

  removeItem() {
    if (this.dashboardItem.DashboardId === 'generated') {
      this.dialogRef.close(-1);
      return;
    }

    this.dashboardService.deleteDashboardItem(this.dashboardItem.Id).subscribe((success) => {
      if (success) {
        this.dialogRef.close(-1);
      }
    });
  }
}
