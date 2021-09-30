import { DeviceTypes } from './devicetype';
import { InterfaceType } from './interface-type';

export class DeviceWithThrottle {
  Name: string;
  Guid: string;
  DeviceType: DeviceTypes;
  InterfaceType: InterfaceType;
  AllowsThrottle: boolean;
  AllowsFade: boolean;
  IsBACNet: boolean;
  Throttle?: number;
  BACNetValue: string;
  BACNetSuffix: string;

  get HasBACNetValue(): boolean {
    return this.InterfaceType === InterfaceType.Default && this.IsBACNet;
  }

  get HasPercentageSlider(): boolean {
    if (this.InterfaceType === InterfaceType.PercentageSlider) {
      return true;
    }


    return this.InterfaceType === InterfaceType.Default && this.AllowsThrottle;
  }
}
