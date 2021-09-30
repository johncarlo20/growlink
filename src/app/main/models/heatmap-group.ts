import { HeatmapSensor } from './heatmap-sensor';
import { HeatmapDevice } from './heatmap-device';
import { ParticleSensor } from './particlesensor';

export interface IHeatmapGroup {
  Id?: string;
  HeatmapId: string;
  Name: string;
  MinReading: number;
  MaxReading: number;
  ParticleSensor: ParticleSensor;
  Sensors?: HeatmapSensor[];
  Devices?: HeatmapDevice[];
}

export class HeatmapGroup implements IHeatmapGroup {
  Id: string;
  HeatmapId: string;
  Name: string;
  MinReading: number;
  MaxReading: number;
  ParticleSensor: ParticleSensor;
  Sensors: HeatmapSensor[] = [];
  Devices: HeatmapDevice[] = [];
  IsActive = true;

  constructor(config: Partial<IHeatmapGroup>) {
    this.Id = config.Id;
    this.HeatmapId = config.HeatmapId;
    this.Name = config.Name;
    this.MinReading = config.MinReading;
    this.MaxReading = config.MaxReading;
    this.ParticleSensor = config.ParticleSensor || ParticleSensor.None;

    if (config.Sensors) {
      config.Sensors.forEach(sens => this.Sensors.push(new HeatmapSensor(sens)));
    }
    if (config.Devices) {
      config.Devices.forEach(dev => this.Devices.push(new HeatmapDevice(dev)));
    }
  }

  get Range() {
    return this.MaxReading - this.MinReading;
  }
}
