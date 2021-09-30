import { ParticleSensor } from './particlesensor';
import { ParticleDevice } from './particledevice';

export class OrgDashboardReading {
  SortId = 1;
  SensorId: string;
  SensorName: string;
  ParticleSensor: ParticleSensor;
  Value: number;
  Suffix: string;
  Timestamp: string;
}

export class OrgDashboardState {
  SortId = 1;
  DeviceId: string;
  DeviceName: string;
  ParticleDevice: ParticleDevice;
  Throttle: number;
  IsManual: boolean;
  State: boolean;
}
