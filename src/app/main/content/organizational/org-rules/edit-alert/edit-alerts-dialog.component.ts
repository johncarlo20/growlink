import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatSelectChange } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as moment from 'moment';

import { MappedSensorAlert, MappedSensor, LinkedSensorAlert } from '../org-rules.models';
import { Controller, ComparisonType, DayNightOption, SensorAlert, SelectItem } from '@models';
import { ControllerService, ParticleSensorsService } from '@services';
import { BaseComponent, TimeUtil, Deviant, DeviantUtil } from '@util';

@Component({
  selector: 'fuse-edit-alerts-dialog',
  templateUrl: './edit-alerts-dialog.component.html',
  styleUrls: ['./edit-alerts-dialog.component.scss']
})
export class EditAlertsDialogComponent extends BaseComponent implements OnInit {
  rule: MappedSensorAlert;
  selectedSensor: MappedSensor;
  alert: SensorAlert;
  instances: LinkedSensorAlert[] = [];
  controllers: Controller[] = [];
  editAlertForm: FormGroup;
  comparisonTypeOptions: SelectItem[];
  dayNightOptions: SelectItem[];
  ruleDescription = '';
  email: FormControl = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { rule: MappedSensorAlert, controllers: Controller[] },
    public dialogRef: MatDialogRef<EditAlertsDialogComponent>,
    private particleSensorService: ParticleSensorsService,
    private controllerService: ControllerService
  ) {
    super();

    this.rule = data.rule;
    // this.alert = SensorAlert.GetAlert(this.rule);
    this.selectedSensor = this.rule.Sensor;
    this.controllers = [...data.controllers];
    this.instances = [...this.rule.Instances.map(instance => new LinkedSensorAlert(instance))];
    this.comparisonTypeOptions = ComparisonType.forSelectList();
    this.dayNightOptions = DayNightOption.forSelectList(true);
  }

  ngOnInit() {
    this.editAlertForm = new FormGroup({
      compType: new FormControl(this.alert.ComparisonType, [Validators.required]),
      value: new FormControl(this.alert.Threshold, [Validators.required]),
      minDuration: new FormControl(this.alert.MinimumDuration),
      dayNight: new FormControl(this.alert.DayNightOption, [Validators.required]),
      emails: new FormControl(this.alert.EmailAddresses, [Validators.required]),
      sendPush: new FormControl(this.alert.SendPushNotifications, [Validators.required]),
      active: new FormControl(this.alert.IsActive, [Validators.required]),
    });

    this.email = new FormControl('', [Validators.email]);

    this.subs.add(this.editAlertForm.valueChanges.subscribe(() => {
      const minDurationMoment = moment(this.minDuration.value, 'HH:mm:ss');
      const minDurationMomentFormatted = minDurationMoment.isValid() ? minDurationMoment.format('HH:mm:ss') : null;

      if (this.alert.ComparisonType !== this.compType.value) {
        this.alert.ComparisonType = this.compType.value;
        this.instances.forEach(instance => instance.ComparisonType = this.compType.value);
      }
      if (this.alert.Threshold !== this.value.value) {
        this.alert.Threshold = this.value.value;
        this.instances.forEach(instance => instance.Threshold = this.value.value);
      }
      if (this.alert.MinimumDuration !== minDurationMomentFormatted) {
        this.alert.MinimumDuration = minDurationMomentFormatted;
        this.instances.forEach(instance => instance.MinimumDuration = minDurationMomentFormatted);
      }
      if (this.alert.DayNightOption !== this.dayNight.value) {
        this.alert.DayNightOption = this.dayNight.value;
        this.instances.forEach(instance => instance.DayNightOption = this.dayNight.value);
      }
      if (this.alert.EmailAddresses !== this.emails.value) {
        this.alert.EmailAddresses = this.emails.value;
        this.instances.forEach(instance => instance.EmailAddresses = this.emails.value);
      }
      if (this.alert.IsActive !== this.active.value) {
        this.alert.IsActive = this.active.value;
        this.instances.forEach(instance => instance.IsActive = this.active.value);
      }
      if (this.alert.SendPushNotifications !== this.sendPush.value) {
        this.alert.SendPushNotifications = this.sendPush.value;
        this.instances.forEach(instance => instance.SendPushNotifications = this.sendPush.value);
      }

      this.getDescription();
    }));

    this.getDescription();
  }
  private getDescription() {
    if (!this.editAlertForm.valid) {
      return;
    }

    const alertResp = this.alert.getAlertResponse();
    this.controllerService.getAlertDescription(alertResp)
      .subscribe(r => { this.ruleDescription = r; });
  }

  get compType() { return this.editAlertForm.get('compType') as FormControl; }
  get value() { return this.editAlertForm.get('value') as FormControl; }
  get minDuration() { return this.editAlertForm.get('minDuration') as FormControl; }
  get dayNight() { return this.editAlertForm.get('dayNight') as FormControl; }
  get emails() { return this.editAlertForm.get('emails') as FormControl; }
  get sendPush() { return this.editAlertForm.get('sendPush') as FormControl; }
  get active() { return this.editAlertForm.get('active') as FormControl; }

  get ruleControllers(): string {
    return this.rule.Controllers.map(c => c.Name).sort((a, b) => a.localeCompare(b)).join(', ');
  }

  get analogSensor() {
    const particleSensor = this.selectedSensor ? this.particleSensorService.FindParticleSensor(this.selectedSensor.ParticleSensor) : null;
    if (particleSensor && !particleSensor.IsBinary) {
      return true;
    }

    return false;
  }

  get lowFullSensor() {
    const particleSensor = this.selectedSensor ? this.particleSensorService.FindParticleSensor(this.selectedSensor.ParticleSensor) : null;
    if (particleSensor && this.particleSensorService.LowFullSensor(particleSensor)) {
      return true;
    }

    return false;
  }

  get onOffSensor() {
    const particleSensor = this.selectedSensor ? this.particleSensorService.FindParticleSensor(this.selectedSensor.ParticleSensor) : null;
    if (particleSensor && this.particleSensorService.OnOffSensor(particleSensor)) {
      return true;
    }

    return false;
  }

  addEmail(event: MatChipInputEvent): void {
    const input = event.chipInput.inputElement;
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

  public get deviantMinimumDurations() {
    const deviants = this.instances
      .filter(alert => alert.MinimumDuration !== this.alert.MinimumDuration)
      .map(alert => new Deviant(alert.Controller.Name, `minimum ${TimeUtil.getHumanReadableDuration(alert.MinimumDuration)}`));

    return DeviantUtil.deviantsMapped(deviants);
  }

  public get deviantTimeOfDay() {
    const deviants = this.instances
      .filter(alert => alert.DayNightOption !== this.alert.DayNightOption)
      .map(alert => new Deviant(alert.Controller.Name, DayNightOption.toHumanReadable(alert.DayNightOption)));

    return DeviantUtil.deviantsMapped(deviants);
  }

  public get deviantEMails() {
    const deviants = this.instances
      .filter(alert => alert.EmailAddresses !== this.rule.EmailAddresses)
      .map(alert => new Deviant(alert.Controller.Name, alert.EmailAddresses));

    return DeviantUtil.deviantsMapped(deviants);
  }

  public get deviantIsActive() {
    const deviants = this.instances
      .filter(alert => alert.IsActive !== this.alert.IsActive)
      .map(alert => new Deviant(alert.Controller.Name, alert.IsActive ? 'Active' : 'Inactive'));

    return DeviantUtil.deviantsMapped(deviants);
  }

  public get deviantSendPush() {
    const deviants = this.instances
      .filter(alert => alert.SendPushNotifications !== this.alert.SendPushNotifications)
      .map(alert => new Deviant(alert.Controller.Name, alert.SendPushNotifications ? 'Sending Notifications' : 'Not Sending Notifications'));

    return DeviantUtil.deviantsMapped(deviants);
  }

  update(): void {
    this.dialogRef.close(this.instances);
  }
}
