import { DayNightOption, ComparisonType } from './index';
import { DeviceBasedRuleResponse } from './devicesrule';

export class DeviceSensorTriggerResponse extends DeviceBasedRuleResponse {
  DayNightOption: DayNightOption;
  SensorId: string;
  ParticleSensorId: number;
  ComparisonType: ComparisonType;
  Value: number;
  ResetThreshold: number;
  MinimumDuration: string;
  MinRunDuration: string;
  MaxRunDuration: string;
  MaxRunForceOff: boolean;
  StartTime: string;
  EndTime: string;
  IsOverride: boolean;
  IsProportionalControl: boolean;
  PropControlStartingThrottle?: number;
  PropControlRefreshRate?: string;
}
