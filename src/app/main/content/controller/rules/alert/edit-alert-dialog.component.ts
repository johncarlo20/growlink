import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatSelectChange } from '@angular/material/select';
import * as moment from 'moment';

import {
  ComparisonType,
  DayNightOption,
  SensorAlert,
  SensorAlertResponse,
  SelectItem,
  RuleDialogOptions,
} from '@models';
import { ControllerService, ProgressBarService, ParticleSensorsService } from '@services';
import { BaseAPIComponent, TimeUtil } from '@util';

@Component({
  selector: 'fuse-edit-alert-dialog',
  templateUrl: './edit-alert-dialog.component.html',
})
export class EditAlertDialogComponent extends BaseAPIComponent implements OnInit {
  editAlertForm: FormGroup;
  alert: SensorAlert;
  dialogOptions: RuleDialogOptions;
  comparisonTypeOptions: SelectItem[];
  dayNightOptions: SelectItem[];
  ruleDescription = '';
  email: FormControl = null;
  timezoneId: string;
  timezoneAbbr: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { alert: SensorAlert; dialogOptions: RuleDialogOptions },
    public dialogRef: MatDialogRef<EditAlertDialogComponent, SensorAlertResponse>,
    private controllerService: ControllerService,
    private particleSensorService: ParticleSensorsService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);

    this.alert = data.alert;
    this.dialogOptions = data.dialogOptions;
    this.comparisonTypeOptions = ComparisonType.forSelectList();
    this.dayNightOptions = DayNightOption.forSelectList();
    this.timezoneId = this.dialogOptions.controller.TimeZoneId;
    this.timezoneAbbr = TimeUtil.getTimezoneAbbr(this.timezoneId);
  }

  ngOnInit() {
    this.editAlertForm = new FormGroup({
      sensor: new FormControl(this.alert.SensorId, [Validators.required]),
      compType: new FormControl(this.alert.ComparisonType, [Validators.required]),
      value: new FormControl(this.alert.Threshold, [Validators.required]),
      minDuration: new FormControl(this.alert.MinimumDuration),
      dayNight: new FormControl(this.alert.DayNightOption, [Validators.required, startEndTimeValidator]),
      startTime: new FormControl(this.alert.StartTime, [startEndTimeValidator]),
      endTime: new FormControl(this.alert.EndTime, [startEndTimeValidator]),
      emails: new FormControl(this.alert.EmailAddresses, [Validators.required]),
      sendPush: new FormControl(this.alert.SendPushNotifications, [Validators.required]),
      active: new FormControl(this.alert.IsActive, [Validators.required]),
    });

    this.email = new FormControl('', [Validators.email]);

    this.subs.add(
      this.sensor.valueChanges.subscribe(() => {
        if (!this.analogSensor && this.compType.value === 0) {
          this.value.setValue(0);
        }
        if (!this.analogSensor && this.compType.value === 1) {
          this.value.setValue(1);
        }
        if (!this.analogSensor && this.compType.value === null && this.value.value == null) {
          this.compType.setValue(1);
          this.value.setValue(1);
        }
      })
    );
    this.subs.add(
      this.editAlertForm.valueChanges.subscribe(() => {
        const minDurationMoment = moment(this.minDuration.value, 'HH:mm:ss');
        const startTimeMoment = moment.tz(this.startTime.value, 'HH:mm:ss', this.timezoneId);
        const endTimeMoment = moment.tz(this.endTime.value, 'HH:mm:ss', this.timezoneId);

        this.alert.SensorId = this.sensor.value;
        this.alert.ComparisonType = this.compType.value;
        this.alert.Threshold = this.value.value;
        this.alert.MinimumDuration = minDurationMoment.isValid()
          ? minDurationMoment.format('HH:mm:ss')
          : null;
        this.alert.DayNightOption = this.dayNight.value;
        this.alert.StartTime = startTimeMoment.isValid()
          ? startTimeMoment.format('HH:mm:ss')
          : null;
        this.alert.EndTime = endTimeMoment.isValid() ? endTimeMoment.format('HH:mm:ss') : null;
        this.alert.EmailAddresses = this.emails.value;
        this.alert.SendPushNotifications = this.sendPush.value;
        this.alert.IsActive = this.active.value;

        this.getDescription();
      })
    );

    this.getDescription();
  }
  private getDescription() {
    if (!this.editAlertForm.valid) {
      return;
    }

    const alertResp = this.alert.getAlertResponse();
    this.controllerService.getAlertDescription(alertResp).subscribe(r => {
      this.ruleDescription = r;
    });
  }

  get sensor() {
    return this.editAlertForm.get('sensor') as FormControl;
  }
  get compType() {
    return this.editAlertForm.get('compType') as FormControl;
  }
  get value() {
    return this.editAlertForm.get('value') as FormControl;
  }
  get minDuration() {
    return this.editAlertForm.get('minDuration') as FormControl;
  }
  get dayNight() {
    return this.editAlertForm.get('dayNight') as FormControl;
  }
  get startTime() {
    return this.editAlertForm.get('startTime') as FormControl;
  }
  get endTime() {
    return this.editAlertForm.get('endTime') as FormControl;
  }
  get emails() {
    return this.editAlertForm.get('emails') as FormControl;
  }
  get sendPush() {
    return this.editAlertForm.get('sendPush') as FormControl;
  }
  get active() {
    return this.editAlertForm.get('active') as FormControl;
  }

  get analogSensor() {
    const selectedSensor = this.dialogOptions.sensorOptions.find(
      sensor => sensor.Guid === this.sensor.value
    );
    const particleSensor = selectedSensor ? this.particleSensorService.FindParticleSensor(selectedSensor.ParticleSensor) : null;
    if (particleSensor && !particleSensor.IsBinary) {
      return true;
    }

    return false;
  }

  get lowFullSensor() {
    const selectedSensor = this.dialogOptions.sensorOptions.find(
      sensor => sensor.Guid === this.sensor.value
    );
    const particleSensor = selectedSensor ? this.particleSensorService.FindParticleSensor(selectedSensor.ParticleSensor) : null;
    if (particleSensor && this.particleSensorService.LowFullSensor(particleSensor)) {
      return true;
    }

    return false;
  }

  get onOffSensor() {
    const selectedSensor = this.dialogOptions.sensorOptions.find(
      sensor => sensor.Guid === this.sensor.value
    );
    const particleSensor = selectedSensor ? this.particleSensorService.FindParticleSensor(selectedSensor.ParticleSensor) : null;
    if (particleSensor && this.particleSensorService.OnOffSensor(particleSensor)) {
      return true;
    }

    return false;
  }

  getSensorReadingSuffix(sensorId: string): string {
    if (!this.dialogOptions.controller.Modules) {
      return '';
    }

    let suffix = '';
    this.dialogOptions.controller.Modules.filter(m => m.Sensors.length).forEach(m => {
      const sensor = m.Sensors.find(s => s.Guid === sensorId);
      if (sensor) {
        suffix = sensor.ReadingSuffix;
      }
    });

    return suffix;
  }

  addEmail(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our email
    if ((value || '').trim() && this.email.valid) {
      const currentEmails: string[] = this.emails.value.map(addr => addr);
      currentEmails.push(value.trim());
      this.emails.setValue(currentEmails);
    }

    // Reset the input value
    if (input && this.email.valid) {
      this.email.setValue(null);
    }
  }

  removeEmail(email: string): void {
    const index = this.emails.value.indexOf(email);

    if (index >= 0) {
      const currentEmails: string[] = this.emails.value.map(addr => addr);
      currentEmails.splice(index, 1);
      this.emails.setValue(currentEmails);
    }
  }

  public stateChanged(ev: MatSelectChange) {
    if (ev.value === 0) {
      this.compType.setValue(1); // Below
      this.value.setValue(1);
    }
    if (ev.value === 1) {
      this.compType.setValue(0); // Above
      this.value.setValue(0);
    }
  }

  public update() {
    const updatedAlert = this.alert.getAlertResponse();

    if (!updatedAlert.Id) {
      this.controllerService.createSensorAlert(updatedAlert).subscribe(
        newAlert => {
          this.showMessage(`Added new Alert`);
          newAlert.SensorId = updatedAlert.SensorId;
          this.dialogRef.close(newAlert);
        },
        error => this.handleError(error)
      );
    } else {
      this.controllerService.updateSensorAlert(updatedAlert).subscribe(
        () => {
          this.showMessage(`Saved changes to Alert`);
          this.dialogRef.close(updatedAlert);
        },
        error => this.handleError(error)
      );
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  protected showModelError(message: string, key: string, errors: string[]) {
    switch (key) {
      case 'SensorId':
        this.showServerErrors(this.sensor, errors);
        break;
      case 'DayNightOption':
        this.showServerErrors(this.dayNight, errors);
        break;
      case 'ComparisonType':
        this.showServerErrors(this.compType, errors);
        break;
      case 'Threshold':
        this.showServerErrors(this.value, errors);
        break;
      case 'MinimumDuration':
        this.showServerErrors(this.minDuration, errors);
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
