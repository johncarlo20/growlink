export class ProductTypeResponse {
  Id: number;
  Name: string;
  Description: string;
  AllowsAggregation: boolean;
  AllowsManualThrottling: boolean;
  AllowsProportionalControl: boolean;
  AllowsRuleThrottling: boolean;
  IsLightingController: boolean;
  HasSensors: boolean;
  IsFixedDevice: boolean;
  IsIrrigationControllerWithEc5: boolean;
  IsNutrientModule: boolean;
  IsMultiDevice: boolean;
  IsSingleDevice: boolean;
  SupportsDayRangeSettings: boolean;
  SupportsLedSettings: boolean;
  SupportsOfflineAlerts: boolean;
  SupportsCurrentCalibration: boolean;
}
