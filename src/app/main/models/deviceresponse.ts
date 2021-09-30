import { DataPointMetric } from './datapointmetric';
import { DeviceTypes } from './devicetype';
import { InterfaceType } from './interface-type';
import { ParticleDevice } from './particledevice';
import { SelectItem } from './select-item';
import { UnitOfMeasure } from './unitofmeasure';

export class DeviceResponse {
    Guid: string;
    ModuleId: string;
    ParticleDevice: ParticleDevice;
    DeviceType: DeviceTypes;
    Name: string;
    DosingRatio: number;
    MaxGallonsPerHour: number;
    IsShared: boolean;
    UnitOfMeasure?: UnitOfMeasure;
    DataPointMetric?: DataPointMetric;
    BacnetValueSuffix: string;
    InterfaceType: InterfaceType;
    AvailableDeviceTypes?: number[];
    sourceSensorId?: string;
    sourceSensorUpdateFrequency?: string;
    edited: boolean;
    availTypes?: SelectItem[];
}

export interface DeviceAllowThrottle {
  Guid: string;
  Name: string;
  DeviceType: DeviceTypes;
  InterfaceType: InterfaceType;
  AllowsFade: boolean;
  AllowsThrottle: boolean;
  IsBACNet: boolean;
  BACNetSuffix: string;
}
