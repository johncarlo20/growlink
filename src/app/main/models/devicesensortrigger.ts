import { DayNightOption } from './daynightoption';
import { ComparisonType } from './comparisontype';
import { DeviceWithThrottle } from './devicewiththrottle';
import { DeviceSensorTriggerResponse } from './devicesensortriggerresponse';
import { DeviceBasedRule } from './devicesrule';
import { ParticleSensorResponse } from './particlesensor';
import { DeviceResponse } from './deviceresponse';
import { DosingRecipeResponse } from './dosingreciperesponse';
import { ParticleSensorsService } from '../services/particle-sensors.service';
import { SensorResponse } from './sensorresponse';

export class DeviceSensorTrigger extends DeviceBasedRule {
  DayNightOption: DayNightOption;
  SensorId: string;
  SensorName: string;
  SensorType: ParticleSensorResponse;
  ParticleSensorId: number;
  ComparisonType: ComparisonType;
  Value: number;
  ResetThreshold: number;
  MinimumDuration?: string;
  MinRunDuration?: string;
  MaxRunDuration?: string;
  MaxRunForceOff = false;
  StartTime?: string;
  EndTime?: string;
  IsOverride = false;
  IsProportionalControl = false;
  PropControlStartingThrottle?: number;
  PropControlRefreshRate?: string;

  Name: string;
  Condition: string;
  ReadingSuffix: string;
  TimeOfDay: string;

  public static GetSensorTrigger(
    particleSensorsService: ParticleSensorsService,
    sensorOptions: SensorResponse[],
    deviceOptions: DeviceResponse[],
    dosingRecipes: DosingRecipeResponse[],
    source: DeviceSensorTriggerResponse
  ): DeviceSensorTrigger {
    const trigger = new DeviceSensorTrigger();

    trigger.getRuleBasics(source);
    trigger.getDeviceRuleBasics(source, deviceOptions, dosingRecipes);
    trigger.DayNightOption = source.DayNightOption;
    trigger.SensorId = source.SensorId;
    trigger.ComparisonType = source.ComparisonType;
    trigger.Value = source.Value;
    trigger.ResetThreshold = source.ResetThreshold;
    trigger.MinimumDuration = source.MinimumDuration;
    trigger.MinRunDuration = source.MinRunDuration;
    trigger.MaxRunDuration = source.MaxRunDuration;
    trigger.MaxRunForceOff = source.MaxRunForceOff !== undefined ? source.MaxRunForceOff : false;
    trigger.StartTime = source.StartTime;
    trigger.EndTime = source.EndTime;
    trigger.IsOverride = source.IsOverride;
    trigger.IsProportionalControl = source.IsProportionalControl;
    trigger.PropControlStartingThrottle = source.IsProportionalControl
      ? source.PropControlStartingThrottle
      : null;
    trigger.PropControlRefreshRate = source.IsProportionalControl
      ? source.PropControlRefreshRate
      : null;
    if (source.IsProportionalControl) {
      trigger.PropControlStartingThrottle = trigger.PropControlStartingThrottle || 5;
      trigger.PropControlRefreshRate = trigger.PropControlRefreshRate || '00:00:15';
    }

    trigger.TimeOfDay = DayNightOption.toHumanReadable(trigger.DayNightOption);

    const sensor = sensorOptions.find(s => s.Guid === trigger.SensorId);
    if (sensor) {
      trigger.SensorName = sensor.Name;
      trigger.SensorType = particleSensorsService.FindParticleSensor(sensor.ParticleSensor);
      trigger.ReadingSuffix = sensor.ReadingSuffix || '';

      if (particleSensorsService.LowFullSensor(trigger.SensorType)) {
        trigger.Condition = trigger.Value === 0 ? 'is FULL' : 'is LOW';
      } else if (particleSensorsService.OnOffSensor(trigger.SensorType)) {
        trigger.Condition = trigger.Value === 0 ? 'is ON' : 'is OFF';
      } else {
        trigger.Condition = `${ComparisonType[trigger.ComparisonType]} ${trigger.Value}${
          trigger.ReadingSuffix
        }`;
      }
    }

    trigger.Name = `${trigger.SensorName} ${trigger.Condition}`;

    return trigger;
  }

  public getSensorTriggerResponse(
    selectedDeviceThrottles: DeviceWithThrottle[]
  ): DeviceSensorTriggerResponse {
    const tResponse = new DeviceSensorTriggerResponse();

    this.setRuleBasics(tResponse);
    this.setDeviceRuleBasics(tResponse);
    tResponse.DayNightOption = this.DayNightOption;
    tResponse.SensorId = this.SensorId;
    tResponse.ComparisonType = this.ComparisonType;
    tResponse.Value = this.Value;
    tResponse.ResetThreshold = this.ResetThreshold;
    tResponse.MinimumDuration = this.MinimumDuration !== '00:00:00' ? this.MinimumDuration : null;
    tResponse.MinRunDuration = this.MinRunDuration !== '00:00:00' ? this.MinRunDuration : null;
    tResponse.MaxRunDuration = this.MaxRunDuration !== '00:00:00' ? this.MaxRunDuration : null;
    tResponse.MaxRunForceOff = this.MaxRunForceOff;
    tResponse.StartTime = this.DayNightOption === DayNightOption.CustomTime ? this.StartTime : null;
    tResponse.EndTime = this.DayNightOption === DayNightOption.CustomTime ? this.EndTime : null;
    tResponse.IsOverride = this.IsOverride;
    tResponse.IsProportionalControl = this.IsProportionalControl;
    tResponse.PropControlStartingThrottle = this.IsProportionalControl
      ? this.PropControlStartingThrottle
      : null;
    tResponse.PropControlRefreshRate = this.IsProportionalControl
      ? this.PropControlRefreshRate
      : null;

    this.setDevicesAndThrottles(tResponse, selectedDeviceThrottles);

    return tResponse;
  }
}
