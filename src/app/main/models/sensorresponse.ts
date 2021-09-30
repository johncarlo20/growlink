import { ParticleSensor, UnitOfMeasure, DataPointMetric } from './index';
import { SensorAlertResponse } from './sensoralertresponse';

export class SensorResponse {
  Guid: string;
  ModuleId: string;
  Name: string;
  SerialNumber: string;
  ParticleSensor: ParticleSensor;
  CalibrationSlope?: number;
  CalibrationIntercept?: number;
  CalibrationValue?: number;
  CalibrationUnitOfMeasure?: UnitOfMeasure;
  CalibrationDataPointMetric?: DataPointMetric;
  DataPointMetric: DataPointMetric;
  MetricName: string;
  ReadingSuffix: string;
  IsEligibleForRules: boolean;
  MinRange: number;
  MaxRange: number;
  Alerts: SensorAlertResponse[];
  edited: boolean;
}
