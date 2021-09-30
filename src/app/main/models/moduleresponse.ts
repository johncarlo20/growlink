import { SensorResponse, DeviceResponse, GrowMedium, SoilECType, MotorControlResponse, SelectItem } from './index';

export class ModuleResponse {
    Guid: string;
    ProductType: number;
    Name: string;
    SerialNumber: string;
    GrowMedium: GrowMedium;
    AggregateModuleId: string;
    ModuleGroupId: string;
    IsAggregate: boolean;
    IsHidden: boolean;
    Sensors: SensorResponse[];
    Devices: DeviceResponse[];
    MotorControl?: MotorControlResponse;
    EnableOfflineAlerts: boolean;
    SoilECType: SoilECType;
    AvailableDeviceTypes?: number[];
    GroupName: string;
    edited: boolean;
    availTypes?: SelectItem[];
}
