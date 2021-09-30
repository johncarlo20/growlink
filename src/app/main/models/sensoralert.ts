import { ParticleSensorsService } from '@services';
import { DayNightOption } from './daynightoption';
import { ComparisonType } from './comparisontype';
import { SensorAlertResponse } from './sensoralertresponse';
import { SensorResponse } from './sensorresponse';
import { ParticleSensorResponse } from './particlesensor';
import { Rule } from './rule';

export class SensorAlert extends Rule {
  SensorId: string;
  SensorName: string;
  SensorType: ParticleSensorResponse;
  DayNightOption: DayNightOption;
  ComparisonType: ComparisonType;
  Threshold: number;
  MinimumDuration = `00:00:00`;
  StartTime?: string;
  EndTime?: string;
  EmailAddresses: string[] = [];
  SendPushNotifications = false;

  Name: string;
  Condition: string;
  ReadingSuffix: string;
  TimeOfDay: string;

  public static GetAlert(
    particleSensorsService: ParticleSensorsService,
    sensorOptions: SensorResponse[],
    source: SensorAlertResponse
  ): SensorAlert {
    const alert = new SensorAlert();

    alert.getRuleBasics(source);
    alert.DayNightOption = source.DayNightOption;
    alert.SendPushNotifications = source.SendPushNotifications;
    alert.Threshold = source.Threshold;
    alert.MinimumDuration = source.MinimumDuration;
    alert.ComparisonType = source.ComparisonType;
    alert.SensorId = source.SensorId;
    alert.EmailAddresses = source.EmailAddresses.split(',');
    alert.StartTime = source.StartTime;
    alert.EndTime = source.EndTime;

    const sensor = sensorOptions.find(s => s.Guid === alert.SensorId);
    if (sensor) {
      alert.SensorName = sensor.Name;
      alert.SensorType = particleSensorsService.FindParticleSensor(sensor.ParticleSensor);
      alert.ReadingSuffix = sensor.ReadingSuffix || '';

      if (particleSensorsService.LowFullSensor(alert.SensorType)) {
        alert.Condition = alert.Threshold === 0 ? 'is FULL' : 'is LOW';
      } else if (particleSensorsService.OnOffSensor(alert.SensorType)) {
        alert.Condition = alert.Threshold === 0 ? 'is ON' : 'is OFF';
      } else {
        alert.Condition = `${ComparisonType[alert.ComparisonType]} ${alert.Threshold}${
          alert.ReadingSuffix
        }`;
      }
    }

    alert.TimeOfDay = DayNightOption.toHumanReadable(alert.DayNightOption);
    alert.Name = `${alert.SensorName} ${alert.Condition}`;

    return alert;
  }

  getAlertResponse(): SensorAlertResponse {
    const tResponse = new SensorAlertResponse();

    this.setRuleBasics(tResponse);
    tResponse.DayNightOption = this.DayNightOption;
    tResponse.SendPushNotifications = this.SendPushNotifications;
    tResponse.Threshold = this.Threshold;
    tResponse.MinimumDuration = this.MinimumDuration !== '00:00:00' ? this.MinimumDuration : null;
    tResponse.ComparisonType = this.ComparisonType;
    tResponse.SensorId = this.SensorId;
    tResponse.EmailAddresses = this.EmailAddresses.join(',');
    tResponse.StartTime = this.DayNightOption === DayNightOption.CustomTime ? this.StartTime : null;
    tResponse.EndTime = this.DayNightOption === DayNightOption.CustomTime ? this.EndTime : null;

    return tResponse;
  }
}
