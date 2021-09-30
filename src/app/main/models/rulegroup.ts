import { CropSteeringProgramResponse } from './crop-steering-program-response';
import {
  DeviceSensorTriggerResponse,
  SensorAlertResponse,
  DeviceTimerResponse,
  DeviceScheduleResponse,
  ManualTaskResponse,
} from './index';
import { RuleGroupResponse } from './rulegroupresponse';

export class RuleGroup extends RuleGroupResponse {
  constructor(rgr?: RuleGroupResponse | RuleGroup, controllerId?: string) {
    super();

    if (rgr) {
      this.Id = rgr.Id;
      this.ContainerId = controllerId;
      this.Name = rgr.Name;
      this.IsActive = rgr.IsActive;
      this.SensorTriggers = rgr instanceof RuleGroup ? [...rgr.SensorTriggers] : [];
      this.Timers = rgr instanceof RuleGroup ? [...rgr.Timers] : [];
      this.Schedules = rgr instanceof RuleGroup ? [...rgr.Schedules] : [];
      this.Alerts = rgr instanceof RuleGroup ? [...rgr.Alerts] : [];
      this.ManualTasks = rgr instanceof RuleGroup ? [...rgr.ManualTasks] : [];
      this.CropSteeringPrograms = rgr instanceof RuleGroup ? [...rgr.CropSteeringPrograms] : [];
    } else {
      this.Name = 'New Rule Group';
      this.ContainerId = controllerId;
      this.IsActive = false;
      this.SensorTriggers = [];
      this.Timers = [];
      this.Schedules = [];
      this.Alerts = [];
      this.ManualTasks = [];
      this.CropSteeringPrograms = []
    }
  }

  ContainerId: string;
  SensorTriggers: DeviceSensorTriggerResponse[];
  Timers: DeviceTimerResponse[];
  Schedules: DeviceScheduleResponse[];
  Alerts: SensorAlertResponse[];
  ManualTasks: ManualTaskResponse[];
  CropSteeringPrograms: CropSteeringProgramResponse[];
}
