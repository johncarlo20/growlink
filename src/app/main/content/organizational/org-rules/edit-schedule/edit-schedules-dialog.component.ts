import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as moment from 'moment';

import { MappedDeviceSchedule, MappedDevice, LinkedDeviceSchedule } from '../org-rules.models';
import { Controller, DeviceSchedule, DeviceWithThrottle, DayOfWeek, SelectItem } from '@models';
import { ControllerService, ProductTypesService } from '@services';
import { BaseComponent, Deviant, DeviantUtil } from '@util';

@Component({
  selector: 'fuse-edit-schedules-dialog',
  templateUrl: './edit-schedules-dialog.component.html',
  styleUrls: ['./edit-schedules-dialog.component.scss']
})
export class EditSchedulesDialogComponent extends BaseComponent implements OnInit {
  rule: MappedDeviceSchedule;
  schedule: DeviceSchedule;
  instances: LinkedDeviceSchedule[] = [];
  devices: MappedDevice[] = [];
  controllers: Controller[] = [];
  selectedDevices: string;
  editScheduleForm: FormGroup;
  dayOfWeekOptions: SelectItem[] = [];
  allDeviceThrottles: DeviceWithThrottle[] = [];
  ruleDescription = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { rule: MappedDeviceSchedule, controllers: Controller[], devices: MappedDevice[] },
  public dialogRef: MatDialogRef<EditSchedulesDialogComponent>,
  private controllerService: ControllerService,
  private productService: ProductTypesService
  ) {
    super();

    this.rule = data.rule;
    // this.schedule = DeviceSchedule.GetSchedule(this.rule, this.devices, );
    this.devices = [...data.devices].sort((a, b) => a.Name.localeCompare(b.Name));
    this.controllers = [...data.controllers];
    this.instances = [...this.rule.Instances.map(instance => new LinkedDeviceSchedule(instance))];
    this.selectedDevices = this.devices.map(dev => dev.Name).join(', ');
    this.dayOfWeekOptions = DayOfWeek.forSelectList();
  }

  ngOnInit() {
    this.editScheduleForm = new FormGroup({
      days: new FormControl(this.schedule.DaysOfWeek, [Validators.required]),
      startTime: new FormControl(this.schedule.StartTime, [Validators.required]),
      endTime: new FormControl(this.schedule.EndTime, [Validators.required]),
      fadeIn: new FormControl(this.schedule.ThrottleFadeIn),
      fadeOut: new FormControl(this.schedule.ThrottleFadeOut),
      active: new FormControl(this.schedule.IsActive, [Validators.required]),
    });

    this.subs.add(this.days.valueChanges.subscribe((selected: DayOfWeek[]) => {
      if (selected.length > 1 && selected.indexOf(DayOfWeek.Everyday) !== -1) {
        this.days.setValue([DayOfWeek.Everyday]);
      }
    }));
    this.subs.add(this.editScheduleForm.valueChanges.subscribe(() => {
      const startMoment = moment(this.startTime.value, 'HH:mm:ss');
      const endMoment = moment(this.endTime.value, 'HH:mm:ss');
      const startMomentFormatted = startMoment.isValid() ? startMoment.format('HH:mm:ss') : null;
      const endMomentFormatted = endMoment.isValid() ? endMoment.format('HH:mm:ss') : null;

      if (this.schedule.DaysOfWeek !== this.days.value) {
        this.schedule.DaysOfWeek = this.days.value;
        this.instances.forEach(instance => instance.DaysOfWeek = this.days.value);
      }
      if (this.schedule.StartTime !== startMomentFormatted) {
        this.schedule.StartTime = startMomentFormatted;
        this.instances.forEach(instance => instance.StartTime = startMomentFormatted);
      }
      if (this.schedule.EndTime !== endMomentFormatted) {
        this.schedule.EndTime = endMomentFormatted;
        this.instances.forEach(instance => instance.EndTime = endMomentFormatted);
      }
      if (this.schedule.ThrottleFadeIn !== this.fadeIn.value) {
        this.schedule.ThrottleFadeIn = this.fadeIn.value;
        this.instances.forEach(instance => instance.ThrottleFadeIn = this.fadeIn.value);
      }
      if (this.schedule.ThrottleFadeOut !== this.fadeOut.value) {
        this.schedule.ThrottleFadeOut = this.fadeOut.value;
        this.instances.forEach(instance => instance.ThrottleFadeOut = this.fadeOut.value);
      }
      if (this.schedule.IsActive !== this.active.value) {
        this.schedule.IsActive = this.active.value;
        this.instances.forEach(instance => instance.IsActive = this.active.value);
      }

      this.allDeviceThrottles.forEach(throttle => {
        const slider = this.editScheduleForm.get(`throttle-${throttle.Guid}`);
        if (!slider) { return; }

        if (throttle.Throttle !== slider.value) {
          throttle.Throttle = slider.value;
          if (throttle.Guid === this.rule.DeviceId) {
            this.instances.forEach(instance => instance.Throttle = throttle.Throttle);
          } else {
            const addIdx = this.rule.AdditionalDeviceIds.findIndex(addId => addId === throttle.Guid);
            this.instances.forEach(instance => instance.AdditionalThrottles[addIdx] = throttle.Throttle);
          }
        }
      });

      this.getDescription();
    }));

    this.populateDeviceThrottles();
    this.getDescription();
  }
  private getDescription() {
    if (!this.editScheduleForm.valid) {
      return;
    }

    const scheduleResp = this.schedule.getScheduleResponse(this.allDeviceThrottles);
    this.controllerService.getScheduleDescription(scheduleResp)
      .subscribe(r => { this.ruleDescription = r; });
  }

  get days() { return this.editScheduleForm.get('days') as FormControl; }
  get startTime() { return this.editScheduleForm.get('startTime') as FormControl; }
  get endTime() { return this.editScheduleForm.get('endTime') as FormControl; }
  get fadeIn() { return this.editScheduleForm.get('fadeIn') as FormControl; }
  get fadeOut() { return this.editScheduleForm.get('fadeOut') as FormControl; }
  get active() { return this.editScheduleForm.get('active') as FormControl; }

  get ruleControllers(): string {
    return this.rule.Controllers.map(c => c.Name).sort((a, b) => a.localeCompare(b)).join(', ');
  }

  public get allowsFade(): boolean {
    return this.allDeviceThrottles.findIndex(s => s.AllowsFade) >= 0;
  }

  get deviceThrottles() {
    return this.allDeviceThrottles
      .filter(throttle => throttle.AllowsThrottle);
  }

  public get deviantIsActive() {
    const deviants = this.instances
    .filter(schedule => schedule.IsActive !== this.schedule.IsActive)
    .map(schedule => new Deviant(schedule.Controller.Name, schedule.IsActive ? 'Active' : 'Inactive'));

    return DeviantUtil.deviantsMapped(deviants);
  }

  update(): void {
    this.dialogRef.close(this.instances);
  }

  private populateDeviceThrottles() {
    this.devices
      .forEach(dev => {
        const productType = this.productService.FindProductType(dev.Module.ProductType);
        const allowsThrottle: boolean = (productType && productType.AllowsRuleThrottling);
        const allowsFade: boolean = productType && productType.IsLightingController;
        const throttle = dev.Guid === this.rule.DeviceId ?
          this.rule.Throttle :
          this.rule.AdditionalThrottles[this.rule.AdditionalDeviceIds.findIndex(addId => addId === dev.Guid)];

        const dwt = Object.assign<DeviceWithThrottle, Partial<DeviceWithThrottle>>(new DeviceWithThrottle(), {
          Guid: dev.Guid,
          Name: dev.Name,
          DeviceType: dev.DeviceType,
          InterfaceType: dev.InterfaceType,
          AllowsFade: allowsFade,
          AllowsThrottle: allowsThrottle,
          Throttle: throttle,
          IsBACNet: true,
          BACNetValue: null,
          BACNetSuffix: dev.BacnetValueSuffix,
        });

        this.allDeviceThrottles.push(dwt);
      });

    this.allDeviceThrottles
      .filter(throttle => throttle.AllowsThrottle)
      .forEach(throttle => {
        const controlKey = `throttle-${throttle.Guid}`;
        if (!this.editScheduleForm.contains(controlKey)) {
          this.editScheduleForm.addControl(controlKey, new FormControl(throttle.Throttle));
        }
      });
  }
}
