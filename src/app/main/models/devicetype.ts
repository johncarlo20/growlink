export enum DeviceTypes {
  None = 0,
  ReservoirChiller,
  ReservoirPump,
  Light,
  Fan,
  Heater,
  AirConditioner,
  Humidifier,
  Dehumidifier,
  Co2Burner,
  Co2Regulator,
  ExhaustFan,
  Irrigation,
  DosingPump,
  ReservoirFill,
  ReservoirDrain,
  NotInUse,
  LightAnalog,
  LightPwm,
  DosingPumpInline,
  MotorVents,
  ThermalScreen,
  ShadingScreen,
  PadPump,
  Valve,
  ExclusiveValve,
  LightAnalogHps,
  LightAnalogCmh,
  LightAnalogLed,
}

export namespace DeviceTypes {
  export function getDeviceImage(deviceType: DeviceTypes): string {
    const imageUrl = 'assets/images/';

    switch (deviceType) {
      case DeviceTypes.AirConditioner:
        return `${imageUrl}ac.png`;
      case DeviceTypes.Co2Burner:
        return `${imageUrl}burner.png`;
      case DeviceTypes.Co2Regulator:
        return `${imageUrl}regulator.png`;
      case DeviceTypes.DosingPump:
      case DeviceTypes.DosingPumpInline:
        return `${imageUrl}dosingpump.png`;
      case DeviceTypes.Dehumidifier:
      case DeviceTypes.ExhaustFan:
      case DeviceTypes.Fan:
        return `${imageUrl}fan.png`;
      case DeviceTypes.Heater:
        return `${imageUrl}heater.png`;
      case DeviceTypes.Humidifier:
        return `${imageUrl}humidifier.png`;
      case DeviceTypes.Irrigation:
        return `${imageUrl}irrigation.png`;
      case DeviceTypes.Light:
      case DeviceTypes.LightAnalog:
      case DeviceTypes.LightAnalogHps:
      case DeviceTypes.LightAnalogCmh:
      case DeviceTypes.LightAnalogLed:
      case DeviceTypes.LightPwm:
        return `${imageUrl}light.png`;
      case DeviceTypes.ReservoirChiller:
        return `${imageUrl}outlet.png`;
      case DeviceTypes.ReservoirDrain:
        return `${imageUrl}drain.png`;
      case DeviceTypes.ReservoirFill:
        return `${imageUrl}fill.png`;
      case DeviceTypes.ReservoirPump:
        return `${imageUrl}pump.png`;
      case DeviceTypes.MotorVents:
        return `${imageUrl}electric-motor.png`;
      case DeviceTypes.ThermalScreen:
      case DeviceTypes.ShadingScreen:
        return `${imageUrl}dry.png`;
      case DeviceTypes.PadPump:
      case DeviceTypes.Valve:
      case DeviceTypes.ExclusiveValve:
        return `${imageUrl}valve.png`;
      default:
        return `${imageUrl}outlet.png`;
    }
  }
}
