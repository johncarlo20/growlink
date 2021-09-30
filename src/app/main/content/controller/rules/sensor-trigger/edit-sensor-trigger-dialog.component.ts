import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import * as moment from 'moment';

import {
  DeviceSensorTrigger,
  DeviceSensorTriggerResponse,
  ComparisonType,
  DayNightOption,
  DeviceResponse,
  Controller,
  SelectItem,
  SensorResponse,
  RuleDialogOptions,
} from '@models';
import {
  ControllerService,
  ProgressBarService,
  DeviceTypesService,
  ProductTypesService,
  ParticleSensorsService,
} from '@services';
import { EditRuleDialog, TimeUtil } from '@util';
import { DeviceThrottlesComponent } from '../device-throttles/device-throttles.component';

export class EditSensorTriggerDialogOptions {
  trigger: DeviceSensorTrigger;
  dialogOptions: RuleDialogOptions;
}
export class EditSensorTriggerDialogResult {
  trigger: DeviceSensorTriggerResponse;
  needsUpdate: boolean;
}

@Component({
  selector: 'fuse-edit-sensor-trigger-dialog',
  templateUrl: './edit-sensor-trigger-dialog.component.html',
})
export class EditSensorTriggerDialogComponent
  extends EditRuleDialog<EditSensorTriggerDialogComponent, EditSensorTriggerDialogResult>
  implements OnInit {
  editTriggerForm: FormGroup;
  controller: Controller;
  trigger: DeviceSensorTrigger;
  deviceOptions: DeviceResponse[];
  sensorOptions: SensorResponse[];
  comparisonTypeOptions: SelectItem[];
  dayNightOptions: SelectItem[];
  selectedDevicesDosing = false;
  ruleDescription = '';
  advancedOptions = false;
  timezoneId: string;
  timezoneAbbr: string;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: EditSensorTriggerDialogOptions,
    private particleSensorService: ParticleSensorsService,
    dialogRef: MatDialogRef<EditSensorTriggerDialogComponent, EditSensorTriggerDialogResult>,
    deviceService: DeviceTypesService,
    controllerService: ControllerService,
    productService: ProductTypesService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(dialogRef, deviceService, controllerService, productService, progressBarService, snackbar);

    this.trigger = data.trigger;
    this.dialogOptions = data.dialogOptions;
    this.controller = this.dialogOptions.controller;
    this.deviceOptions = this.standardDeviceFiltering(
      this.trigger,
      this.dialogOptions.deviceOptions,
      this.dialogOptions.sharedDeviceOptions);
    const controllerModule = this.controller.Modules.find((mod) => mod.SerialNumber === this.controller.DeviceId);
    this.sensorOptions = this.dialogOptions.sensorOptions.filter((sens) => {
      if (controllerModule.ProductType !== 75 && controllerModule.ProductType !== 76) {
        return true;
      }

      const sensorModule = this.controller.Modules.find((mod) => mod.Guid === sens.ModuleId);
      if (sensorModule && (sensorModule.ProductType === 75 || sensorModule.ProductType === 76)) {
        return true;
      }

      return false;
    });
    this.comparisonTypeOptions = ComparisonType.forSelectList();
    this.dayNightOptions = DayNightOption.forSelectList();
    this.advancedOptions =
      this.trigger.MaxRunForceOff ||
      this.trigger.MaxRunDuration ||
      this.trigger.MinRunDuration ||
      this.trigger.MinimumDuration
        ? true
        : false;
    this.timezoneId = this.dialogOptions.controller.TimeZoneId;
    this.timezoneAbbr = TimeUtil.getTimezoneAbbr(this.timezoneId);
  }

  ngOnInit() {
    super.ngOnInit();

    this.editTriggerForm = new FormGroup({
      displayName: new FormControl(this.trigger.DisplayName),
      devices: new FormControl(this.trigger.DeviceIds, [Validators.required]),
      sensor: new FormControl(this.trigger.SensorId, [Validators.required]),
      compType: new FormControl(this.trigger.ComparisonType, [
        Validators.required,
        valueResetValidator,
      ]),
      value: new FormControl(this.trigger.Value, [Validators.required, valueResetValidator]),
      minDuration: new FormControl(this.trigger.MinimumDuration),
      minRunTime: new FormControl(this.trigger.MinRunDuration),
      maxRunTime: new FormControl(this.trigger.MaxRunDuration),
      maxRunForceOff: new FormControl(this.trigger.MaxRunForceOff),
      resetAt: new FormControl(this.trigger.ResetThreshold, [valueResetValidator]),
      dayNight: new FormControl(this.trigger.DayNightOption, [Validators.required, startEndTimeValidator]),
      startTime: new FormControl(this.trigger.StartTime, [startEndTimeValidator]),
      endTime: new FormControl(this.trigger.EndTime, [startEndTimeValidator]),
      override: new FormControl(this.trigger.IsOverride, [Validators.required]),
      isProportional: new FormControl(this.trigger.IsProportionalControl, [Validators.required]),
      active: new FormControl(this.trigger.IsActive, [Validators.required]),
      advanced: new FormControl(this.advancedOptions),
      dosingRecipe: new FormControl(this.trigger.DosingRecipeId),
      startingThrottle: new FormControl(this.trigger.PropControlStartingThrottle, [
        startingThrottleValidator,
      ]),
      refreshRate: new FormControl(this.trigger.PropControlRefreshRate, [refreshRateValidator]),
    });
    if (moment.tz(this.timezoneId)) {
      this.startTime.setValue(
        moment.tz(this.trigger.StartTime, 'HH:mm:ss', this.timezoneId).format('HH:mm:ss')
      );
      this.endTime.setValue(
        moment.tz(this.trigger.EndTime, 'HH:mm:ss', this.timezoneId).format('HH:mm:ss')
      );
    }

    this.subs.add(
      this.devices.valueChanges.subscribe((selected) => this.updateSelectedDevices(selected))
    );
    this.subs.add(
      this.sensor.valueChanges.subscribe(() => {
        if (!this.analogSensor && this.compType.invalid) {
          this.compType.setValue(1);
        }
        if (!this.analogSensor && this.compType.value === 0) {
          this.value.setValue(0);
          this.resetAt.setValue(0);
        }
        if (!this.analogSensor && this.compType.value === 1) {
          this.value.setValue(1);
          this.resetAt.setValue(1);
        }
      })
    );
    this.subs.add(
      this.editTriggerForm.valueChanges.subscribe(() => {
        const minDurationMoment = moment(this.minDuration.value, 'HH:mm:ss');
        const minRunTimeMoment = moment(this.minRunTime.value, 'HH:mm:ss');
        const maxRunTimeMoment = moment(this.maxRunTime.value, 'HH:mm:ss');
        const refreshRateMoment = moment(this.refreshRate.value, 'HH:mm:ss');
        const startTimeMoment = moment.tz(this.startTime.value, 'HH:mm:ss', this.timezoneId);
        const endTimeMoment = moment.tz(this.endTime.value, 'HH:mm:ss', this.timezoneId);

        this.trigger.DisplayName = this.displayName.value;
        this.trigger.DeviceIds = this.devices.value;
        this.trigger.SensorId = this.sensor.value;
        this.trigger.ComparisonType = this.compType.value;
        this.trigger.Value = this.value.value;
        this.trigger.MinimumDuration = minDurationMoment.isValid()
          ? minDurationMoment.format('HH:mm:ss')
          : null;
        this.trigger.MinRunDuration = minRunTimeMoment.isValid()
          ? minRunTimeMoment.format('HH:mm:ss')
          : null;
        this.trigger.MaxRunDuration = maxRunTimeMoment.isValid()
          ? maxRunTimeMoment.format('HH:mm:ss')
          : null;
        this.trigger.MaxRunForceOff = this.maxRunForceOff.value;
        this.trigger.ResetThreshold = this.resetAt.value;
        this.trigger.DayNightOption = this.dayNight.value;
        this.trigger.StartTime = startTimeMoment.isValid()
          ? startTimeMoment.format('HH:mm:ss')
          : null;
        this.trigger.EndTime = endTimeMoment.isValid() ? endTimeMoment.format('HH:mm:ss') : null;
        this.trigger.IsOverride = this.override.value;
        this.trigger.IsProportionalControl = this.isProportional.value;
        this.trigger.IsActive = this.active.value;
        this.trigger.DosingRecipeId = this.dosingRecipe.value;
        this.advancedOptions = this.advanced.value;
        if (this.trigger.IsProportionalControl) {
          if (!this.startingThrottle.value) {
            this.trigger.PropControlStartingThrottle = 10;
            this.startingThrottle.setValue(10);
          } else {
            this.trigger.PropControlStartingThrottle = this.startingThrottle.value;
          }
          if (!this.refreshRate.value) {
            this.trigger.PropControlRefreshRate = '00:00:15';
            this.refreshRate.setValue('00:00:15');
          } else {
            this.trigger.PropControlRefreshRate = refreshRateMoment.isValid()
              ? refreshRateMoment.format('HH:mm:ss')
              : null;
          }
        } else {
          this.trigger.PropControlStartingThrottle = null;
          this.trigger.PropControlRefreshRate = null;
        }

        this.getDescription();
      })
    );

    this.updateSelectedDevices(this.trigger.DeviceIds);
    this.getDescription();
  }

  private getDescription() {
    if (!this.editTriggerForm.valid) {
      return;
    }

    const triggerResp = this.trigger.getSensorTriggerResponse(this.selectedDeviceThrottles);
    this.controllerService.getTriggerDescription(triggerResp).subscribe((r) => {
      this.ruleDescription = r;
    });
  }

  get displayName() {
    return this.editTriggerForm.get('displayName') as FormControl;
  }
  get devices() {
    return this.editTriggerForm.get('devices') as FormControl;
  }
  get sensor() {
    return this.editTriggerForm.get('sensor') as FormControl;
  }
  get compType() {
    return this.editTriggerForm.get('compType') as FormControl;
  }
  get value() {
    return this.editTriggerForm.get('value') as FormControl;
  }
  get minDuration() {
    return this.editTriggerForm.get('minDuration') as FormControl;
  }
  get minRunTime() {
    return this.editTriggerForm.get('minRunTime') as FormControl;
  }
  get maxRunTime() {
    return this.editTriggerForm.get('maxRunTime') as FormControl;
  }
  get maxRunForceOff() {
    return this.editTriggerForm.get('maxRunForceOff') as FormControl;
  }
  get resetAt() {
    return this.editTriggerForm.get('resetAt') as FormControl;
  }
  get dayNight() {
    return this.editTriggerForm.get('dayNight') as FormControl;
  }
  get startTime() {
    return this.editTriggerForm.get('startTime') as FormControl;
  }
  get endTime() {
    return this.editTriggerForm.get('endTime') as FormControl;
  }
  get override() {
    return this.editTriggerForm.get('override') as FormControl;
  }
  get isProportional() {
    return this.editTriggerForm.get('isProportional') as FormControl;
  }
  get active() {
    return this.editTriggerForm.get('active') as FormControl;
  }
  get advanced() {
    return this.editTriggerForm.get('advanced') as FormControl;
  }
  get dosingRecipe() {
    return this.editTriggerForm.get('dosingRecipe') as FormControl;
  }
  get startingThrottle() {
    return this.editTriggerForm.get('startingThrottle') as FormControl;
  }
  get refreshRate() {
    return this.editTriggerForm.get('refreshRate') as FormControl;
  }

  get dosingRecipes() {
    return [...this.controller.DosingRecipes, ...this.controller.SharedDosingRecipes];
  }

  get analogSensor() {
    const selectedSensor = this.dialogOptions.sensorOptions.find(
      (sensor) => sensor.Guid === this.sensor.value
    );
    const particleSensor = selectedSensor
      ? this.particleSensorService.FindParticleSensor(selectedSensor.ParticleSensor)
      : null;
    if (particleSensor && !particleSensor.IsBinary) {
      return true;
    }

    return false;
  }

  get lowFullSensor() {
    const selectedSensor = this.dialogOptions.sensorOptions.find(
      (sensor) => sensor.Guid === this.sensor.value
    );
    const particleSensor = selectedSensor
      ? this.particleSensorService.FindParticleSensor(selectedSensor.ParticleSensor)
      : null;
    if (particleSensor && this.particleSensorService.LowFullSensor(particleSensor)) {
      return true;
    }

    return false;
  }

  get onOffSensor() {
    const selectedSensor = this.dialogOptions.sensorOptions.find(
      (sensor) => sensor.Guid === this.sensor.value
    );
    const particleSensor = selectedSensor
      ? this.particleSensorService.FindParticleSensor(selectedSensor.ParticleSensor)
      : null;
    if (particleSensor && this.particleSensorService.OnOffSensor(particleSensor)) {
      return true;
    }

    return false;
  }

  get showProportionalControl(): boolean {
    const selectedSensor = this.dialogOptions.sensorOptions.find(
      (sensor) => sensor.Guid === this.sensor.value
    );
    const particleSensor = selectedSensor
      ? this.particleSensorService.FindParticleSensor(selectedSensor.ParticleSensor)
      : null;
    if (!particleSensor || !particleSensor.AllowProportionalControl) {
      return false;
    }

    const selectedIds = this.devices.value as string[];
    const selectedDevices = this.dialogOptions.deviceOptions.filter((dev) =>
      selectedIds.find((d) => d === dev.Guid)
    );
    const allModules = [...this.dialogOptions.controller.Modules, ...this.dialogOptions.controller.SharedModules];
    const selectedProducts = allModules.filter((mod) =>
      selectedDevices.find((sd) => sd.ModuleId === mod.Guid)
    ).map((mod) => this.productService.FindProductType(mod.ProductType));

    return selectedProducts.some((pt) => pt.AllowsProportionalControl);
  }

  get controllerDosing() {
    return this.controller.EnableInlineDosing || this.controller.SharedModules.length > 0;
  }

  getSensorReadingSuffix(sensorId: string): string {
    if (!this.dialogOptions.controller.Modules) {
      return '';
    }

    let suffix = '';
    this.dialogOptions.controller.Modules.filter((m) => m.Sensors.length).forEach((m) => {
      const sensor = m.Sensors.find((s) => s.Guid === sensorId);
      if (sensor) {
        suffix = sensor.ReadingSuffix;
      }
    });

    return suffix;
  }

  public stateChanged(ev: MatSelectChange) {
    if (ev.value === 0) {
      this.compType.setValue(1); // Below
      this.value.setValue(1);
      this.resetAt.setValue(1);
      this.value.markAsDirty();
    }
    if (ev.value === 1) {
      this.compType.setValue(0); // Above
      this.value.setValue(0);
      this.resetAt.setValue(0);
      this.value.markAsDirty();
    }
  }

  public update() {
    const updatedTrigger = this.trigger.getSensorTriggerResponse(this.selectedDeviceThrottles);
    const needsUpdate = this.devices.dirty || this.sensor.dirty ||
    this.startTime.dirty || this.endTime.dirty || this.dayNight.dirty ||
    this.compType.dirty || this.value.dirty || this.resetAt.dirty ||
    this.minDuration.dirty || this.minRunTime.dirty || this.maxRunTime.dirty ||
    this.maxRunForceOff.dirty || this.override.dirty || this.isProportional.dirty ||
    this.dosingRecipe.dirty || this.startingThrottle.dirty || this.refreshRate.dirty ||
    this.active.dirty || DeviceThrottlesComponent.CheckDirty(this.selectedDeviceThrottles, this.editTriggerForm);

    if (!updatedTrigger.Id) {
      this.controllerService.createDeviceSensorTrigger(updatedTrigger).subscribe(
        (newTrigger) => {
          this.showMessage(`Added new Sensor Trigger`);
          this.dialogRef.close({trigger: newTrigger, needsUpdate: true});
        },
        (error) => this.handleError(error)
      );
    } else {
      this.controllerService.updateDeviceSensorTrigger(updatedTrigger).subscribe(
        () => {
          this.showMessage(`Saved changed to Sensor Trigger`);
          this.dialogRef.close({trigger: updatedTrigger, needsUpdate: needsUpdate});
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
      case 'DayNightOption':
        this.showServerErrors(this.dayNight, errors);
        break;
      case 'SensorId':
        this.showServerErrors(this.sensor, errors);
        break;
      case 'ComparisonType':
        this.showServerErrors(this.compType, errors);
        break;
      case 'Value':
        this.showServerErrors(this.value, errors);
        break;
      case 'ResetThreshold':
        this.showServerErrors(this.resetAt, errors);
        break;
      case 'MinimumDuration':
        this.showServerErrors(this.minDuration, errors);
        break;
      case 'MinRunDuration':
        this.showServerErrors(this.minRunTime, errors);
        break;
      case 'MaxRunDuration':
        this.showServerErrors(this.maxRunTime, errors);
        break;
      case 'StartTime':
        this.showServerErrors(this.startTime, errors);
        break;
      case 'EndTime':
        this.showServerErrors(this.endTime, errors);
        break;
      case 'DosingRecipeId':
        this.showServerErrors(this.dosingRecipe, errors);
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

let compTypeValidated = false;
let valueValidated = false;
let resetValidated = false;

const valueResetValidator: ValidatorFn = (control: FormControl): ValidationErrors | null => {
  const formGroup = control.parent;
  let result: ValidationErrors = null;
  if (!formGroup) {
    return null;
  }

  if (compTypeValidated && valueValidated && resetValidated) {
    compTypeValidated = valueValidated = resetValidated = false;
  }

  const compTypeField = formGroup.get('compType');
  const valueField = formGroup.get('value');
  const resetField = formGroup.get('resetAt');
  const compType = compTypeField.value;
  const value = valueField.value;
  const resetAt = resetField.value;
  if (compType === ComparisonType.Above && resetAt > value) {
    result = { valid: ['Reset Threshold needs to be below trigger value'] };
  }
  if (compType === ComparisonType.Below && resetAt < value) {
    result = { valid: ['Reset Threshold needs to be above trigger value'] };
  }

  if (control === compTypeField) {
    compTypeValidated = true;
  }
  if (control === valueField) {
    valueValidated = true;
  }
  if (control === resetField) {
    resetValidated = true;
  }

  if (control !== compTypeField && !compTypeValidated) {
    compTypeField.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }
  if (control !== valueField && !valueValidated) {
    valueField.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }
  if (control !== resetField && !resetValidated) {
    resetField.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }

  return result;
};

const startingThrottleValidator: ValidatorFn = (control: FormControl): ValidationErrors | null => {
  const formGroup = control.parent;
  let result: ValidationErrors = null;
  if (!formGroup) {
    return null;
  }

  const isProportionalField = formGroup.get('isProportional');
  const startingThrottleField = formGroup.get('startingThrottle');
  const isProportional = isProportionalField.value;
  const startingThrottle = isProportional ? parseInt(startingThrottleField.value, 10) : null;

  if (isProportional && startingThrottle < 5) {
    result = { valid: ['Starting Throttle needs to be minimum 5%'] };
  }
  if (isProportional && startingThrottle > 100) {
    result = { valid: ['Starting Throttle cannot exceed 100%'] };
  }

  return result;
};

const refreshRateValidator: ValidatorFn = (control: FormControl): ValidationErrors | null => {
  const formGroup = control.parent;
  let result: ValidationErrors = null;
  if (!formGroup) {
    return null;
  }

  const isProportionalField = formGroup.get('isProportional');
  const refreshRateField = formGroup.get('refreshRate');
  const isProportional = isProportionalField.value;
  const refreshRate = isProportional ? moment(refreshRateField.value, 'HH:mm:ss') : null;

  if (isProportional && refreshRate.format('HH:mm:ss') === '00:00:00') {
    result = { valid: ['Refresh rate can not be zero'] };
  }

  return result;
};
