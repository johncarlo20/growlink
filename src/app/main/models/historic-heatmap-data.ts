import { DeviceTypes } from './devicetype';
import * as moment from 'moment';

export class HistoricHeatmapSensorReading {
  DateTime: moment.Moment;
  Value: number;
}

export class HistoricHeatmapSensorData {
  SensorId: string;
  Suffix: string;
  SensorReadings: HistoricHeatmapSensorReading[];
}

export class HistoricHeatmapDeviceReading {
  DateTime: moment.Moment;
  Throttle: number;
  IsActive: boolean;
  IsManual: boolean;
}

export class HistoricHeatmapDeviceData {
  DeviceId: string;
  DeviceType: DeviceTypes;
  StateChanges: HistoricHeatmapDeviceReading[];
}

export class HistoricHeatmapData {
  Devices: HistoricHeatmapDeviceData[];
  Sensors: HistoricHeatmapSensorData[];
}
