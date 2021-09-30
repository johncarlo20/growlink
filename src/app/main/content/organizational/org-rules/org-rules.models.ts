import {
  RuleGroupResponse,
  Controller,
  SensorResponse,
  ModuleResponse,
  DeviceResponse,
  DeviceSensorTriggerResponse,
  DeviceTimerResponse,
  DeviceScheduleResponse,
  SensorAlertResponse,
  ParticleSensor,
  ComparisonType,
  DayOfWeek,
} from '@models';

import * as moment from 'moment';
import { TimeUtil } from '@util';

export interface MappedSensor extends SensorResponse {
  Module: ModuleResponse;
  Controller: Controller;
}
export interface MappedDevice extends DeviceResponse {
  Module: ModuleResponse;
  Controller: Controller;
}
export interface LinkedRule {
  Id: string;
  Controller: Controller;
  RuleGroup: MappedRuleGroup;
}
export interface MappedRule {
  Controllers: Controller[];
  RuleGroup: MappedRuleGroup;

  HasController(controller: Controller): boolean;
}

export class LinkedDeviceSensorTrigger extends DeviceSensorTriggerResponse implements LinkedRule {
  Controller: Controller;
  RuleGroup: MappedRuleGroup;

  constructor(src: DeviceSensorTriggerResponse | LinkedDeviceSensorTrigger, controller?: Controller, rg?: MappedRuleGroup) {
    super();
    Object.assign<LinkedDeviceSensorTrigger, DeviceSensorTriggerResponse>(this, src);
    this.AdditionalDeviceIds = [...src.AdditionalDeviceIds];
    this.AdditionalThrottles = [...src.AdditionalThrottles];
    if (src instanceof LinkedDeviceSensorTrigger) {
      return;
    }

    this.Controller = controller;
    this.RuleGroup = rg;
  }
}
export class MappedDeviceSensorTrigger extends DeviceSensorTriggerResponse implements MappedRule {
  Controllers: Controller[];
  Sensor: MappedSensor;
  Device: MappedDevice;
  RuleGroup: MappedRuleGroup;
  Instances: LinkedDeviceSensorTrigger[];

  constructor(src: DeviceSensorTriggerResponse | MappedDeviceSensorTrigger, sensor?: MappedSensor, device?: MappedDevice, rg?: MappedRuleGroup) {
    super();
    Object.assign<MappedDeviceSensorTrigger, DeviceSensorTriggerResponse>(this, src);
    if (src instanceof MappedDeviceSensorTrigger) {
      return;
    }

    this.Controllers = [sensor.Controller];
    this.Sensor = sensor;
    this.Device = device;
    this.RuleGroup = rg;
    this.Instances = [new LinkedDeviceSensorTrigger(src, device.Controller, rg)];
  }

  public HasController(controller: Controller): boolean {
    return this.Controllers.find(c => c.Guid === controller.Guid) !== undefined;
  }

  SameRule(rule: DeviceSensorTriggerResponse): boolean {
    return (this.ComparisonType === rule.ComparisonType) && (this.Value === rule.Value) && (this.ResetThreshold === rule.ResetThreshold);
  }

  get TriggerCondition(): string {
    // const particleSensor = this.particleSensorService.FindParticleSensor(this.Sensor.ParticleSensor);
    // if (this.particleSensorService.LowFullSensor(particleSensor)) {
    //   return this.Value === 0 ? 'is FULL' : 'is LOW';
    // }
    // if (this.particleSensorService.OnOffSensor(particleSensor)) {
    //   return this.Value === 0 ? 'is ON' : 'is OFF';
    // }

    // if (ParticleSensor.lowFullSensor(this.Sensor.ParticleSensor)) {
    //   return this.Value === 0 ? 'is FULL' : 'is LOW';
    // }
    // if (ParticleSensor.onOffSensor(this.Sensor.ParticleSensor)) {
    //   return this.Value === 0 ? 'is ON' : 'is OFF';
    // }

    return `${ComparisonType[this.ComparisonType]} ${this.Value}${this.Sensor.ReadingSuffix}, reset at ${this.ResetThreshold}${this.Sensor.ReadingSuffix}`;
  }
}

export class LinkedDeviceTimer extends DeviceTimerResponse implements LinkedRule {
  Controller: Controller;
  RuleGroup: MappedRuleGroup;

  constructor(src: DeviceTimerResponse | LinkedDeviceTimer, controller?: Controller, rg?: MappedRuleGroup) {
    super();
    Object.assign<LinkedDeviceTimer, DeviceTimerResponse>(this, src);
    this.AdditionalDeviceIds = [...src.AdditionalDeviceIds];
    this.AdditionalThrottles = [...src.AdditionalThrottles];
    if (src instanceof LinkedDeviceTimer) {
      return;
    }

    this.Controller = controller;
    this.RuleGroup = rg;
  }
}
export class MappedDeviceTimer extends DeviceTimerResponse implements MappedRule {
  Controllers: Controller[];
  Device: MappedDevice;
  RuleGroup: MappedRuleGroup;
  Instances: LinkedDeviceTimer[];

  constructor(src: DeviceTimerResponse | MappedDeviceTimer, device?: MappedDevice, rg?: MappedRuleGroup) {
    super();
    Object.assign<MappedDeviceTimer, DeviceTimerResponse>(this, src);
    if (src instanceof MappedDeviceTimer) {
      return;
    }

    this.Controllers = [device.Controller];
    this.Device = device;
    this.RuleGroup = rg;
    this.Instances = [new LinkedDeviceTimer(src, device.Controller, rg)];
  }

  public HasController(controller: Controller): boolean {
    return this.Controllers.find(c => c.Guid === controller.Guid) !== undefined;
  }

  SameRule(rule: DeviceTimerResponse): boolean {
    return (this.StartTimestamp === rule.StartTimestamp) && (this.Duration === rule.Duration) && (this.Frequency === rule.Frequency);
  }

  get TimerConfig(): string {
    const start = moment(new Date(Date.parse(`${this.StartTimestamp}Z`))).format('LT');
    const every = `every ${TimeUtil.getHumanReadableDuration(this.Frequency)}`;
    const duration = `for ${TimeUtil.getHumanReadableDuration(this.Duration)}`;

    return `${start} ${every} ${duration}`;
  }
}

export class LinkedDeviceSchedule extends DeviceScheduleResponse implements LinkedRule {
  Controller: Controller;
  RuleGroup: MappedRuleGroup;

  constructor(src: DeviceScheduleResponse | LinkedDeviceSchedule, controller?: Controller, rg?: MappedRuleGroup) {
    super();
    Object.assign<LinkedDeviceSchedule, DeviceScheduleResponse>(this, src);
    this.AdditionalDeviceIds = [...src.AdditionalDeviceIds];
    this.AdditionalThrottles = [...src.AdditionalThrottles];
    if (src instanceof LinkedDeviceSchedule) {
      return;
    }

    this.Controller = controller;
    this.RuleGroup = rg;
  }
}
export class MappedDeviceSchedule extends DeviceScheduleResponse implements MappedRule {
  Controllers: Controller[];
  Device: MappedDevice;
  RuleGroup: MappedRuleGroup;
  Instances: LinkedDeviceSchedule[];

  constructor(src: DeviceScheduleResponse | MappedDeviceSchedule, device?: MappedDevice, rg?: MappedRuleGroup) {
    super();
    Object.assign<MappedDeviceSchedule, DeviceScheduleResponse>(this, src);
    if (src instanceof MappedDeviceSchedule) {
      return;
    }

    this.Controllers = [device.Controller];
    this.Device = device;
    this.RuleGroup = rg;
    this.Instances = [new LinkedDeviceSchedule(src, device.Controller, rg)];
  }

  public HasController(controller: Controller): boolean {
    return this.Controllers.find(c => c.Guid === controller.Guid) !== undefined;
  }

  SameRule(rule: DeviceScheduleResponse): boolean {
    return (this.DaysOfWeek === rule.DaysOfWeek) && (this.StartTime === rule.StartTime) && (this.EndTime === rule.EndTime);
  }

  get ScheduleConfig(): string {
    const dow = DayOfWeek.getDaysOfWeekDisplay(this.DaysOfWeek);

    return `${this.StartTime} \u2192 ${this.EndTime} (${dow})`;
  }
}

export class LinkedSensorAlert extends SensorAlertResponse implements LinkedRule {
  Controller: Controller;
  RuleGroup: MappedRuleGroup;

  constructor(src: SensorAlertResponse | LinkedSensorAlert, controller?: Controller, rg?: MappedRuleGroup) {
    super();
    Object.assign<LinkedSensorAlert, SensorAlertResponse>(this, src);
    if (src instanceof LinkedSensorAlert) {
      return;
    }

    this.Controller = controller;
    this.RuleGroup = rg;
  }
}
export class MappedSensorAlert extends SensorAlertResponse implements MappedRule {
  Controllers: Controller[];
  Sensor: MappedSensor;
  RuleGroup: MappedRuleGroup;
  Instances: LinkedSensorAlert[];

  constructor(src: SensorAlertResponse | MappedSensorAlert, sensor?: MappedSensor, rg?: MappedRuleGroup) {
    super();
    Object.assign<MappedSensorAlert, SensorAlertResponse>(this, src);
    if (src instanceof MappedSensorAlert) {
      return;
    }

    this.Controllers = [sensor.Controller];
    this.Sensor = sensor;
    this.RuleGroup = rg;
    this.Instances = [new LinkedSensorAlert(src, sensor.Controller, rg)];
  }

  public HasController(controller: Controller): boolean {
    return this.Controllers.find(c => c.Guid === controller.Guid) !== undefined;
  }

  SameRule(rule: SensorAlertResponse): boolean {
    return (this.ComparisonType === rule.ComparisonType) && (this.Threshold === rule.Threshold);
  }

  get AlertCondition(): string {
    // if (ParticleSensor.lowFullSensor(this.Sensor.ParticleSensor)) {
    //   return this.Threshold === 0 ? 'is FULL' : 'is LOW';
    // }
    // if (ParticleSensor.onOffSensor(this.Sensor.ParticleSensor)) {
    //   return this.Threshold === 0 ? 'is ON' : 'is OFF';
    // }

    return `${ComparisonType[this.ComparisonType]} ${this.Threshold}${this.Sensor.ReadingSuffix}`;
  }
}

type DeviceLinkedRuleResponses = DeviceSensorTriggerResponse | DeviceTimerResponse | DeviceScheduleResponse;
type DeviceLinkedMappedRule = MappedDeviceSensorTrigger | MappedDeviceTimer | MappedDeviceSchedule;

export class MappedRuleGroup extends RuleGroupResponse {
  static nextId = 1;

  InternalId: number;
  AdditionalIds: string[];
  Controllers: Controller[];
  SensorTriggers: MappedDeviceSensorTrigger[];
  Timers: MappedDeviceTimer[];
  Schedules: MappedDeviceSchedule[];
  Alerts: MappedSensorAlert[];

  constructor(src: RuleGroupResponse, controller: Controller) {
    super();
    this.InternalId = MappedRuleGroup.nextId++;
    this.Id = src.Id;
    this.Name = src.Name;
    this.IsActive = false;
    this.Controllers = [controller];
    this.SensorTriggers = [];
    this.Timers = [];
    this.Schedules = [];
    this.Alerts = [];
    this.AdditionalIds = [];
  }

  public get ControllerNames(): string[] {
    return this.Controllers.map(c => c.Name).sort();
  }

  public get ControllerIds(): string[] {
    return this.Controllers.map(c => c.Guid);
  }

  public get AllRuleGroupIds(): string[] {
    return [this.Id, ...this.AdditionalIds];
  }

  public get HasRules(): boolean {
    return (this.SensorTriggers.length > 0) || (this.Timers.length > 0) || (this.Schedules.length > 0) || (this.Alerts.length > 0);
  }

  public ControllerSameConfig(otherController: Controller): boolean {
    // console.log(`Checking controller ${otherController.Name}`);

    const baseController = this.Controllers[0];
    if (baseController.Modules.length !== otherController.Modules.length) {
      // console.log('Not the same module count');
      return false;
    }

    let result = true;
    otherController.Modules.sort((a, b) => a.ProductType - b.ProductType);
    baseController.Modules
      .sort((a, b) => a.ProductType - b.ProductType)
      .forEach((baseModule, idx) => {
        if (!result) { return; }

        const otherModule = otherController.Modules[idx];
        if (baseModule.ProductType !== otherModule.ProductType) {
          // console.log('Not the same modules');
          result = false;
          return;
        }

        if (baseModule.Sensors.length !== otherModule.Sensors.length) {
          // console.log('Not the same sensor count');
          result = false;
          return;
        }
        if (baseModule.Devices.length !== otherModule.Devices.length) {
          // console.log('Not the same device count');
          result = false;
          return;
        }

        otherModule.Sensors.sort((a, b) => a.ParticleSensor - b.ParticleSensor);
        baseModule.Sensors
          .sort((a, b) => a.ParticleSensor - b.ParticleSensor)
          .forEach((baseSensor, sensorIdx) => {
            if (!result) { return; }

            const otherSensor = otherModule.Sensors[sensorIdx];
            if (baseSensor.Name !== otherSensor.Name) {
              // console.log('Not the same sensor name');
              result = false;
              return;
            }
          });

        otherModule.Devices.sort((a, b) => a.DeviceType - b.DeviceType);
        baseModule.Devices
          .sort((a, b) => a.DeviceType - b.DeviceType)
          .forEach((baseDevice, deviceIdx) => {
            if (!result) { return; }

            const otherDevice = otherModule.Devices[deviceIdx];
            if (baseDevice.Name !== otherDevice.Name) {
              // console.log('Not the same device name');
              result = false;
              return;
            }
          });
      });

    return result;
  }

  private filterByAdditionalDevices<TSrc extends DeviceLinkedRuleResponses, TExist extends DeviceLinkedMappedRule>(
    rgDevices: MappedDevice[],
    src: TSrc,
    exist: TExist
  ): TExist {
    const additionalDevices = src.AdditionalDeviceIds
      .sort((a, b) => a.localeCompare(b))
      .map(addId => rgDevices.find(rgDev => rgDev.Guid === addId))
      .filter(addDev => addDev !== null && addDev !== undefined);
    const additionalExistDevices = exist.AdditionalDeviceIds
      .sort((a, b) => a.localeCompare(b))
      .map(addId => rgDevices.find(rgDev => rgDev.Guid === addId))
      .filter(addDev => addDev !== null && addDev !== undefined);

    if (additionalDevices.length !== additionalExistDevices.length) {
      return null;
    }
    for (let i = 0; i < additionalDevices.length; i++) {
      const addDevice = additionalDevices[i];
      const addExistDevice = additionalExistDevices[i];
      if (addDevice.Name !== addExistDevice.Name) {
        return null;
      }
    }

    return exist;
  }

  public FindSensorTrigger(triggerSensor: MappedSensor, rgDevices: MappedDevice[], trigger: DeviceSensorTriggerResponse): MappedDeviceSensorTrigger {
    const triggerDevice = rgDevices.find(rgDev => rgDev.Guid === trigger.DeviceId);

    const matches = this.SensorTriggers
      .filter(existTrigger => (existTrigger.Sensor.Name === triggerSensor.Name)
        && (existTrigger.Device.Name === triggerDevice.Name)
        && existTrigger.SameRule(trigger))
      .map(existTrigger => this.filterByAdditionalDevices<DeviceSensorTriggerResponse, MappedDeviceSensorTrigger>(rgDevices, trigger, existTrigger))
      .filter(match => match !== null);

    return matches.length ? matches.pop() : null;
  }

  public FindTimer(rgDevices: MappedDevice[], timer: DeviceTimerResponse): MappedDeviceTimer {
    const timerDevice = rgDevices.find(rgDev => rgDev.Guid === timer.DeviceId);

    const matches = this.Timers
      .filter(existTimer => (existTimer.Device.Name === timerDevice.Name) && existTimer.SameRule(timer))
      .map(existTimer => this.filterByAdditionalDevices<DeviceTimerResponse, MappedDeviceTimer>(rgDevices, timer, existTimer))
      .filter(match => match !== null);

    return matches.length ? matches.pop() : null;
  }

  public FindSchedule(rgDevices: MappedDevice[], schedule: DeviceScheduleResponse): MappedDeviceSchedule {
    const scheduleDevice = rgDevices.find(rgDev => rgDev.Guid === schedule.DeviceId);

    const matches = this.Schedules
      .filter(existSchedule => (existSchedule.Device.Name === scheduleDevice.Name) && existSchedule.SameRule(schedule))
      .map(existSchedule => this.filterByAdditionalDevices<DeviceScheduleResponse, MappedDeviceSchedule>(rgDevices, schedule, existSchedule))
      .filter(match => match !== null);

    return matches.length ? matches.pop() : null;
  }
}
