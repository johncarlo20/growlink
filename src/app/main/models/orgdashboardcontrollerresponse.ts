import { OrgDashboardReading, OrgDashboardState } from './orgdashboardreading';

export class OrgDashboardControllerResponse {
  ControllerId: string;
  ControllerName: string;
  OrgDashboardReadings: OrgDashboardReading[];
}

export class OrgDashboardControllerDevicesResponse {
  ControllerId: string;
  ControllerName: string;
  OrgDashboardDeviceStates: OrgDashboardState[];
}
