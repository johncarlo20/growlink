import { CropSteeringProgramResponse } from './crop-steering-program-response';
import { ParticleSensorResponse } from './particlesensor';
import { Rule } from './rule';
import { DeviceResponse } from './deviceresponse';
import { ParticleSensorsService } from '../services/particle-sensors.service';
import { SensorResponse } from './sensorresponse';
import { CropSteeringProgramRequest } from './crop-steering-program-request';

export class CropSteeringProgram extends Rule {
  SensorId: string;
  SensorName: string;
  SensorType: ParticleSensorResponse;
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
  ReadingSuffix: string;
  DeviceList: string[] = [];
  DeviceNames: string;

  public static GetProgram(
    particleSensorsService: ParticleSensorsService,
    sensorOptions: SensorResponse[],
    deviceOptions: DeviceResponse[],
    source: CropSteeringProgramResponse
  ): CropSteeringProgram {
    const program = new CropSteeringProgram();

    program.getRuleBasics(source);
    program.SensorId = source.SensorId;
    program.Name = source.Name;
    program.LightsOnTime = source.LightsOnTime;
    program.IrrigationEndTime = source.IrrigationEndTime;
    program.RampUpTarget = source.RampUpTarget;
    program.DryBackTarget = source.DryBackTarget;
    program.AdditionalDryBack = source.AdditionalDryBack;
    program.MaintenanceDryBack = source.MaintenanceDryBack;
    program.OnePercentShotSize = source.OnePercentShotSize;
    program.RampUpShotSize = source.RampUpShotSize;
    program.RampUpShotInterval = source.RampUpShotInterval;
    program.Devices = [...source.Devices];

    if (deviceOptions.length) {
      program.DeviceList = source.Devices.map(devId => deviceOptions.find(dev => dev.Guid === devId))
        .filter(dev => !!dev)
        .map(dev => dev.Name);
    }

    program.DeviceList.sort((a, b) => a.localeCompare(b));
    program.DeviceNames = program.DeviceList.join(', ');
    const sensor = sensorOptions.find(s => s.Guid === program.SensorId);
    if (sensor) {
      program.SensorName = sensor.Name;
      program.SensorType = particleSensorsService.FindParticleSensor(sensor.ParticleSensor);
      program.ReadingSuffix = sensor.ReadingSuffix || '';
    }

    return program;
  }

  getProgramResponse(): CropSteeringProgramResponse {
    const tResponse = new CropSteeringProgramResponse();

    this.setRuleBasics(tResponse);
    tResponse.SensorId = this.SensorId;
    tResponse.Name = this.Name;
    tResponse.LightsOnTime = this.LightsOnTime;
    tResponse.IrrigationEndTime = this.IrrigationEndTime;
    tResponse.RampUpTarget = this.RampUpTarget;
    tResponse.DryBackTarget = this.DryBackTarget;
    tResponse.AdditionalDryBack = this.AdditionalDryBack ? this.AdditionalDryBack : null;
    tResponse.MaintenanceDryBack = this.MaintenanceDryBack;
    tResponse.OnePercentShotSize = this.OnePercentShotSize;
    tResponse.RampUpShotSize = this.RampUpShotSize;
    tResponse.RampUpShotInterval = this.RampUpShotInterval;
    tResponse.Devices = this.Devices ? [...this.Devices] : [];

    return tResponse;

  }

  getProgramRequest(): CropSteeringProgramRequest {
    const tRequest = new CropSteeringProgramRequest();

    tRequest.ruleGroupId = this.RuleGroupId;
    tRequest.isActive = this.IsActive;
    tRequest.sensorId = this.SensorId;
    tRequest.name = this.Name;
    tRequest.lightsOnTime = this.LightsOnTime;
    tRequest.irrigationEndTime = this.IrrigationEndTime;
    tRequest.rampUpTarget = this.RampUpTarget;
    tRequest.dryBackTarget = this.DryBackTarget;
    tRequest.additionalDryBack = this.AdditionalDryBack ? this.AdditionalDryBack : null;
    tRequest.maintenanceDryBack = this.MaintenanceDryBack;
    tRequest.onePercentShotSize = this.OnePercentShotSize;
    tRequest.rampUpShotSize = this.RampUpShotSize;
    tRequest.rampUpShotInterval = this.RampUpShotInterval;
    tRequest.devices = this.Devices ? [...this.Devices] : [];

    return tRequest;
  }
}
