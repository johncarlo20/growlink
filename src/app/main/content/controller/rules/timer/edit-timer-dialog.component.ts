import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import * as moment from 'moment';

import { ControllerService, ProgressBarService, DeviceTypesService, ProductTypesService } from '@services';
import {
  DeviceTimer,
  DeviceTimerResponse,
  DayNightOption,
  DeviceResponse,
  Controller,
  SelectItem,
  RuleDialogOptions,
} from '@models';
import { EditRuleDialog, TimeUtil } from '@util';
import { DeviceThrottlesComponent } from '../device-throttles/device-throttles.component';

export class EditTimerDialogOptions {
  timer: DeviceTimer;
  dialogOptions: RuleDialogOptions;
}
export class EditTimerDialogResult {
  timer: DeviceTimerResponse;
  needsUpdate: boolean;
}

@Component({
  selector: 'fuse-edit-timer-dialog',
  templateUrl: './edit-timer-dialog.component.html',
})
export class EditTimerDialogComponent
  extends EditRuleDialog<EditTimerDialogComponent, EditTimerDialogResult>
  implements OnInit {
  editTimerForm: FormGroup;
  controller: Controller;
  timer: DeviceTimer;
  deviceOptions: DeviceResponse[];
  dayNightOptions: SelectItem[];
  selectedDevicesDosing = false;
  ruleDescription = '';
  timezoneId: string;
  timezoneAbbr: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditTimerDialogOptions,
    dialogRef: MatDialogRef<EditTimerDialogComponent, EditTimerDialogResult>,
    deviceService: DeviceTypesService,
    controllerService: ControllerService,
    productService: ProductTypesService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(dialogRef, deviceService, controllerService, productService, progressBarService, snackbar);

    this.timer = data.timer;
    this.dialogOptions = data.dialogOptions;
    this.deviceOptions = this.standardDeviceFiltering(
      this.timer,
      this.dialogOptions.deviceOptions,
      this.dialogOptions.sharedDeviceOptions);
    this.controller = this.dialogOptions.controller;
    this.dayNightOptions = DayNightOption.forSelectList();
    this.timezoneId = this.dialogOptions.controller.TimeZoneId;
    this.timezoneAbbr = TimeUtil.getTimezoneAbbr(this.timezoneId);
  }

  ngOnInit() {
    super.ngOnInit();

    this.editTimerForm = new FormGroup({
      displayName: new FormControl(this.timer.DisplayName),
      devices: new FormControl(this.timer.DeviceIds, [Validators.required]),
      dayNight: new FormControl(this.timer.DayNightOption, [Validators.required, startEndTimeValidator]),
      startTime: new FormControl(this.timer.StartTime, [
        Validators.required,
        startEndTimeValidator,
      ]),
      endTime: new FormControl(this.timer.EndTime, [Validators.required, startEndTimeValidator]),
      syncTime: new FormControl(this.timer.SyncTime || this.timer.StartTimestamp, [
        Validators.required,
      ]),
      freq: new FormControl(this.timer.Frequency, [
        Validators.required,
        freqValidator,
        freqDurationValidator,
      ]),
      duration: new FormControl(this.timer.Duration, [
        Validators.required,
        durationValidator,
        freqDurationValidator,
      ]),
      active: new FormControl(this.timer.IsActive, [Validators.required]),
      dosingRecipe: new FormControl(this.timer.DosingRecipeId),
    });
    if (moment.tz(this.timezoneId)) {
      this.startTime.setValue(
        moment.tz(this.timer.StartTime, 'HH:mm:ss', this.timezoneId).format('HH:mm:ss')
      );
      this.endTime.setValue(
        moment.tz(this.timer.EndTime, 'HH:mm:ss', this.timezoneId).format('HH:mm:ss')
      );
      if (!this.timer.SyncTime) {
        this.syncTime.setValue(
          moment.utc(this.timer.StartTimestamp, 'HH:mm:ss').tz(this.timezoneId).format('HH:mm:ss')
        );
      }
    }

    this.subs.add(
      this.devices.valueChanges.subscribe((selected) => this.updateSelectedDevices(selected))
    );
    this.subs.add(
      this.editTimerForm.valueChanges.subscribe(() => {
        const freqMoment = moment(this.freq.value, 'HH:mm:ss');
        const durationMoment = moment(this.duration.value, 'HH:mm:ss');
        const syncMoment = moment.tz(this.syncTime.value, 'HH:mm:ss', this.timezoneId);
        const startTimestampMoment = moment
          .tz(this.syncTime.value, 'HH:mm:ss', this.timezoneId)
          .utc();
        const startTimeMoment = moment.tz(this.startTime.value, 'HH:mm:ss', this.timezoneId);
        const endTimeMoment = moment.tz(this.endTime.value, 'HH:mm:ss', this.timezoneId);

        this.timer.DisplayName = this.displayName.value;
        this.timer.DeviceIds = this.devices.value;
        this.timer.DayNightOption = this.dayNight.value;
        this.timer.StartTime = startTimeMoment.isValid()
          ? startTimeMoment.format('HH:mm:ss')
          : null;
        this.timer.EndTime = endTimeMoment.isValid() ? endTimeMoment.format('HH:mm:ss') : null;
        this.timer.StartTimestamp = startTimestampMoment.isValid()
          ? startTimestampMoment.format('HH:mm:ss')
          : null;
        this.timer.SyncTime = syncMoment.isValid() ? syncMoment.format('HH:mm:ss') : null;
        this.timer.Frequency = freqMoment.isValid() ? freqMoment.format('HH:mm:ss') : null;
        this.timer.Duration = durationMoment.isValid() ? durationMoment.format('HH:mm:ss') : null;
        this.timer.IsActive = this.active.value;
        this.timer.DosingRecipeId = this.dosingRecipe.value;

        this.getDescription();
      })
    );

    this.updateSelectedDevices(this.timer.DeviceIds);
    this.getDescription();
  }

  private getDescription() {
    if (!this.editTimerForm.valid) {
      return;
    }

    const timerResp = this.timer.getTimerResponse(this.selectedDeviceThrottles);
    this.controllerService.getTimerDescription(timerResp).subscribe((r) => {
      this.ruleDescription = r;
    });
  }

  get displayName() {
    return this.editTimerForm.get('displayName') as FormControl;
  }
  get devices() {
    return this.editTimerForm.get('devices') as FormControl;
  }
  get dayNight() {
    return this.editTimerForm.get('dayNight') as FormControl;
  }
  get startTime() {
    return this.editTimerForm.get('startTime') as FormControl;
  }
  get endTime() {
    return this.editTimerForm.get('endTime') as FormControl;
  }
  get syncTime() {
    return this.editTimerForm.get('syncTime') as FormControl;
  }
  get freq() {
    return this.editTimerForm.get('freq') as FormControl;
  }
  get duration() {
    return this.editTimerForm.get('duration') as FormControl;
  }
  get active() {
    return this.editTimerForm.get('active') as FormControl;
  }
  get dosingRecipe() {
    return this.editTimerForm.get('dosingRecipe') as FormControl;
  }

  get dosingRecipes() {
    return [...this.controller.DosingRecipes, ...this.controller.SharedDosingRecipes];
  }

  get controllerDosing() {
    return this.controller.EnableInlineDosing || this.controller.SharedModules.length > 0;
  }

  public update() {
    const updatedTimer = this.timer.getTimerResponse(this.selectedDeviceThrottles);
    const needsUpdate = this.devices.dirty || this.dayNight.dirty ||
    this.startTime.dirty || this.endTime.dirty || this.syncTime.dirty ||
    this.freq.dirty || this.duration.dirty || this.active.dirty ||
    this.dosingRecipe.dirty || DeviceThrottlesComponent.CheckDirty(this.selectedDeviceThrottles, this.editTimerForm);

    if (!updatedTimer.Id) {
      this.controllerService.createDeviceTimer(updatedTimer).subscribe(
        (newTimer) => {
          this.showMessage(`Added new Timer`);
          this.dialogRef.close({ timer: newTimer, needsUpdate: true });
        },
        (error) => this.handleError(error)
      );
    } else {
      this.controllerService.updateDeviceTimer(updatedTimer).subscribe(
        () => {
          this.showMessage(`Saved changes to Timer`);
          this.dialogRef.close({ timer: updatedTimer, needsUpdate: needsUpdate });
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
      case 'DayNightOption':
        this.showServerErrors(this.dayNight, errors);
        break;
      case 'StartTime':
        this.showServerErrors(this.startTime, errors);
        break;
      case 'EndTime':
        this.showServerErrors(this.endTime, errors);
        break;
      case 'StartTimestamp':
        this.showServerErrors(this.syncTime, errors);
        break;
      case 'Frequency':
        this.showServerErrors(this.freq, errors);
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

    const co2Selected = this.buildSelectedDeviceThrottles(devices);

    this.selectedDeviceThrottles.sort((devA, devB) => devA.Name.localeCompare(devB.Name));

    this.dayNight.enable();
    if (co2Selected) {
      this.dayNight.setValue(DayNightOption.DayOnly);
    }

    if (co2Selected) {
      this.dayNight.disable();
    }
  }
}

let startTimeValidated = false;
let endTimeValidated = false;

const startEndTimeValidator: ValidatorFn = (control: FormControl): ValidationErrors | null => {
  const formGroup = control.parent;
  let result: ValidationErrors = null;
  if (!formGroup) {
    return null;
  }

  const dayNight = formGroup.get('dayNight');
  const startTimeField = formGroup.get('startTime');
  const endTimeField = formGroup.get('endTime');
  if (dayNight.value !== DayNightOption.CustomTime) {
    startTimeField.setErrors(null, {emitEvent: false});
    endTimeField.setErrors(null, {emitEvent: false});
    return null;
  }

  if (startTimeValidated && endTimeValidated) {
    startTimeValidated = endTimeValidated = false;
  }
  const startTime = moment(startTimeField.value, 'HH:mm:ss');
  const endTime = moment(endTimeField.value, 'HH:mm:ss');

  if (startTime.isSame(endTime, 'minute')) {
    result = { valid: ['Start Time cannot be equal to End Time'] };
  }

  if (control === startTimeField) {
    startTimeValidated = true;
  }
  if (control === endTimeField) {
    endTimeValidated = true;
  }

  if (control !== startTimeField && !startTimeValidated) {
    startTimeField.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }
  if (control !== endTimeField && !endTimeValidated) {
    endTimeField.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }

  return result;
};
const freqValidator: ValidatorFn = (control: FormControl): ValidationErrors | null => {
  const freqMoment = moment.duration(control.value);

  if (freqMoment.asSeconds() < 1) {
    return { valid: ['Minimum frequency of 1 second'] };
  }

  return null;
};
const durationValidator: ValidatorFn = (control: FormControl): ValidationErrors | null => {
  const durationMoment = moment.duration(control.value);

  if (durationMoment.asSeconds() < 1) {
    return { valid: ['Minimum duration of 1 second'] };
  }

  return null;
};

let freqValidated = false;
let durationValidated = false;

const freqDurationValidator: ValidatorFn = (control: FormControl): ValidationErrors | null => {
  const formGroup = control.parent;
  let result: ValidationErrors = null;
  if (!formGroup) {
    return null;
  }
  if (freqValidated && durationValidated) {
    freqValidated = durationValidated = false;
  }
  const freqField = formGroup.get('freq');
  const durationField = formGroup.get('duration');
  const freqMoment = moment.duration(freqField.value);
  const durationMoment = moment.duration(durationField.value);

  if (freqMoment.asSeconds() <= durationMoment.asSeconds()) {
    result = { valid: ['Duration cannot be longer or equal to frequency'] };
  }

  if (control === freqField) {
    freqValidated = true;
  }
  if (control === durationField) {
    endTimeValidated = true;
  }

  if (control !== freqField && !freqValidated) {
    freqField.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }
  if (control !== durationField && !durationValidated) {
    durationField.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }

  return result;
};
