import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import * as moment from 'moment';

import { ControllerService, ProgressBarService, DeviceTypesService, ProductTypesService } from '@services';
import {
  ManualTask,
  ManualTaskResponse,
  DayNightOption,
  DeviceWithThrottle,
  DeviceResponse,
  Controller,
  SelectItem,
  RuleDialogOptions,
} from '@models';
import { EditRuleDialog, TimeUtil } from '@util';
import { DeviceThrottlesComponent } from '../device-throttles/device-throttles.component';

export class EditManualTaskDialogOptions {
  task: ManualTask;
  dialogOptions: RuleDialogOptions;
}
export class EditManualTaskDialogResult {
  task: ManualTaskResponse;
  needsUpdate: boolean;
}

@Component({
  selector: 'fuse-edit-manual-task-dialog',
  templateUrl: './edit-manual-task-dialog.component.html',
})
export class EditManualTaskDialogComponent
  extends EditRuleDialog<EditManualTaskDialogComponent, EditManualTaskDialogResult>
  implements OnInit {
  editManualTaskForm: FormGroup;
  controller: Controller;
  task: ManualTask;
  deviceOptions: DeviceResponse[];
  dayNightOptions: SelectItem[];
  selectedDevicesDosing = false;
  ruleDescription = '';
  timezoneId: string;
  timezoneAbbr: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditManualTaskDialogOptions,
    dialogRef: MatDialogRef<EditManualTaskDialogComponent, EditManualTaskDialogResult>,
    deviceService: DeviceTypesService,
    controllerService: ControllerService,
    productService: ProductTypesService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(dialogRef, deviceService, controllerService, productService, progressBarService, snackbar);

    this.task = data.task;
    this.dialogOptions = data.dialogOptions;
    this.deviceOptions = this.standardDeviceFiltering(
      this.task,
      this.dialogOptions.deviceOptions,
      this.dialogOptions.sharedDeviceOptions);
    this.controller = this.dialogOptions.controller;
    this.dayNightOptions = DayNightOption.forSelectList();
    this.timezoneId = this.dialogOptions.controller.TimeZoneId;
    this.timezoneAbbr = TimeUtil.getTimezoneAbbr(this.timezoneId);
  }

  ngOnInit() {
    super.ngOnInit();

    this.editManualTaskForm = new FormGroup({
      displayName: new FormControl(this.task.DisplayName),
      devices: new FormControl(this.task.DeviceIds, [Validators.required]),
      duration: new FormControl(this.task.Duration, [Validators.required, durationValidator]),
      active: new FormControl(this.task.IsActive, [Validators.required]),
      dosingRecipe: new FormControl(this.task.DosingRecipeId),
    });

    this.subs.add(
      this.devices.valueChanges.subscribe((selected) => this.updateSelectedDevices(selected))
    );
    this.subs.add(
      this.editManualTaskForm.valueChanges.subscribe(() => {
        const durationMoment = moment(this.duration.value, 'HH:mm:ss');

        this.task.DisplayName = this.displayName.value;
        this.task.DeviceIds = this.devices.value;
        this.task.Duration = durationMoment.isValid() ? durationMoment.format('HH:mm:ss') : null;
        this.task.IsActive = this.active.value;
        this.task.DosingRecipeId = this.dosingRecipe.value;

        this.getDescription();
      })
    );

    this.updateSelectedDevices(this.task.DeviceIds);
    this.getDescription();
  }

  private getDescription() {
    if (!this.editManualTaskForm.valid) {
      return;
    }

    const taskResp = this.task.getManualTaskResponse(this.selectedDeviceThrottles);
    this.controllerService.getManualTaskDescription(taskResp).subscribe((r) => {
      this.ruleDescription = r;
    });
  }

  get displayName() {
    return this.editManualTaskForm.get('displayName') as FormControl;
  }
  get devices() {
    return this.editManualTaskForm.get('devices') as FormControl;
  }
  get duration() {
    return this.editManualTaskForm.get('duration') as FormControl;
  }
  get active() {
    return this.editManualTaskForm.get('active') as FormControl;
  }
  get dosingRecipe() {
    return this.editManualTaskForm.get('dosingRecipe') as FormControl;
  }

  get dosingRecipes() {
    return [...this.controller.DosingRecipes, ...this.controller.SharedDosingRecipes];
  }

  get controllerDosing() {
    return this.controller.EnableInlineDosing || this.controller.SharedModules.length > 0;
  }

  public update() {
    const updatedManualTask = this.task.getManualTaskResponse(this.selectedDeviceThrottles);
    const needsUpdate = this.devices.dirty || this.duration.dirty ||
      this.active.dirty || this.dosingRecipe.dirty ||
      DeviceThrottlesComponent.CheckDirty(this.selectedDeviceThrottles, this.editManualTaskForm);

    if (!updatedManualTask.Id) {
      this.controllerService.createManualTask(updatedManualTask).subscribe(
        (newManualTask) => {
          this.showMessage(`Added new Manual Task`);
          this.dialogRef.close({task: newManualTask, needsUpdate: true});
        },
        (error) => this.handleError(error)
      );
    } else {
      this.controllerService.updateManualTask(updatedManualTask).subscribe(
        () => {
          this.showMessage(`Saved changes to Manual Task`);
          this.dialogRef.close({task: updatedManualTask, needsUpdate: needsUpdate});
        },
        (error) => this.handleError(error)
      );
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  protected showModelError(message: string, key: string, errors: string[]) {
    switch (key) {
      case 'DeviceIds':
        this.showServerErrors(this.devices, errors);
        break;
      case 'DosingRecipeId':
        this.showServerErrors(this.dosingRecipe, errors);
        break;
      case 'Duration':
        this.showServerErrors(this.duration, errors);
        break;
      default:
        super.showModelError(message, key, errors);
        break;
    }
  }

  private updateSelectedDevices(devices: string[]) {
    if (!devices.length) {
      this.selectedDeviceThrottles = [];
      this.selectedDevicesDosing = false;
      return;
    }

    this.selectedDevicesDosing = this.deviceOptions
      .filter((dev) => devices.some((devId) => devId === dev.Guid))
      .some((dev) => {
        const devType = this.getDeviceType(dev.Guid);

        return devType.AllowsRuleDosingRecipe;
      });

    this.selectedDeviceThrottles = this.selectedDeviceThrottles.filter(
      (s) => devices.indexOf(s.Guid) > -1
    );

    this.buildSelectedDeviceThrottles(devices);

    this.selectedDeviceThrottles.sort((devA, devB) => devA.Name.localeCompare(devB.Name));
  }
}

const durationValidator: ValidatorFn = (control: FormControl): ValidationErrors | null => {
  const durationMoment = moment.duration(control.value);

  if (durationMoment.asSeconds() < 1) {
    return { valid: ['Minimum duration of 1 second'] };
  }

  return null;
};
