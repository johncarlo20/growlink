export enum ParticleSensor {
  None = 0,
  AmbientTemperature,
  AmbientHumidity,
  AmbientCo2,
  SolutionTemperature,
  SolutionPh,
  SolutionTds,
  SolutionFloat,
  LightLevel,
  BatteryLevel,
  SoilMoisture,
  SoilSalinity,
  SoilTemperature,
  Switch1,
  Switch2,
  Switch3,
  VaporPressureDeficit,
  SoilMoisture1,
  SoilMoisture2,
  SoilMoisture3,
  SoilMoisture4,
  SoilMoisture5,
  SoilTemperature1,
  SoilTemperature2,
  SoilTemperature3,
  SoilTemperature4,
  SoilEc1,
  SoilEc2,
  SoilEc3,
  SoilEc4,
  Voltage,
  Amperage,
  Gpio1,
  Gpio2,
  Gpio3,
  Gpio4,
  Gpio5,
  Gpio6,
  Gpio7,
  Gpio8,
  DissolvedOxygen,
  FlowRate,
  OutsideTemperature,
  OutsideHumidity,
  OutsideVaporPressure,
  OutsideAtmosphericPressure,
  WindDirection,
  WindSpeed,
  PAR,
  Precipitation,
  AnalogInput1,
  AnalogInput2,
  AnalogInput3,
  AnalogInput4,
  AnalogInput5,
  AnalogInput6,
  AnalogInput7,
  AnalogInput8,
  BacnetInput1,
  CurrentLoopInput1,
  CurrentLoopInput2,
  CurrentLoopInput3,
  CurrentLoopInput4,
  BacnetInput2,
  BacnetInput3,
  BacnetInput4,
  AmbientTemperature2,
  SolutionPh2,
  CurrentLoopInput5,
  BacnetInput5,
  BacnetInput6,
  BacnetInput7,
  BacnetInput8,
  SoilMoistureSerial = 73,
  SoilTemperatureSerial = 74,
  SoilEcSerial = 75,
}

export class ParticleSensorResponse {
  Id: number;
  Name: string;
  Description: string;
  SortId: number;
  AllowCalibrateToValue: boolean;
  AllowManualAdjustment: boolean;
  AllowProportionalControl: boolean;
  ManualAdjustmentRange: number;
  ManualAdjustmentStepValue: number;
  IsBinary: boolean;
  IsEligibleForRules: boolean;
  IsTemperatureSensor: boolean;
  IsCurrentLoop: boolean;
  SupportsCalibration: boolean;
}

export namespace ParticleSensor {
  export function LowFullSensor(id: ParticleSensor) {
    return id === ParticleSensor.SolutionFloat;
  }

  export function OnOffSensor(id: ParticleSensor): boolean {
    switch (id) {
      case ParticleSensor.Switch1:
      case ParticleSensor.Switch2:
      case ParticleSensor.Switch3:
      case ParticleSensor.Gpio1:
      case ParticleSensor.Gpio2:
      case ParticleSensor.Gpio3:
      case ParticleSensor.Gpio4:
      case ParticleSensor.Gpio5:
      case ParticleSensor.Gpio6:
      case ParticleSensor.Gpio7:
      case ParticleSensor.Gpio8:
        return true;
    }

    return false;
  }
}
