import { Component, OnInit } from '@angular/core';
import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';

import { ControllerService } from '@services';
import {
  DeviceSensorTriggerResponse,
  DeviceTimerResponse,
  DeviceScheduleResponse,
  SensorAlertResponse,
} from '@models';
import {
  MappedRule,
  MappedRuleGroup,
  MappedSensor,
  MappedDevice,
  MappedDeviceSensorTrigger,
  MappedDeviceTimer,
  MappedDeviceSchedule,
  MappedSensorAlert,
  LinkedRule,
  LinkedDeviceSensorTrigger,
  LinkedDeviceTimer,
  LinkedDeviceSchedule,
  LinkedSensorAlert
} from './org-rules.models';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { AssignRuleDialogComponent } from './assign-rule/assign-rule-dialog.component';
import { DeleteRuleDialogComponent } from './delete-rule/delete-rule-dialog.component';
import { EditAlertsDialogComponent } from './edit-alert/edit-alerts-dialog.component';
import { EditSchedulesDialogComponent } from './edit-schedule/edit-schedules-dialog.component';

@Component({
  selector: 'fuse-org-rules',
  templateUrl: './org-rules.component.html',
  styleUrls: ['./org-rules.component.scss']
})
export class OrgRulesComponent implements OnInit {
  ruleGroups: MappedRuleGroup[] = [];
  isReadOnly = false;
  panelOpenState = [false, false, false, false];
  dataSources: { [index: number]: RuleGroupDataSources } = {};

  triggerColumns = ['sensor', 'condition', 'device', 'controllers', 'actions'];
  selectedTrigger: MappedDeviceSensorTrigger = null;

  timerColumns = ['device', 'config', 'controllers', 'actions'];
  selectedTimer: MappedDeviceTimer = null;

  scheduleColumns = ['device', 'config', 'controllers', 'actions'];
  selectedSchedule: MappedDeviceSchedule = null;

  alertColumns = ['sensor', 'condition', 'controllers', 'actions'];
  selectedAlert: MappedSensorAlert = null;

  sensors: MappedSensor[] = [];
  devices: MappedDevice[] = [];

  constructor(private controllers: ControllerService, public dialog: MatDialog) { }

  ngOnInit() {
    setTimeout(() => {
      this.controllers.getContainers(true).subscribe(controllerList => {
        controllerList.forEach(controller => {
          controller.RuleGroups.forEach(rgrp => {
            let exist = this.ruleGroups.find(g => g.Name === rgrp.Name && g.ControllerSameConfig(controller));
            if (exist) {
              if (!exist.ControllerIds.includes(controller.Guid)) {
                exist.Controllers.push(controller);
              }
              if (!exist.AllRuleGroupIds.includes(rgrp.Id)) {
                exist.AdditionalIds.push(rgrp.Id);
              }
            } else {
              exist = new MappedRuleGroup(rgrp, controller);
              this.ruleGroups.push(exist);
            }
          });
        });

        // console.log('rule groups', this.ruleGroups);

        this.sensors = this.ruleGroups.reduce((all, rg) =>
          all.concat(rg.Controllers.reduce((allC, controller) =>
            allC.concat(controller.Modules.reduce((allM, mod) =>
              allM.concat(mod.Sensors.map(sensor => Object.assign({}, sensor, { Module: mod, Controller: controller })))
              , Array<MappedSensor>()))
            , Array<MappedSensor>()))
          , Array<MappedSensor>())
          .reduce((all, sens) => {
            if (!all.find(exist => exist.Guid === sens.Guid)) {
              all.push(sens);
            }

            return all;
          }, Array<MappedSensor>());

        this.devices = this.ruleGroups.reduce((all, rg) =>
          all.concat(rg.Controllers.reduce((allC, controller) =>
            allC.concat(controller.Modules.reduce((allM, mod) =>
              allM.concat(mod.Devices.map(dev => Object.assign({}, dev, { Module: mod, Controller: controller })))
              , Array<MappedDevice>()))
            , Array<MappedDevice>()))
          , Array<MappedDevice>())
          .reduce((all, dev) => {
            if (!all.find(exist => exist.Guid === dev.Guid)) {
              all.push(dev);
            }

            return all;
          }, Array<MappedDevice>());

        this.ruleGroups.forEach(rg => {
          const rgTriggers = rg.Controllers.reduce((all, c) => all.concat(c.SensorTriggers), new Array<DeviceSensorTriggerResponse>());
          const rgSchedules = rg.Controllers.reduce((all, c) => all.concat(c.Schedules), new Array<DeviceScheduleResponse>());
          const rgTimers = rg.Controllers.reduce((all, c) => all.concat(c.Timers), new Array<DeviceTimerResponse>());
          // console.log(`RuleGroup ${rg.Name} has controllers id's`, rg.ControllerIds);
          const rgSensors = this.sensors.filter(sensor => rg.ControllerIds.find(c => c === sensor.Controller.Guid));
          // const rgDevices = this.devices.filter(dev => rg.ControllerIds.find(c => c === dev.Controller.Guid));
          // console.log(`RuleGroup ${rg.Name} has sensors`, rgSensors);
          // console.log(`RuleGroup ${rg.Name} has devices`, rgDevices);
          rgTriggers.forEach(trigger => {
              const triggerRuleGroup = this.ruleGroups.find(existRg => existRg.AllRuleGroupIds.includes(trigger.RuleGroupId));
              if (!trigger.SensorId || !trigger.DeviceId) { return; }
              if (!triggerRuleGroup || triggerRuleGroup.Name !== rg.Name) { return; }

              const triggerSensor = this.sensors.find(rgSensor => rgSensor.Guid === trigger.SensorId);
              const triggerDevice = this.devices.find(rgDev => rgDev.Guid === trigger.DeviceId);
              const existTrigger = rg.FindSensorTrigger(triggerSensor, this.devices, trigger);
              if (existTrigger) {
                if (rg.ControllerIds.includes(triggerSensor.Controller.Guid) && !existTrigger.HasController(triggerSensor.Controller)) {
                  existTrigger.Controllers.push(triggerSensor.Controller);
                  existTrigger.Instances.push(new LinkedDeviceSensorTrigger(trigger, triggerSensor.Controller, rg));
                }
              } else {
                const newTrigger = new MappedDeviceSensorTrigger(trigger, triggerSensor, triggerDevice, rg);
                // console.log(`New sensor trigger rule`, newTrigger);
                rg.SensorTriggers.push(newTrigger);
              }
            });
          rgTimers.forEach(timer => {
              const timerRuleGroup = this.ruleGroups.find(existRg => existRg.AllRuleGroupIds.includes(timer.RuleGroupId));
              if (!timer.DeviceId) { return; }
              if (!timerRuleGroup || timerRuleGroup.Name !== rg.Name) { return; }

              const timerDevice = this.devices.find(rgDev => rgDev.Guid === timer.DeviceId);
              const existTimer = rg.FindTimer(this.devices, timer);
              if (existTimer) {
                if (rg.ControllerIds.includes(timerDevice.Controller.Guid) && !existTimer.HasController(timerDevice.Controller)) {
                  existTimer.Controllers.push(timerDevice.Controller);
                  existTimer.Instances.push(new LinkedDeviceTimer(timer, timerDevice.Controller, rg));
                }
              } else {
                const newTimer = new MappedDeviceTimer(timer, timerDevice, rg);
                // console.log(`New device timer rule`, newTimer);
                rg.Timers.push(newTimer);
              }
            });
          rgSchedules.forEach(schedule => {
              const scheduleRuleGroup = this.ruleGroups.find(existRg => existRg.AllRuleGroupIds.includes(schedule.RuleGroupId));
              if (!schedule.DeviceId) { return; }
              if (!scheduleRuleGroup || scheduleRuleGroup.Name !== rg.Name) { return; }

              const scheduleDevice = this.devices.find(rgDev => rgDev.Guid === schedule.DeviceId);
              const existSchedule = rg.FindSchedule(this.devices, schedule);
              if (existSchedule) {
                if (rg.ControllerIds.includes(scheduleDevice.Controller.Guid) && !existSchedule.HasController(scheduleDevice.Controller)) {
                  existSchedule.Controllers.push(scheduleDevice.Controller);
                  existSchedule.Instances.push(new LinkedDeviceSchedule(schedule, scheduleDevice.Controller, rg));
                }
              } else {
                const newSchedule = new MappedDeviceSchedule(schedule, scheduleDevice, rg);
                // console.log(`New device schedule rule`, newSchedule);
                rg.Schedules.push(newSchedule);
              }
            });
          rgSensors
            .reduce((all, sensor) => all.concat(
              sensor.Alerts.map(sens => ({ ...sens, SensorId: sensor.Guid }))
            ), Array<SensorAlertResponse>())
            .forEach(alert => {
              const alertRuleGroup = this.ruleGroups.find(existRg => existRg.AllRuleGroupIds.includes(alert.RuleGroupId));
              if (!alert.SensorId) { return; }
              if (alertRuleGroup.Name !== rg.Name) { return; }

              const alertSensor = rgSensors.find(rgSens => rgSens.Guid === alert.SensorId);
              const existAlert = rg.Alerts.find(exist => (exist.Sensor.Name === alertSensor.Name) && exist.SameRule(alert));
              if (existAlert) {
                if (rg.ControllerIds.includes(alertSensor.Controller.Guid) && !existAlert.HasController(alertSensor.Controller)) {
                  existAlert.Controllers.push(alertSensor.Controller);
                  existAlert.Instances.push(new LinkedSensorAlert(alert, alertSensor.Controller, rg));
                }
              } else {
                const newAlert = new MappedSensorAlert(alert, alertSensor, rg);
                rg.Alerts.push(newAlert);
              }
            });
        });

        this.ruleGroups.forEach(rg => {
          if (!this.dataSources[rg.InternalId]) {
            this.dataSources[rg.InternalId] = new RuleGroupDataSources();
            this.dataSources[rg.InternalId].SensorTriggers = new SensorTriggersDataSource(rg.SensorTriggers);
            this.dataSources[rg.InternalId].Timers = new TimersDataSource(rg.Timers);
            this.dataSources[rg.InternalId].Schedules = new SchedulesDataSource(rg.Schedules);
            this.dataSources[rg.InternalId].Alerts = new AlertsDataSource(rg.Alerts);
          } else {
            this.dataSources[rg.InternalId].SensorTriggers.update(rg.SensorTriggers);
            this.dataSources[rg.InternalId].Timers.update(rg.Timers);
            this.dataSources[rg.InternalId].Schedules.update(rg.Schedules);
            this.dataSources[rg.InternalId].Alerts.update(rg.Alerts);
          }
        });
      });
    });
  }

  dataSourceTriggers(ruleGroup: MappedRuleGroup): SensorTriggersDataSource {
    if (!(ruleGroup.InternalId in this.dataSources)) {
      return null;
    }
    return this.dataSources[ruleGroup.InternalId].SensorTriggers;
  }
  selectTrigger(trigger: MappedDeviceSensorTrigger) {
    this.selectedTrigger = trigger;
  }
  editTrigger(trigger: MappedDeviceSensorTrigger) {

  }
  deleteTrigger(trigger: MappedDeviceSensorTrigger) {
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { rule: new MappedDeviceSensorTrigger(trigger) }
    };

    const dialogRef = this.dialog.open(DeleteRuleDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: string[]) => {
      if (!result) {
        return;
      }

      trigger.Controllers = trigger.Controllers.filter(ruleController => !result.find(c => c === ruleController.Guid));
      if (!trigger.Controllers.length) {
        trigger.RuleGroup.SensorTriggers = trigger.RuleGroup.SensorTriggers.filter(exist => exist.Controllers.length);
        this.dataSourceTriggers(trigger.RuleGroup).update(trigger.RuleGroup.SensorTriggers);
      }
    });
  }
  assignTrigger(trigger: MappedDeviceSensorTrigger) {
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { rule: new MappedDeviceSensorTrigger(trigger), controllers: trigger.RuleGroup.Controllers }
    };

    const dialogRef = this.dialog.open(AssignRuleDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: MappedDeviceSensorTrigger) => {
      if (!result) {
        return;
      }

      console.log('Updated trigger', result);
      trigger.Controllers = trigger.RuleGroup.Controllers.filter(rgController => result.Controllers.find(c => c.Guid === rgController.Guid));
    });
  }

  dataSourceTimers(ruleGroup: MappedRuleGroup): TimersDataSource {
    if (!(ruleGroup.InternalId in this.dataSources)) {
      return null;
    }
    return this.dataSources[ruleGroup.InternalId].Timers;
  }
  selectTimer(timer: MappedDeviceTimer) {
    this.selectedTimer = timer;
  }
  editTimer(timer: MappedDeviceTimer) {

  }
  deleteTimer(timer: MappedDeviceTimer) {
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { rule: new MappedDeviceTimer(timer) }
    };

    const dialogRef = this.dialog.open(DeleteRuleDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: string[]) => {
      if (!result) {
        return;
      }

      timer.Controllers = timer.Controllers.filter(ruleController => !result.find(c => c === ruleController.Guid));
      if (!timer.Controllers.length) {
        timer.RuleGroup.Timers = timer.RuleGroup.Timers.filter(exist => exist.Controllers.length);
        this.dataSourceTimers(timer.RuleGroup).update(timer.RuleGroup.Timers);
      }
    });
  }
  assignTimer(timer: MappedDeviceTimer) {
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { rule: new MappedDeviceTimer(timer), controllers: timer.RuleGroup.Controllers }
    };

    const dialogRef = this.dialog.open(AssignRuleDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: MappedDeviceTimer) => {
      if (!result) {
        return;
      }

      console.log('Updated timer', result);
      timer.Controllers = timer.RuleGroup.Controllers.filter(rgController => result.Controllers.find(c => c.Guid === rgController.Guid));
    });
  }

  dataSourceSchedules(ruleGroup: MappedRuleGroup): SchedulesDataSource {
    if (!(ruleGroup.InternalId in this.dataSources)) {
      return null;
    }
    return this.dataSources[ruleGroup.InternalId].Schedules;
  }
  selectSchedule(schedule: MappedDeviceSchedule) {
    this.selectedSchedule = schedule;
  }
  editSchedule(schedule: MappedDeviceSchedule) {
    const scheduleDevices = [
      schedule.Device,
      ...this.devices.filter(dev => schedule.AdditionalDeviceIds.findIndex(addId => addId === dev.Guid) > -1)
    ];
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { rule: new MappedDeviceSchedule(schedule), controllers: schedule.RuleGroup.Controllers, devices: scheduleDevices }
    };

    const dialogRef = this.dialog.open(EditSchedulesDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: LinkedDeviceSchedule[]) => {
      if (!result) {
        return;
      }

      result.forEach(instance => {
        const original = schedule.Instances.find(exist => exist.Id === instance.Id);
        const updates = this.updatedFields<LinkedDeviceSchedule>(original, instance);
        console.log(`Updates on rule ID=${original.Id}`, updates);
        this.updateRuleProperties(updates, original, schedule);
      });
    });
  }
  deleteSchedule(schedule: MappedDeviceSchedule) {
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { rule: new MappedDeviceSchedule(schedule) }
    };

    const dialogRef = this.dialog.open(DeleteRuleDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: string[]) => {
      if (!result) {
        return;
      }

      schedule.Controllers = schedule.Controllers.filter(ruleController => !result.find(c => c === ruleController.Guid));
      if (!schedule.Controllers.length) {
        schedule.RuleGroup.Schedules = schedule.RuleGroup.Schedules.filter(exist => exist.Controllers.length);
        this.dataSourceSchedules(schedule.RuleGroup).update(schedule.RuleGroup.Schedules);
      }
    });
  }
  assignSchedule(schedule: MappedDeviceSchedule) {
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { rule: new MappedDeviceSchedule(schedule), controllers: schedule.RuleGroup.Controllers }
    };

    const dialogRef = this.dialog.open(AssignRuleDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: MappedDeviceSchedule) => {
      if (!result) {
        return;
      }

      console.log('Updated schedule', result);
      schedule.Controllers = schedule.RuleGroup.Controllers.filter(rgController => result.Controllers.find(c => c.Guid === rgController.Guid));
    });
  }

  dataSourceAlerts(ruleGroup: MappedRuleGroup): AlertsDataSource {
    if (!(ruleGroup.InternalId in this.dataSources)) {
      return null;
    }
    return this.dataSources[ruleGroup.InternalId].Alerts;
  }
  selectAlert(alert: MappedSensorAlert) {
    this.selectedAlert = alert;
  }
  editAlert(alert: MappedSensorAlert) {
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { rule: new MappedSensorAlert(alert), controllers: alert.RuleGroup.Controllers }
    };

    const dialogRef = this.dialog.open(EditAlertsDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: LinkedSensorAlert[]) => {
      if (!result) {
        return;
      }

      result.forEach(instance => {
        const original = alert.Instances.find(exist => exist.Id === instance.Id);
        const updates = this.updatedFields<LinkedSensorAlert>(original, instance);
        console.log(`Updates on rule ID=${original.Id}`, updates);
        this.updateRuleProperties(updates, original, alert);
      });
    });
  }
  deleteAlert(alert: MappedSensorAlert) {
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { rule: new MappedSensorAlert(alert) }
    };

    const dialogRef = this.dialog.open(DeleteRuleDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: string[]) => {
      if (!result) {
        return;
      }

      alert.Controllers = alert.Controllers.filter(ruleController => !result.find(c => c === ruleController.Guid));
      if (!alert.Controllers.length) {
        alert.RuleGroup.Alerts = alert.RuleGroup.Alerts.filter(exist => exist.Controllers.length);
        this.dataSourceAlerts(alert.RuleGroup).update(alert.RuleGroup.Alerts);
      }
    });
  }
  assignAlert(alert: MappedSensorAlert) {
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { rule: new MappedSensorAlert(alert), controllers: alert.RuleGroup.Controllers }
    };

    const dialogRef = this.dialog.open(AssignRuleDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: MappedSensorAlert) => {
      if (!result) {
        return;
      }

      console.log('Updated alert', result);
      alert.Controllers = alert.RuleGroup.Controllers.filter(rgController => result.Controllers.find(c => c.Guid === rgController.Guid));
    });
  }

  getControllers(source: MappedDeviceSensorTrigger | MappedDeviceTimer | MappedDeviceSchedule | MappedSensorAlert): string {
    const onControllers = source.Controllers
      .map(c => c.Name)
      .sort((a, b) => a.localeCompare(b));

    return onControllers.join(', ');
  }

  getDeviceNames(source: MappedDeviceSensorTrigger | MappedDeviceTimer | MappedDeviceSchedule): string {
    const onDevices: string[] = [source.DeviceId, ...source.AdditionalDeviceIds]
      .map(devId => this.devices.find(d => d.Guid === devId))
      .filter(dev => dev !== null && dev !== undefined)
      .map(dev => dev.Name)
      .sort((a, b) => a.localeCompare(b));

    return onDevices.join(', ');
  }

  private updatedFields<T>(original: T, updated: T): {changes: Partial<T>, count: number} {
    const result: {changes: Partial<T>, count: number} = {changes: {}, count: 0};
    for (const key in original) {
      if (original.hasOwnProperty(key)) {
        const origValue = original[key];
        const newValue = updated[key];

        if (Array.isArray(origValue)) {
          const arrEq = origValue.every((val, idx) => newValue[idx] === val);
          if (!arrEq) {
            result.changes[key] = newValue;
            result.count++;
          }

          continue;
        }

        if (origValue !== newValue) {
          result.changes[key] = newValue;
          result.count++;
        }
        if (key === 'Id') {
          result.changes[key] = original[key];
        }
      }
    }

    return result;
  }

  private updateRuleProperties(updates: { changes: Partial<LinkedRule>; count: number; }, original: LinkedRule, mapped: MappedRule) {
    if (updates.count > 0) {
      for (const key in updates.changes) {
        if (updates.changes.hasOwnProperty(key)) {
          const newValue = updates.changes[key];
          original[key] = newValue;
          mapped[key] = newValue;
        }
      }
    }
  }
}

class RuleGroupDataSources {
  SensorTriggers: SensorTriggersDataSource;
  Timers: TimersDataSource;
  Schedules: SchedulesDataSource;
  Alerts: AlertsDataSource;
}

class SensorTriggersDataSource implements DataSource<MappedDeviceSensorTrigger> {
  private data: BehaviorSubject<MappedDeviceSensorTrigger[]>;

  constructor(initialData?: MappedDeviceSensorTrigger[]) {
    this.data = new BehaviorSubject<MappedDeviceSensorTrigger[]>([]);
    this.update(initialData);
  }

  get Data(): Observable<MappedDeviceSensorTrigger[]> {
    return this.data.asObservable();
  }
  connect(): Observable<MappedDeviceSensorTrigger[]> {
    return this.data.asObservable();
  }

  update(newData?: MappedDeviceSensorTrigger[]): void {
    this.data.next(newData);
  }

  disconnect(): void {
    this.data.complete();
  }
}

class TimersDataSource implements DataSource<MappedDeviceTimer> {
  private data: BehaviorSubject<MappedDeviceTimer[]>;

  constructor(initialData?: MappedDeviceTimer[]) {
    this.data = new BehaviorSubject<MappedDeviceTimer[]>([]);
    this.update(initialData);
  }

  get Data(): Observable<MappedDeviceTimer[]> {
    return this.data.asObservable();
  }
  connect(): Observable<MappedDeviceTimer[]> {
    return this.data.asObservable();
  }

  update(newData?: MappedDeviceTimer[]): void {
    this.data.next(newData);
  }

  disconnect(): void {
    this.data.complete();
  }
}

class SchedulesDataSource implements DataSource<MappedDeviceSchedule> {
  private data: BehaviorSubject<MappedDeviceSchedule[]>;

  constructor(initialData?: MappedDeviceSchedule[]) {
    this.data = new BehaviorSubject<MappedDeviceSchedule[]>([]);
    this.update(initialData);
  }

  get Data(): Observable<MappedDeviceSchedule[]> {
    return this.data.asObservable();
  }
  connect(): Observable<MappedDeviceSchedule[]> {
    return this.data.asObservable();
  }

  update(newData?: MappedDeviceSchedule[]): void {
    this.data.next(newData);
  }

  disconnect(): void {
    this.data.complete();
  }
}

class AlertsDataSource implements DataSource<MappedSensorAlert> {
  private data: BehaviorSubject<MappedSensorAlert[]>;

  constructor(initialData?: MappedSensorAlert[]) {
    this.data = new BehaviorSubject<MappedSensorAlert[]>([]);
    this.update(initialData);
  }

  get Data(): Observable<MappedSensorAlert[]> {
    return this.data.asObservable();
  }
  connect(): Observable<MappedSensorAlert[]> {
    return this.data.asObservable();
  }

  update(newData?: MappedSensorAlert[]): void {
    this.data.next(newData);
  }

  disconnect(): void {
    this.data.complete();
  }
}

