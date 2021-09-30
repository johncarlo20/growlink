export enum DataPointMetric {
  Temperature = 0,
  Humidity = 1,
  Acidity = 2,
  CarbonDioxideLevel = 3,
  TotalDissolvedSolids = 4,
  FloatLevel = 5,
  LightLevel = 6,
  BatteryLevel = 7,
  VaporPressureDeficit = 8,
  WaterContent = 9,
  ElectricalConductivity = 10,
  Voltage = 11,
  ElectricCurrent = 12,
  SwitchState = 15,
  DissolvedOxygen = 13,
  FlowRate = 14,
  VaporPressure = 16,
  AtmosphericPressure = 17,
  WindDirection = 18,
  WindSpeed = 19,
  Par = 20,
  Precipitation = 21,
  None = 255,
}

export class DataPointMetricUtil {
  toString(metric: DataPointMetric): string {
    switch (metric) {
      case DataPointMetric.Temperature:
        return 'Temperature';
      case DataPointMetric.Humidity:
        return 'Humidity';
      case DataPointMetric.Acidity:
        return 'Acidity';
      case DataPointMetric.CarbonDioxideLevel:
        return 'Carbon Dioxide Level';
      case DataPointMetric.TotalDissolvedSolids:
        return 'Total Dissolved Solids';
      case DataPointMetric.FloatLevel:
        return 'Float Level';
      case DataPointMetric.LightLevel:
        return 'Light Level';
      case DataPointMetric.BatteryLevel:
        return 'Battery Level';
      default:
        return DataPointMetric[metric];
    }
  }
}
