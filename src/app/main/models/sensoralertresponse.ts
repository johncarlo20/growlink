import { DayNightOption, ComparisonType } from './index';
import { RuleResponse } from './rule';

export class SensorAlertResponse extends RuleResponse {
  SensorId: string;
  DayNightOption: DayNightOption;
  ComparisonType: ComparisonType;
  Threshold: number;
  MinimumDuration: string;
  StartTime: string;
  EndTime: string;
  EmailAddresses: string;
  SendPushNotifications: boolean;
}
