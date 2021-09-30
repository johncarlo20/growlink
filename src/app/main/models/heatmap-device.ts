import { HeatmapGroup } from './heatmap-group';
import { environment } from '../../../environments/environment';
import { DeviceTypes } from './devicetype';

export interface IHeatmapDevice {
  Id?: string;
  HeatmapGroupId: string;
  DeviceId: string;
  DeviceType: DeviceTypes;
  LocationX: number;
  LocationY: number;
  Size: number;
  parent?: HeatmapGroup;
}

export class HeatmapDevice implements IHeatmapDevice {
  Id: string;
  HeatmapGroupId: string;
  DeviceId: string;
  DeviceType: DeviceTypes;
  LocationX: number;
  LocationY: number;
  Size = 32;

  parent?: HeatmapGroup;
  currentState?: boolean;
  autoManual?: boolean;
  throttle?: number;
  image: HTMLImageElement;

  constructor(config: Partial<IHeatmapDevice>) {
    this.Id = config.Id;
    this.HeatmapGroupId = config.HeatmapGroupId;
    this.DeviceId = config.DeviceId;
    this.DeviceType = config.DeviceType;
    this.LocationX = config.LocationX;
    this.LocationY = config.LocationY;
    this.LocationY = config.LocationY;
    this.Size = config.Size ? config.Size : 32;
    if (config.parent) {
      this.parent = config.parent;
    }

    this.currentState = null;
    this.autoManual = null;
    this.throttle = null;
  }

  public loadImage(loaded: () => void) {
    this.image = document.createElement('img') as HTMLImageElement;
    this.image.addEventListener('load', loaded);
    const url = DeviceTypes.getDeviceImage(this.DeviceType);
    this.image.setAttribute('src', url);
  }

  get width() {
    return this.Size;
  }
  get height() {
    return this.Size;
  }

  get xCenter() {
    return this.LocationX + this.width / 2.0;
  }
  get yCenter() {
    return this.LocationY + this.height / 2.0;
  }

  get stateCode(): 'offAuto' | 'onAuto' | 'offManual' | 'onManual' | 'unknown' {
    if (this.autoManual === null || this.currentState === null) {
      return 'unknown';
    }

    if (this.autoManual) {
      if (this.currentState) {
        return 'onManual';
      } else {
        return 'offManual';
      }
    } else {
      if (this.currentState) {
        return 'onAuto';
      } else {
        return 'offAuto';
      }
    }
  }
}
