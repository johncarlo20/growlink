import { DayNightOption } from './index';
import { DeviceBasedRuleResponse } from './devicesrule';

export class DeviceTimerResponse extends DeviceBasedRuleResponse {
    DayNightOption: DayNightOption;
    StartTime?: string;
    EndTime?: string;
    StartTimestamp: string;
    SyncTime?: string;
    Frequency: string;
    Duration: string;
  }
