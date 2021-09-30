export class CropSteeringProgramRequest {
  sensorId: string;
  ruleGroupId: string;
  name: string;
  lightsOnTime: string;
  irrigationEndTime: string;
  rampUpTarget: number;
  dryBackTarget: number;
  additionalDryBack?: number;
  maintenanceDryBack: number;
  onePercentShotSize: number;
  rampUpShotSize: number;
  rampUpShotInterval: number;
  isActive: boolean;
  devices: string[];
}
