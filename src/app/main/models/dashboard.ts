import { BehaviorSubject, Observable, of } from 'rxjs';
import { DashboardItem, DashboardItemResponse, DashboardItemRequest } from './dashboarditem';
import { ProductTypeResponse } from './producttyperesponse';
import { ParticleSensorResponse } from './particlesensor';
import { DeviceTypes } from './devicetype';
import { InterfaceType } from './interface-type';
import { ParticleDevice } from './particledevice';
import { SensorAlert } from './sensoralert';
import { ComparisonType } from './comparisontype';
import { DayNightOption } from './daynightoption';
import { Controller } from './controller';
import * as moment from 'moment';
import 'moment-timezone';

export type DashboardType = 'Controller' | 'Organization';

export class Dashboard {
  Id: string;
  OrganizationId?: string;
  ContainerId?: string;
  Name: string;
  ChartDuration: number;
  Items: DashboardItem[] = [];

  constructor(src?: DashboardResponse | Dashboard) {
    if (src) {
      this.Id = src.Id;
      this.OrganizationId = src.OrganizationId;
      this.ContainerId = src.ContainerId;
      this.Name = src.Name;
      this.ChartDuration = src.ChartDuration;
      src.Items.forEach((item: DashboardItem | DashboardItemResponse) => {
        this.Items.push(new DashboardItem(item));
      });
    }
  }

  public get AsRequest(): DashboardRequest {
    return {
      Id: this.Id,
      ContainerId: this.ContainerId,
      OrganizationId: this.OrganizationId,
      Name: this.Name,
      ChartDuration: this.ChartDuration,
    };
  }

  public get AsFullRequest(): DashboardFullRequest {
    return {
      Id: this.Id,
      ContainerId: this.ContainerId,
      OrganizationId: this.OrganizationId,
      Name: this.Name,
      ChartDuration: this.ChartDuration,
      Items: this.Items.map((item) => item.AsRequest),
    };
  }

  public get DashboardType(): DashboardType {
    return this.ContainerId ? 'Controller' : 'Organization';
  }
}

export class DashboardResponse {
  Id: string;
  OrganizationId?: string;
  ContainerId?: string;
  Name: string;
  ChartDuration: number;
  Items: DashboardItemResponse[] = [];

  constructor(src: Partial<DashboardResponse>);
  constructor(src?: Partial<DashboardResponse>) {
    if (src) {
      this.Id = src.Id;
      this.OrganizationId = src.OrganizationId;
      this.ContainerId = src.ContainerId;
      this.Name = src.Name;
      this.ChartDuration = src.ChartDuration;
      if (src.Items) {
        src.Items.forEach((item) => {
          this.Items.push(new DashboardItemResponse(item));
        });
      }
    }
  }
}

export interface DashboardRequest {
  Id?: string;
  OrganizationId?: string;
  ContainerId?: string;
  Name: string;
  ChartDuration: number;
}
export interface DashboardFullRequest extends DashboardRequest {
  Items: DashboardItemRequest[];
}

export class ModuleReportModel {
  name: string;
  guid: string;
  deviceId: string;
  sensors: SensorRealTimeModel[];
  devices: DeviceModel[] = [];
  connected: boolean;

  productType: ProductTypeResponse;
}

export class SensorRealTimeModel {
  name: string;
  controllerId: string;
  deviceId: string;
  chartData: any;
  particleSensor: ParticleSensorResponse;
  serialNumber: string;
  productType: ProductTypeResponse;
  tstamp: moment.Moment;
  tz: string;
  tzId: string;
  tzAbbr: string;
  readingSuffix: string;
  value: BehaviorSubject<string>;
  connected: BehaviorSubject<boolean>;
  floatValue: BehaviorSubject<number>;
  numericValue: BehaviorSubject<number>;
  rangeMin: BehaviorSubject<number>;
  rangeMax: BehaviorSubject<number>;
  chartMin: BehaviorSubject<number>;
  chartMax: BehaviorSubject<number>;
  euMin: number;
  euMax: number;
  alerts: SensorAlert[];
  dayStart: string;
  dayEnd: string;
  activeAlerts: BehaviorSubject<SensorAlert[]>;

  public get outdated(): boolean {
    if (this.tstamp.year() === 2036) {
      return true;
    }

    const productTypeName = this.productType ? this.productType.Name : 'Unknown';

    switch (productTypeName) {
      case 'CanopyModule':
        return this.tstamp.diff(moment(), 'minutes') < -10;
      case 'WeatherStationModule':
        return this.tstamp.diff(moment(), 'minutes') < -5;
      case 'BacnetGateway':
        return this.tstamp.diff(moment(), 'seconds') < -60;
      default:
        return this.tstamp.diff(moment(), 'seconds') < -60;
    }
  }

  get needsUpdate() {
    if (this.tstamp.year() === 2036) {
      return false;
    }

    const productTypeName = this.productType ? this.productType.Name : 'Unknown';

    if (this.tstamp.diff(moment(), 'seconds') < -30) {
    }
    switch (productTypeName) {
      case 'CanopyModule':
        return this.tstamp.diff(moment(), 'minutes') < -5;
      case 'WeatherStationModule':
        return this.tstamp.diff(moment(), 'minutes') < -3;
      case 'BacnetGateway':
        return this.tstamp.diff(moment(), 'seconds') < -30;
      default:
        return this.tstamp.diff(moment(), 'seconds') < -30;
    }
  }

  public get age(): number {
    if (this.tstamp.year() < 2000 || this.tstamp.year() >= 2036) {
      return -1;
    }
    if (this.tstamp.diff(moment(), 'hours') < -12) {
      return 1;
    }

    return 0;
  }

  public updateActiveAlerts(currentValue: number ) {
    if (this.outdated) {
      this.activeAlerts.next([]);
      return;
    }

    const nowActive: SensorAlert[] = [];
    this.alerts.forEach((alert) => {
      const curTimestamp = moment(this.tstamp).tz(this.tz);
      const curTimeStr = curTimestamp.format('HH:mm:ss');
      const curTime = moment.tz(curTimeStr, 'HH:mm:ss', this.tz);
      const dayStart = moment.tz(this.dayStart, 'HH:mm:ss', this.tz);
      const dayEnd = moment.tz(this.dayEnd, 'HH:mm:ss', this.tz);

      if (alert.DayNightOption === DayNightOption.CustomTime) {
        const startTime = moment.tz(alert.StartTime, 'HH:mm:ss', this.tz);
        const endTime = moment.tz(alert.EndTime, 'HH:mm:ss', this.tz);

        if (startTime.isBefore(endTime) && (curTime.isBefore(startTime) || curTime.isAfter(endTime))) {
          return;
        }
        if (startTime.isAfter(endTime) && curTime.isBefore(startTime) && curTime.isAfter(endTime)) {
          return;
        }
      } else {
        if (dayStart.isBefore(dayEnd)) {
          switch (alert.DayNightOption) {
            case DayNightOption.DayOnly:
              if (curTime.isBefore(dayStart) || curTime.isAfter(dayEnd)) {
                return;
              }
              break;
            case DayNightOption.NightOnly:
              if (curTime.isAfter(dayStart) && curTime.isBefore(dayEnd)) {
                return;
              }
              break;
            default:
              break;
          }
        } else {
          switch (alert.DayNightOption) {
            case DayNightOption.DayOnly:
              if (curTime.isBefore(dayStart) && curTime.isAfter(dayEnd)) {
                return;
              }
              break;
            case DayNightOption.NightOnly:
              if (curTime.isAfter(dayStart) || curTime.isBefore(dayEnd)) {
                return;
              }
              break;
            default:
              break;
          }
        }
      }

      if (alert.ComparisonType === ComparisonType.Above && currentValue > alert.Threshold) {
        nowActive.push(alert);
      }
      if (alert.ComparisonType === ComparisonType.Below && currentValue < alert.Threshold) {
        nowActive.push(alert);
      }
    });

    this.activeAlerts.next(nowActive);
  }
}

export class DeviceModel {
  name: string;
  deviceType: DeviceTypes;
  deviceId: string;
  particleDevice: ParticleDevice;
  productType: ProductTypeResponse;
  interfaceType: InterfaceType;
  moduleId: string;
  moduleSerialNumber?: string;
  image: string;
  tstamp: moment.Moment;
  state: BehaviorSubject<string>;
  pendingState?: string;
  stateImages: string[];
  isReadOnly: boolean;
  allowManualThrottle: boolean;
  throttle: number;
  value: string;
  suffix: string;
  _ignoreUpdates = 0;

  module: ModuleReportModel;
  controller: Controller;

  get outdated() {
    if (this.tstamp.year() === 2036) {
      return true;
    }

    const productTypeName = this.productType ? this.productType.Name : 'Unknown';

    switch (productTypeName) {
      case 'CanopyModule':
        return this.tstamp.diff(moment(), 'minutes') < -10;
      case 'WeatherStationModule':
        return this.tstamp.diff(moment(), 'minutes') < -6;
      case 'BacnetGateway':
        return this.tstamp.diff(moment(), 'minutes') < -6;
      default:
        return this.tstamp.diff(moment(), 'minutes') < -6;
    }
  }

  get needsUpdate() {
    if (this.tstamp.year() === 2036) {
      return false;
    }

    const productTypeName = this.productType ? this.productType.Name : 'Unknown';

    switch (productTypeName) {
      case 'CanopyModule':
        return this.tstamp.diff(moment(), 'minutes') < -5;
      case 'WeatherStationModule':
        return this.tstamp.diff(moment(), 'minutes') < -3;
      case 'BacnetGateway':
        return this.tstamp.diff(moment(), 'minutes') < -3;
      default:
        return this.tstamp.diff(moment(), 'minutes') < -3;
    }
  }

  get currentState(): Observable<string> {
    if (this._ignoreUpdates > 0) {
      return of(this.pendingState);
    }

    return this.state;
  }
}

export type ManualTaskState = 'None' | 'On' | 'Off';
export class ManualTaskModel {
  id: number;
  name: string;
  duration: string;
  recipeId?: string;
  recipe?: string;
  state: ManualTaskState;
  stateImages: string[];
  isReadOnly: boolean;
  isActive: boolean;

  remaining?: number;
  lastUpdate?: number;
  controller: Controller;
}

export interface GenerationStatus {
  x: number;
  y: number;
  availColumns: number;
  id: number;
}
