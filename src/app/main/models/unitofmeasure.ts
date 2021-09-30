export enum UnitOfMeasure {
  Celsius = 0,
  Fahrenheit = 1,
  pH = 2,
  PartsPerMillion = 3,
  Percentage = 4,
  HighLow = 5,
  EC = 6,
  Lux = 7,
  kPa = 8,
  Millibars = 9,
  Volts = 10,
  Amperes = 11,
  OnOff = 12,
  GallonsPerMinute = 13,
  Angle = 14,
  MetersPerSecond = 15,
  PPFD = 16,
  PPFD_NaturalDaylight6500K = 20,
  PPFD_HalogenLamp3000K = 21,
  PPFD_HighCriLed6500K = 22,
  PPFD_HighCriLed4000K = 23,
  PPFD_HighCriLed3000K = 24,
  PPFD_LowCriLed6500K = 25,
  PPFD_LowCriLed3500K = 26,
  PPFD_Hps2000K = 27,
  PPFD_Cmh3000K = 28,
  MillimetersPerHour = 17,
  Milliamps = 18,
  InchesOfWater = 19,
}

export namespace UnitOfMeasure {
  export function display(measure: UnitOfMeasure): string {
    switch (measure) {
      case UnitOfMeasure.Celsius:
        return 'Celsius';
      case UnitOfMeasure.Fahrenheit:
        return 'Fahrenheit';
      case UnitOfMeasure.pH:
        return 'pH';
      case UnitOfMeasure.PartsPerMillion:
        return 'PPM (Hanna)';
      case UnitOfMeasure.Percentage:
        return 'Percentage';
      case UnitOfMeasure.HighLow:
        return 'High/Low';
      case UnitOfMeasure.EC:
        return 'EC';
      case UnitOfMeasure.Lux:
        return 'Lux';
      case UnitOfMeasure.kPa:
        return 'kPa';
      case UnitOfMeasure.Millibars:
        return 'Millibars';
      case UnitOfMeasure.Volts:
        return 'Volts';
      case UnitOfMeasure.Amperes:
        return 'Amperes';
      case UnitOfMeasure.OnOff:
        return 'On/Off';
      case UnitOfMeasure.GallonsPerMinute:
        return 'Gallons/min';
      case UnitOfMeasure.Angle:
        return 'deg';
      case UnitOfMeasure.MetersPerSecond:
        return 'm/s';
      case UnitOfMeasure.PPFD:
        return 'PPFD';
      case UnitOfMeasure.PPFD_NaturalDaylight6500K:
        return 'PPFD (Natural Daylight)';
      case UnitOfMeasure.PPFD_HalogenLamp3000K:
        return 'PPFD (Halogen Lamp 3000K)';
      case UnitOfMeasure.PPFD_HighCriLed6500K:
        return 'PPFD (High CRI LED 6500K)';
      case UnitOfMeasure.PPFD_HighCriLed4000K:
        return 'PPFD (High CRI LED 4000K)';
      case UnitOfMeasure.PPFD_HighCriLed3000K:
        return 'PPFD (High CRI LED 3000K)';
      case UnitOfMeasure.PPFD_LowCriLed6500K:
        return 'PPFD (Low CRI LED 6500K)';
      case UnitOfMeasure.PPFD_LowCriLed3500K:
        return 'PPFD (Low CRI LED 3500K)';
      case UnitOfMeasure.PPFD_Hps2000K:
        return 'PPFD (HPS 2000K)';
      case UnitOfMeasure.PPFD_Cmh3000K:
        return 'PPFD (CMH 3000K)';
      case UnitOfMeasure.MillimetersPerHour:
        return 'mm/hr';
      case UnitOfMeasure.Milliamps:
        return 'mA';
      case UnitOfMeasure.InchesOfWater:
        return 'in';
      default:
        return '';
    }
  }
}
