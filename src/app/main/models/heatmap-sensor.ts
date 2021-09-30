import { HeatmapGroup } from './heatmap-group';

export interface IHeatmapSensor {
  Id?: string;
  HeatmapGroupId: string;
  SensorId: string;
  LocationX0: number;
  LocationX1: number;
  LocationY0: number;
  LocationY1: number;
  parent?: HeatmapGroup;
  suffix?: string;
}

export class HeatmapSensor implements IHeatmapSensor {
  Id: string;
  HeatmapGroupId: string;
  SensorId: string;
  LocationX0: number;
  LocationX1: number;
  LocationY0: number;
  LocationY1: number;

  parent?: HeatmapGroup;
  currentValue?: number;
  suffix?: string;

  constructor(config: Partial<IHeatmapSensor>) {
    this.Id = config.Id;
    this.HeatmapGroupId = config.HeatmapGroupId;
    this.SensorId = config.SensorId;
    this.LocationX0 = config.LocationX0;
    this.LocationY0 = config.LocationY0;
    this.LocationX1 = config.LocationX1;
    this.LocationY1 = config.LocationY1;
    if (config.parent) {
      this.parent = config.parent;
    }
    if (config.suffix) {
      this.suffix = config.suffix;
    }

    this.currentValue = null;
  }

  get width() {
    return this.LocationX1 - this.LocationX0;
  }
  get height() {
    return this.LocationY1 - this.LocationY0;
  }

  get xCenter() {
    return this.LocationX0 + this.width / 2.0;
  }
  get yCenter() {
    return this.LocationY0 + this.height / 2.0;
  }
}
