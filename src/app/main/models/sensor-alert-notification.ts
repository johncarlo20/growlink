import { NotificationBase } from './notification-base';
import { NotificationResponse } from './notification-response';
import { ParticleSensor } from './particlesensor';
import { ComparisonType } from './comparisontype';
import { UnitOfMeasure } from './unitofmeasure';
import { ControllerResponse } from './controllerresponse';

export interface ISensorAlertNotificationData {
  Sensor: {
    Id: string;
    Name: string;
    ParticleSensor: ParticleSensor;
    ControllerId: string;
  };
  SensorAlert: {
    Id: string;
    ComparisonType: ComparisonType;
    Threshold: number;
    FormattedThreshold: string;
  };
  DataPoint: {
    UnitOfMeasure: UnitOfMeasure;
    Value: number;
    FormattedValue: string;
  };
}

export class SensorAlertNotification extends NotificationBase {
  constructor(prefer24: boolean, src: NotificationResponse) {
    super(prefer24, src);

    this.Data = src.Data;
  }

  Data: ISensorAlertNotificationData | string;
  _controller: ControllerResponse = null;

  get Details() {
    if (typeof this.Data === 'string') {
      return `ERROR: ${this.Data}`;
    }

    const alert = this.Data.SensorAlert;
    const sensor = this.Data.Sensor;
    const dp = this.Data.DataPoint;

    if (ParticleSensor.OnOffSensor(sensor.ParticleSensor) || ParticleSensor.LowFullSensor(sensor.ParticleSensor)) {
      return `${sensor.Name} read ${dp.FormattedValue}`;
    }

    const comparison =
      alert.ComparisonType === ComparisonType.Above ? 'reached above' : 'reached below';
    const result = `${sensor.Name}(${dp.FormattedValue}) ${comparison} ${alert.FormattedThreshold}`;

    if (this.DeactivateTimestamp) {
      return `${result} but has returned to configured normal range`;
    }

    return result;
  }

  get Controller() {
    return this._controller;
  }
  set Controller(value: ControllerResponse) {
    this._controller = value;
    this.SetControllerTimestamps();
  }
}
