import { DayOfWeek } from './index';
import { DeviceBasedRuleResponse } from './devicesrule';

export class DeviceScheduleResponse extends DeviceBasedRuleResponse {
    DaysOfWeek: DayOfWeek;
    StartTime: string;
    EndTime: string;
    ThrottleFadeIn: number;
    ThrottleFadeOut: number;
  }
