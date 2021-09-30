import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import * as moment from 'moment';

import { Controller, CropSteeringProgram, CropSteeringProgramResponse, DeviceResponse, DeviceTypes, ParticleSensor, RuleDialogOptions, SensorResponse } from '@models';
import {
  ControllerService,
  DeviceTypesService,
  ProductTypesService,
  ProgressBarService,
} from '@services';
import { EditRuleDialog, TimeUtil } from '@util';
import { debounce } from 'lodash';

export class EditProgramDialogOptions {
  program: CropSteeringProgram;
  dialogOptions: RuleDialogOptions;
}
export class EditProgramDialogResult {
  program: CropSteeringProgramResponse;
  needsUpdate: boolean;
}

@Component({
  selector: 'fuse-edit-program-dialog',
  templateUrl: './edit-program-dialog.component.html',
})
export class EditProgramDialogComponent
  extends EditRuleDialog<EditProgramDialogComponent, EditProgramDialogResult>
  implements OnInit {
  editProgramForm: FormGroup;
  controller: Controller;
  program: CropSteeringProgram;
  sensorOptions: SensorResponse[];
  deviceOptions: DeviceResponse[];
  timezoneId: string;
  timezoneAbbr: string;
  // Calculations
  estimatedRampUpWindow = '';
  estimatedIrrigationEvents = '';
  rampUpShotSizeSeconds = '';

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: EditProgramDialogOptions,
    dialogRef: MatDialogRef<EditProgramDialogComponent, EditProgramDialogResult>,
    deviceService: DeviceTypesService,
    controllerService: ControllerService,
    productService: ProductTypesService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(dialogRef, deviceService, controllerService, productService, progressBarService, snackbar);

    this.program = data.program;
    this.dialogOptions = data.dialogOptions;
    this.deviceOptions = this.dialogOptions.deviceOptions.filter((dev) => {
      const usedDevice = this.program.Devices && this.program.Devices.find((devId) => dev.Guid === devId);
      if (usedDevice) {
        return true;
      }

      return this.isUsableDevice(dev, this.dialogOptions.sharedDeviceOptions) &&
        (dev.DeviceType === DeviceTypes.Valve || dev.DeviceType === DeviceTypes.ExclusiveValve);
    });
    this.sensorOptions = this.dialogOptions.sensorOptions.filter((sens) => {
      const usedSensor = this.program.SensorId === sens.Guid;
      if (usedSensor) {
        return true;
      }

      return sens.ParticleSensor === ParticleSensor.SoilMoisture ||
          sens.ParticleSensor === ParticleSensor.SoilMoisture1 ||
          sens.ParticleSensor === ParticleSensor.SoilMoisture2 ||
          sens.ParticleSensor === ParticleSensor.SoilMoisture3 ||
          sens.ParticleSensor === ParticleSensor.SoilMoisture4 ||
          sens.ParticleSensor === ParticleSensor.SoilMoisture5;
    });
    this.timezoneId = this.dialogOptions.controller.TimeZoneId;
    this.timezoneAbbr = TimeUtil.getTimezoneAbbr(this.timezoneId);
    this.controller = this.dialogOptions.controller;
    this.validateProgram = debounce(this.validateProgram, 500);
    this.getShotConfig = debounce(this.getShotConfig, 200);
  }

  ngOnInit() {
    super.ngOnInit();

    this.editProgramForm = new FormGroup({
      name: new FormControl(this.program.Name),
      devices: new FormControl(this.program.Devices, [Validators.required]),
      sensor: new FormControl(this.program.SensorId, [Validators.required]),
      startTime: new FormControl(this.program.LightsOnTime, [startEndTimeValidator]),
      endTime: new FormControl(this.program.IrrigationEndTime, [startEndTimeValidator]),
      rampUpTarget: new FormControl(this.program.RampUpTarget, [Validators.required]),
      dryBackTarget: new FormControl(this.program.DryBackTarget, [Validators.required]),
      maintenanceDryBack: new FormControl(this.program.MaintenanceDryBack, [Validators.required]),
      onePercentShotSize: new FormControl(this.program.OnePercentShotSize, [Validators.required]),
      rampUpShotSize: new FormControl(this.program.RampUpShotSize, [Validators.required]),
      rampUpShotInterval: new FormControl(this.program.RampUpShotInterval, [Validators.required]),
      additionalDryBack: new FormControl(this.program.AdditionalDryBack),
      active: new FormControl(this.program.IsActive, [Validators.required]),
    });
    if (moment.tz(this.timezoneId)) {
      this.startTime.setValue(
        moment.tz(this.program.LightsOnTime, 'HH:mm:ss', this.timezoneId).format('HH:mm:ss')
      );
      this.endTime.setValue(
        moment.tz(this.program.IrrigationEndTime, 'HH:mm:ss', this.timezoneId).format('HH:mm:ss')
      );
    }

    this.subs.add(
      this.sensor.valueChanges.subscribe(() => {
      })
    );
    this.subs.add(
      this.editProgramForm.valueChanges.subscribe(() => {
        const startTimeMoment = moment.tz(this.startTime.value, 'HH:mm:ss', this.timezoneId);
        const endTimeMoment = moment.tz(this.endTime.value, 'HH:mm:ss', this.timezoneId);

        this.program.Name = this.name.value;
        this.program.Devices = this.devices.value;
        this.program.SensorId = this.sensor.value;
        this.program.LightsOnTime = startTimeMoment.isValid() ? startTimeMoment.format('HH:mm:ss') : null;
        this.program.IrrigationEndTime = endTimeMoment.isValid() ? endTimeMoment.format('HH:mm:ss') : null;
        this.program.RampUpTarget = this.rampUpTarget.value;
        this.program.MaintenanceDryBack = this.maintenanceDryBack.value;
        this.program.OnePercentShotSize = this.onePercentShotSize.value;
        this.program.RampUpShotSize = this.rampUpShotSize.value;
        this.program.RampUpShotInterval = this.rampUpShotInterval.value;
        this.program.DryBackTarget = this.dryBackTarget.value;
        this.program.AdditionalDryBack = this.additionalDryBack.value;
        this.program.IsActive = this.active.value;

        this.validateProgram();
        this.getShotConfig();
      })
    );

    this.getShotConfig();
  }

  private validateProgram() {
    const programRequest = this.program.getProgramRequest();

    const clearErrors = () => {
      for (const key in this.editProgramForm.controls) {
        if (Object.prototype.hasOwnProperty.call(this.editProgramForm.controls, key)) {
          const control = this.editProgramForm.controls[key];
          if (control.hasError('server')) {
            control.setErrors({server: null});
            control.updateValueAndValidity({emitEvent: false});
          }
        }
      }
    };

    this.controllerService.validateCropSteeringProgram(programRequest).subscribe(
      result => clearErrors(),
      error => {
        clearErrors();
        this.handleError(error);
      });
  }

  private getShotConfig() {
    if (!this.maintenanceDryBack.valid || !this.onePercentShotSize.valid
      || !this.rampUpShotSize.valid || !this.rampUpShotInterval.valid) {
      return;
    }

    const request = this.program.getProgramRequest();
    this.controllerService.getCropSteeringShotConfig(request).subscribe((config) => {
      this.estimatedRampUpWindow = config.estimatedRampUpWindow.toFixed(1);
      this.estimatedIrrigationEvents = config.estimatedIrrigationEvents.toFixed(1);
      this.rampUpShotSizeSeconds = config.rampUpShotSizeSeconds.toFixed(1);
    });
  }

  get name() {
    return this.editProgramForm.get('name') as FormControl;
  }
  get devices() {
    return this.editProgramForm.get('devices') as FormControl;
  }
  get sensor() {
    return this.editProgramForm.get('sensor') as FormControl;
  }
  get startTime() {
    return this.editProgramForm.get('startTime') as FormControl;
  }
  get endTime() {
    return this.editProgramForm.get('endTime') as FormControl;
  }
  get rampUpTarget() {
    return this.editProgramForm.get('rampUpTarget') as FormControl;
  }
  get dryBackTarget() {
    return this.editProgramForm.get('dryBackTarget') as FormControl;
  }
  get additionalDryBack() {
    return this.editProgramForm.get('additionalDryBack') as FormControl;
  }
  get maintenanceDryBack() {
    return this.editProgramForm.get('maintenanceDryBack') as FormControl;
  }
  get onePercentShotSize() {
    return this.editProgramForm.get('onePercentShotSize') as FormControl;
  }
  get rampUpShotSize() {
    return this.editProgramForm.get('rampUpShotSize') as FormControl;
  }
  get rampUpShotInterval() {
    return this.editProgramForm.get('rampUpShotInterval') as FormControl;
  }
  get active() {
    return this.editProgramForm.get('active') as FormControl;
  }

  public update() {
    const updatedTrigger = this.program.getProgramRequest();
    const needsUpdate = this.devices.dirty || this.sensor.dirty ||
    this.startTime.dirty || this.endTime.dirty || this.rampUpTarget.dirty ||
    this.maintenanceDryBack.dirty || this.dryBackTarget.dirty || this.additionalDryBack.dirty ||
    this.onePercentShotSize.dirty || this.rampUpShotSize.dirty || this.rampUpShotInterval.dirty ||
    this.active.dirty;

    if (!this.program.Id) {
      this.controllerService.createCropSteeringProgram(updatedTrigger).subscribe(
        (newProgramId) => {
          this.program.Id = newProgramId;
          this.showMessage(`Added new Crop Steering Program`);
          this.dialogRef.close({program: this.program.getProgramResponse(), needsUpdate: true});
        },
        (error) => this.handleError(error)
      );
    } else {
      this.controllerService.updateCropSteeringProgram(this.program.Id, updatedTrigger).subscribe(
        () => {
          this.showMessage(`Saved changed to Crop Steering Program`);
          this.dialogRef.close({program: this.program.getProgramResponse(), needsUpdate: needsUpdate});
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
      case 'Name':
      case 'name':
        this.showServerErrors(this.name, errors);
        break;
      case 'SensorId':
      case 'sensorId':
        this.showServerErrors(this.sensor, errors);
        break;
      case 'Devices':
      case 'devices':
        this.showServerErrors(this.devices, errors);
        break;
      case 'irrigationStartTime':
      case 'IrrigationStartTime':
        this.showServerErrors(this.startTime, errors);
        break;
      case 'IrrigationEndTime':
      case 'irrigationEndTime':
        this.showServerErrors(this.endTime, errors);
        break;
      case 'RampUpTarget':
      case 'rampUpTarget':
        this.showServerErrors(this.rampUpTarget, errors);
        break;
      case 'DryBackTarget':
      case 'dryBackTarget':
        this.showServerErrors(this.dryBackTarget, errors);
        break;
      case 'AdditionalDryBack':
      case 'additionalDryBack':
        this.showServerErrors(this.additionalDryBack, errors);
        break;
      case 'MaintenanceDryBack':
      case 'maintenanceDryBack':
        this.showServerErrors(this.maintenanceDryBack, errors);
        break;
      case 'OnePercentShotSize':
      case 'onePercentShotSize':
        this.showServerErrors(this.onePercentShotSize, errors);
        break;
      case 'RampUpShotSize':
      case 'rampUpShotSize':
        this.showServerErrors(this.rampUpShotSize, errors);
        break;
      case 'RampUpShotInterval':
      case 'rampUpShotInterval':
        this.showServerErrors(this.rampUpShotInterval, errors);
        break;
      default:
        super.showModelError(message, key, errors);
        break;
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

  if (startTimeValidated && endTimeValidated) {
    startTimeValidated = endTimeValidated = false;
  }
  const startTimeField = formGroup.get('startTime');
  const endTimeField = formGroup.get('endTime');
  const startTime = moment(startTimeField.value, 'HH:mm:ss');
  const endTime = moment(endTimeField.value, 'HH:mm:ss');

  if (startTime.isSame(endTime, 'minute')) {
    result = { valid: ['Irrigation Start Time cannot be equal to End Time'] };
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
