import { DataPointMetric, UnitOfMeasure, ParticleSensor } from './index';

export class SensorStatistics {
    DateId: number;
    TimeId: number;
    IsDaytime: boolean;
    ControllerId: string;
    ControllerName: string;
    ModuleId: string;
    ModuleName: string;
    SensorId: string;
    SensorName: string;
    ParticleSensor: ParticleSensor;
    DataPointMetric: DataPointMetric;
    UnitOfMeasure: UnitOfMeasure;
    MinValue: number;
    MaxValue: number;
    AvgValue: number;
    DayMinValue: number;
    DayMaxValue: number;
    DayAvgValue: number;
    NightMinValue: number;
    NightMaxValue: number;
    NightAvgValue: number;
}
