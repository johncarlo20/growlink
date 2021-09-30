import {
  Controller,
  SensorResponse,
  DeviceResponse,
  DeviceWithThrottle
} from '@models';

export interface RuleDialogOptions {
  deviceOptions: DeviceResponse[];
  sharedDeviceOptions: DeviceResponse[];
  sensorOptions: SensorResponse[];
  deviceThrottles: DeviceWithThrottle[];
  controller: Controller;
}
