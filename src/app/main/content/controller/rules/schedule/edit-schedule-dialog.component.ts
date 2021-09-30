import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import * as moment from 'moment';

import { ControllerService, ProgressBarService, DeviceTypesService, ProductTypesService } from '@services';
import {
  DeviceSchedule,
  DeviceScheduleResponse,
  DayOfWeek,
  DeviceResponse,
  Controller,
  SelectItem,
  RuleDialogOptions,
} from '@models';
import { EditRuleDialog, TimeUtil } from '@util';
import { DeviceThrottlesComponent } from '../device-throttles/device-throttles.component';

export class EditScheduleDialogOptions {
  schedule: DeviceSchedule;
  dialogOptions: RuleDialogOptions;
}
export class EditScheduleDialogResult {
  schedule: DeviceScheduleResponse;
  needsUpdate: boolean;
}

@Component({
  selector: 'fuse-edit-schedule-dialog',
  templateUrl: './edit-schedule-dialog.component.html',
})
export class EditScheduleDialogComponent
  extends EditRuleDialog<EditScheduleDialogComponent, EditScheduleDialogResult>
  implements OnInit {
  editScheduleForm: FormGroup;
  controller: Controller;
  schedule: DeviceSchedule;
  deviceOptions: DeviceResponse[];
  dayOfWeekOptions: SelectItem[];
  selectedDevicesDosing = false;
  ruleDescription = '';
  timezoneId: string;
  timezoneAbbr: string;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: EditScheduleDialogOptions,
    dialogRef: MatDialogRef<EditScheduleDialogComponent, EditScheduleDialogResult>,
    controllerService: ControllerService,
    deviceService: DeviceTypesService,
    productService: ProductTypesService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(dialogRef, deviceService, controllerService, productService, progressBarService, snackbar);

    this.schedule = data.schedule;
    this.dialogOptions = data.dialogOptions;
    this.deviceOptions = this.standardDeviceFiltering(
      this.schedule,
      this.dialogOptions.deviceOptions,
      this.dialogOptions.sharedDeviceOptions);
    this.controller = this.dialogOptions.controller;
    this.dayOfWeekOptions = DayOfWeek.forSelectList();
    this.timezoneId = this.dialogOptions.controller.TimeZoneId;
    this.timezoneAbbr = TimeUtil.getTimezoneAbbr(this.timezoneId);
  }

  ngOnInit() {
    super.ngOnInit();

    this.editScheduleForm = new FormGroup({
      displayName: new FormControl(this.schedule.DisplayName),
      devices: new FormControl(this.schedule.DeviceIds, [Validators.required]),
      days: new FormControl(this.schedule.DaysOfWeek, [Validators.required]),
      startTime: new FormControl(this.schedule.StartTime, [
        Validators.required,
        startEndTimeValidator,
        fadeInOutValidator,
      ]),
      endTime: new FormControl(this.schedule.EndTime, [
        Validators.required,
        startEndTimeValidator,
        fadeInOutValidator,
      ]),
      fadeIn: new FormControl(this.schedule.ThrottleFadeIn, [fadeInOutValidator]),
      fadeOut: new FormControl(this.schedule.ThrottleFadeOut, [fadeInOutValidator]),
      active: new FormControl(this.schedule.IsActive, [Validators.required]),
      dosingRecipe: new FormControl(this.schedule.DosingRecipeId),
    });
    if (moment.tz(this.timezoneId)) {
      this.startTime.setValue(
        moment.tz(this.schedule.StartTime, 'HH:mm:ss', this.timezoneId).format('HH:mm:ss')
      );
      this.endTime.setValue(
        moment.tz(this.schedule.EndTime, 'HH:mm:ss', this.timezoneId).format('HH:mm:ss')
      );
    }

    this.subs.add(
      this.devices.valueChanges.subscribe((selected) => this.updateSelectedDevices(selected))
    );
    this.subs.add(
      this.days.valueChanges.subscribe((selected: DayOfWeek[]) => {
        if (selected.length > 1 && selected.indexOf(DayOfWeek.Everyday) !== -1) {
          this.days.setValue([DayOfWeek.Everyday]);
        }
      })
    );
    this.subs.add(
      this.editScheduleForm.valueChanges.subscribe(() => {
        const startTimeMoment = moment.tz(this.startTime.value, 'HH:mm:ss', this.timezoneId);
        const endTimeMoment = moment.tz(this.endTime.value, 'HH:mm:ss', this.timezoneId);

        this.schedule.DisplayName = this.displayName.value;
        this.schedule.DeviceIds = this.devices.value;
        this.schedule.DaysOfWeek = this.days.value;
        this.schedule.StartTime = startTimeMoment.isValid()
          ? startTimeMoment.format('HH:mm:ss')
          : null;
        this.schedule.EndTime = endTimeMoment.isValid() ? endTimeMoment.format('HH:mm:ss') : null;
        this.schedule.ThrottleFadeIn = this.fadeIn.value;
        this.schedule.ThrottleFadeOut = this.fadeOut.value;
        this.schedule.IsActive = this.active.value;
        this.schedule.DosingRecipeId = this.dosingRecipe.value;

        this.getDescription();
      })
    );

    this.updateSelectedDevices(this.schedule.DeviceIds);
    this.getDescription();
  }

  private getDescription() {
    if (!this.editScheduleForm.valid) {
      return;
    }

    const scheduleResp = this.schedule.getScheduleResponse(this.selectedDeviceThrottles);
    this.controllerService.getScheduleDescription(scheduleResp).subscribe((r) => {
      this.ruleDescription = r;
    });
  }

  get displayName() {
    return this.editScheduleForm.get('displayName') as FormControl;
  }
  get devices() {
    return this.editScheduleForm.get('devices') as FormControl;
  }
  get days() {
    return this.editScheduleForm.get('days') as FormControl;
  }
  get startTime() {
    return this.editScheduleForm.get('startTime') as FormControl;
  }
  get endTime() {
    return this.editScheduleForm.get('endTime') as FormControl;
  }
  get fadeIn() {
    return this.editScheduleForm.get('fadeIn') as FormControl;
  }
  get fadeOut() {
    return this.editScheduleForm.get('fadeOut') as FormControl;
  }
  get active() {
    return this.editScheduleForm.get('active') as FormControl;
  }
  get dosingRecipe() {
    return this.editScheduleForm.get('dosingRecipe') as FormControl;
  }

  get dosingRecipes() {
    return [...this.controller.DosingRecipes, ...this.controller.SharedDosingRecipes];
  }

  get controllerDosing() {
    return this.controller.EnableInlineDosing || this.controller.SharedModules.length > 0;
  }

  public update() {
    const updatedSchedule = this.schedule.getScheduleResponse(this.selectedDeviceThrottles);
    const needsUpdate = this.devices.dirty || this.days.dirty ||
    this.startTime.dirty || this.endTime.dirty ||
    this.fadeIn.dirty || this.fadeOut.dirty || this.active.dirty ||
    this.dosingRecipe.dirty || DeviceThrottlesComponent.CheckDirty(this.selectedDeviceThrottles, this.editScheduleForm);

    if (!updatedSchedule.Id) {
      this.controllerService.createDeviceSchedule(updatedSchedule).subscribe(
        (newSchedule) => {
          this.showMessage(`Added new Schedule`);
          this.dialogRef.close({schedule: newSchedule, needsUpdate: true});
        },
        (error) => this.handleError(error)
      );
    } else {
      this.controllerService.updateDeviceSchedule(updatedSchedule).subscribe(
        () => {
          this.showMessage(`Saved changes to Schedule`);
          this.dialogRef.close({schedule: updatedSchedule, needsUpdate: needsUpdate});
        },
        (error) => this.handleError(error)
      );
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  public get allowsFade(): boolean {
    return this.selectedDeviceThrottles.findIndex((s) => s.AllowsFade) >= 0;
  }

  protected showModelError(message: string, key: string, errors: string[]) {
    switch (key) {
      case 'DeviceIds':
        this.showServerErrors(this.devices, errors);
        break;
      case 'DosingRecipeId':
        this.showServerErrors(this.dosingRecipe, errors);
        break;
      case 'DaysOfWeek':
        this.showServerErrors(this.days, errors);
        break;
      case 'StartTime':
        this.showServerErrors(this.startTime, errors);
        break;
      case 'EndTime':
        this.showServerErrors(this.endTime, errors);
        break;
      case 'FadeIn':
        this.showServerErrors(this.fadeIn, errors);
        break;
      case 'FadeOut':
        this.showServerErrors(this.fadeOut, errors);
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
        const devType = this.deviceService.FindDeviceType(dev.DeviceType);

        return devType.AllowsRuleDosingRecipe;
      });

    this.selectedDeviceThrottles = this.selectedDeviceThrottles.filter(
      (s) => devices.indexOf(s.Guid) > -1
    );

    this.buildSelectedDeviceThrottles(devices);

    this.selectedDeviceThrottles.sort((devA, devB) => devA.Name.localeCompare(devB.Name));
  }
}

let startTimeValidated = false;
let endTimeValidated = false;
let fadeInValidated = false;
let fadeOutValidated = false;

const startEndTimeValidator: ValidatorFn = (control: FormControl): ValidationErrors | null => {
  const formGroup = control.parent;
  let result: ValidationErrors = null;
  if (!formGroup) {
    return null;
  }

  if (startTimeValidated && endTimeValidated) {
    startTimeValidated = endTimeValidated = false;
  }
  const startTimeField = formGroup.get('startTime');
  const endTimeField = formGroup.get('endTime');
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

const fadeInOutValidator: ValidatorFn = (control: FormControl): ValidationErrors | null => {
  const formGroup = control.parent;
  let result: ValidationErrors = null;
  if (!formGroup) {
    return null;
  }

  if (fadeInValidated && fadeOutValidated) {
    fadeInValidated = fadeOutValidated = false;
  }
  const startTimeField = formGroup.get('startTime');
  const endTimeField = formGroup.get('endTime');
  const startTime = moment(startTimeField.value, 'HH:mm:ss');
  const endTime = moment(endTimeField.value, 'HH:mm:ss');
  const fadeInField = formGroup.get('fadeIn');
  const fadeOutField = formGroup.get('fadeOut');
  const fadeIn = moment.duration(fadeInField.value);
  const fadeOut = moment.duration(fadeOutField.value);
  const runTime = moment.duration(endTime.diff(startTime)).abs();
  const fadeTime = fadeIn.add(fadeOut);

  if (fadeTime.asSeconds() > runTime.asSeconds()) {
    result = {
      valid: [
        `Total fade time ${fadeTime.humanize()} cannot exceed total running time ${runTime.humanize()}`,
      ],
    };
  }

  if (control === fadeInField) {
    fadeInValidated = true;
  }
  if (control === fadeOutField) {
    fadeOutValidated = true;
  }

  if (control !== fadeInField && !fadeInValidated) {
    fadeInField.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }
  if (control !== fadeOutField && !fadeOutValidated) {
    fadeOutField.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }

  return result;
};
