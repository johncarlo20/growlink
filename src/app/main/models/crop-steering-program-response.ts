import { RuleResponse } from './rule';

export class CropSteeringProgramResponse extends RuleResponse {
  SensorId: string;
  Name: string;
  LightsOnTime: string;
  IrrigationEndTime: string;
  RampUpTarget: number;
  DryBackTarget: number;
  AdditionalDryBack?: number;
  MaintenanceDryBack: number;
  OnePercentShotSize: number;
  RampUpShotSize: number;
  RampUpShotInterval: number;
  Devices: string[];
}
