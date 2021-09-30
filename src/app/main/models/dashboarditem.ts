import { GridsterItem, GridsterItemComponentInterface } from 'angular-gridster2';
import { BehaviorSubject } from 'rxjs';
import { SensorRealTimeModel, DeviceModel, ManualTaskModel } from './dashboard';
import { Controller } from './controller';
import { SensorResponse } from './sensorresponse';
import { ProductTypeResponse } from './producttyperesponse';
import { DeviceResponse } from './deviceresponse';
import { ModuleResponse } from './moduleresponse';
import { ManualTaskResponse } from './manualtaskresponse';
import { SensorAlert } from './sensoralert';
import { DeviceTypes } from './devicetype';
import { ParticleSensorsService } from '@services';
import { TimeUtil } from '@util';
import * as moment from 'moment';
import { InterfaceType } from './interface-type';

export type DashboardItemType =
  | 'gauge'
  | 'chart'
  | 'sensor'
  | 'sensor-min'
  | 'sensor-value'
  | 'device'
  | 'task'
  | 'label'
  | 'light-sensor';
export type WidgetSize = 'full' | 'compact' | 'minimum' | 'value-only' | 'icon-only';

export class DashboardItem implements GridsterItem {
  constructor(src: Partial<DashboardItem> | Partial<DashboardItemResponse>);
  constructor(src?: Partial<DashboardItem> | Partial<DashboardItemResponse>) {
    if (src instanceof DashboardItemResponse) {
      this.id = src.Id;
      this.dashboardId = src.DashboardId;
      this.x = src.X;
      this.y = src.Y;
      this.w = src.W;
      this.h = src.H;
      this.layerIndex = src.Layer;
      this.type = src.Type;
      this.sensorId = src.SensorId;
      this.deviceId = src.DeviceId;
      this.taskId = src.TaskId;
      this.customName = src.CustomName;
      this.options = src.Options;
    } else {
      src = src as DashboardItem;
      this.id = src.id;
      this.dashboardId = src.dashboardId;
      this.initCallback = src.initCallback;
      this.type = src.type;
      this.sensorId = src.sensorId;
      this.sensor = src.sensor;
      this.deviceId = src.deviceId;
      this.device = src.device;
      this.taskId = src.taskId;
      this.task = src.task;
      this.customName = src.customName;
      this.options = src.options;
    }
    switch (this.type) {
      case 'gauge':
        this.rows = 6;
        this.cols = 3;
        break;
      case 'chart':
        this.rows = 4;
        this.cols = 4;
        break;
      case 'sensor':
        this.rows = 2;
        this.cols = 3;
        break;
      case 'sensor-min':
        this.rows = 2;
        this.cols = 2;
        break;
      case 'sensor-value':
        this.rows = 1;
        this.cols = 2;
        break;
      case 'device':
        this.rows = 3;
        this.cols = 3;
        break;
      case 'task':
        this.rows = 2;
        this.cols = 3;
        break;
      case 'label':
        this.rows = 1;
        this.cols = this.w;
        this.resizeEnabled = undefined;
        break;
      case 'light-sensor':
        const lightWidgetType = this.options.WidgetSize;
        switch (lightWidgetType) {
          case 'full':
            this.rows = 4;
            this.cols = 4;
            break;
          case 'compact':
            this.rows = 2;
            this.cols = 3;
            break;
          case 'minimum':
            this.rows = 2;
            this.cols = 2;
            break;
          case 'value-only':
            this.rows = 1;
            this.cols = 2;
            break;
          case 'icon-only':
            this.rows = 1;
            this.cols = 1;
            break;
          default:
            this.rows = 1;
            this.cols = 2;
            break;
        }

        break;
      default:
        this.rows = this.h;
        this.cols = this.w;
        break;
    }
  }

  id: string;
  dashboardId: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  rows: number;
  cols: number;
  layerIndex: number;
  initCallback?: (item: GridsterItem, itemComponent: GridsterItemComponentInterface) => void;
  resizeEnabled = false;
  compactEnabled = false;
  maxItemRows = null;
  minItemRows = null;
  maxItemCols = null;
  minItemCols = null;
  minItemArea = null;
  maxItemArea = null;
  type: DashboardItemType;
  sensorId?: string;
  sensor?: SensorRealTimeModel;
  deviceId?: string;
  device?: DeviceModel;
  taskId?: string;
  task?: ManualTaskModel;
  customName?: string;
  options?: WidgetOptions;

  public get AsRequest(): DashboardItemRequest {
    return {
      Id: this.id,
      DashboardId: this.dashboardId,
      Type: this.type,
      X: this.x,
      Y: this.y,
      W: this.w,
      H: this.h,
      Layer: this.layerIndex,
      SensorId: this.sensorId,
      DeviceId: this.deviceId,
      TaskId: this.taskId,
      CustomName: this.customName,
      Options: this.options,
    };
  }

  public static taskName(controller: Controller, task: ManualTaskResponse): string {
    if (task.DisplayName) {
      return task.DisplayName;
    }

    const sharedDevices = controller.SharedModules.reduce(
      (all, mod) => all.concat(mod.Devices),
      new Array<DeviceResponse>()
    );
    const devices = sharedDevices.concat(
      controller.Modules.reduce((all, mod) => all.concat(mod.Devices), new Array<DeviceResponse>())
    );

    const deviceIds = [task.DeviceId, ...task.AdditionalDeviceIds];
    const deviceNames = deviceIds.map((id) => {
      const device = devices.find((dev) => dev.Guid === id);
      return device ? device.Name : 'UNKNOWN DEVICE';
    });

    return deviceNames.join(', ');
  }

  public createSensorModel(
    particleSensorService: ParticleSensorsService,
    controller: Controller,
    productType: ProductTypeResponse,
    sensor: SensorResponse
  ): void {
    const particleSensor = particleSensorService.FindParticleSensor(sensor.ParticleSensor);
    const sensorAlerts = sensor.Alerts.filter((alert) => {
      const rg = controller.RuleGroups.find((rgr) => rgr.Id === alert.RuleGroupId);
      if (!rg || !rg.IsActive) {
        return false;
      }

      return alert.IsActive;
    }).map((alert) => SensorAlert.GetAlert(particleSensorService, [sensor], alert));

    this.sensor = Object.assign<SensorRealTimeModel, Partial<SensorRealTimeModel>>(
      new SensorRealTimeModel(),
      {
        name: sensor.Name,
        deviceId: sensor.Guid,
        serialNumber: sensor.SerialNumber,
        controllerId: controller.Guid,
        chartData: [{ name: sensor.Name, series: [] }],
        particleSensor,
        productType,
        tstamp: moment.unix(0),
        tz: controller.TimeZoneId,
        tzId: moment.unix(0).tz(controller.TimeZoneId).format('Z'),
        tzAbbr: TimeUtil.getTimezoneAbbr(controller.TimeZoneId),
        readingSuffix: sensor.ReadingSuffix,
        value: new BehaviorSubject('--'),
        numericValue: new BehaviorSubject(0),
        floatValue: new BehaviorSubject(sensor.MinRange),
        connected: new BehaviorSubject(false),
        chartMin: new BehaviorSubject(sensor.MaxRange),
        rangeMin: new BehaviorSubject(sensor.MinRange),
        euMin: sensor.MinRange,
        euMax: sensor.MaxRange,
        rangeMax: new BehaviorSubject(sensor.MaxRange),
        chartMax: new BehaviorSubject(sensor.MinRange),
        alerts: sensorAlerts,
        dayStart: controller.DayStartTime,
        dayEnd: controller.DayEndTime,
        activeAlerts: new BehaviorSubject([]),
      }
    );

    this.setSensorRange(sensor);
  }

  public setSensorRange(sensor: SensorResponse) {
    this.sensor.euMin =
      this.options && this.options.EUMin !== undefined ? this.options.EUMin : sensor.MinRange;
    this.sensor.euMax =
      this.options && this.options.EUMax !== undefined ? this.options.EUMax : sensor.MaxRange;
  }

  public createDeviceModel(
    controller: Controller,
    productType: ProductTypeResponse,
    device: DeviceResponse,
    module: ModuleResponse
  ): void {
    let deviceAllowsThrottle = productType.AllowsManualThrottling;
    if (!deviceAllowsThrottle && productType.Name === 'LightingControllerIluminar') {
      deviceAllowsThrottle =
        device.DeviceType === DeviceTypes.LightAnalog ||
        device.DeviceType === DeviceTypes.LightAnalogCmh ||
        device.DeviceType === DeviceTypes.LightAnalogHps ||
        device.DeviceType === DeviceTypes.LightAnalogLed;
    }

    this.device = Object.assign<DeviceModel, Partial<DeviceModel>>(new DeviceModel(), {
      name: device.Name,
      deviceId: device.Guid,
      deviceType: device.DeviceType,
      interfaceType: device.InterfaceType,
      particleDevice: device.ParticleDevice,
      moduleId: module.Guid,
      moduleSerialNumber: module.SerialNumber,
      module: null,
      controller,
      productType,
      image: null,
      tstamp: moment.unix(0),
      state: new BehaviorSubject<string>('Loading'),
      stateImages: [null, null, null],
      isReadOnly: controller.isReadOnly,
      allowManualThrottle: deviceAllowsThrottle,
      throttle: 0,
      value: '',
      suffix: device.BacnetValueSuffix,
      _ignoreUpdates: 0,
    });

    if (device.InterfaceType !== InterfaceType.PercentageSlider && !deviceAllowsThrottle) {
      this.rows = 2;
    }
  }

  public createTaskModel(controller: Controller, task: ManualTaskResponse): void {
    const recipes = [...controller.DosingRecipes, ...controller.SharedDosingRecipes];
    const recipe = task.DosingRecipeId ? recipes.find((r) => r.Id === task.DosingRecipeId) : null;
    const recipeId = recipe ? recipe.Id : null;
    const recipeName = recipe ? recipe.Name : null;
    const ruleGroup = controller.RuleGroups && controller.RuleGroups.find(rg => rg.Id === task.RuleGroupId);
    const isActive = ruleGroup && task.IsActive && ruleGroup.IsActive;

    this.task = {
      id: task.DatabaseId,
      isReadOnly: controller.isReadOnly,
      isActive: isActive,
      state: 'Off',
      name: DashboardItem.taskName(controller, task),
      duration: task.Duration,
      recipeId: recipeId,
      recipe: recipeName,
      stateImages: [null, null],
      remaining: null,
      controller
    };
  }
}

export class DashboardItemResponse implements DashboardItemRequest {
  Id: string;
  DashboardId: string;
  Type: DashboardItemType;
  X: number;
  Y: number;
  W?: number;
  H?: number;
  Layer: number;
  SensorId?: string;
  DeviceId?: string;
  TaskId?: string;
  CustomName?: string;
  Options?: WidgetOptions;

  constructor(src: Partial<DashboardItemResponse>);
  constructor(src?: Partial<DashboardItemResponse>) {
    if (src) {
      this.Id = src.Id;
      this.DashboardId = src.DashboardId;
      this.X = src.X;
      this.Y = src.Y;
      this.W = src.W;
      this.H = src.H;
      this.Layer = src.Layer;
      this.Type = src.Type;
      this.SensorId = src.SensorId;
      this.DeviceId = src.DeviceId;
      this.TaskId = src.TaskId;
      this.CustomName = src.CustomName;
      this.Options = src.Options;
    }
  }
}

export interface DashboardItemRequest {
  Id?: string;
  DashboardId: string;
  Type: DashboardItemType;
  X: number;
  Y: number;
  W?: number;
  H?: number;
  Layer: number;
  SensorId?: string;
  DeviceId?: string;
  TaskId?: string;
  CustomName?: string;
  Options?: WidgetOptions;
}

export type WidgetOptions = LabelWidgetOptions & GaugeWidgetOptions & LightSensorWidgetOptions;

export interface LabelWidgetOptions {
  FontSize?: string;
  Underline?: boolean;
  Bold?: boolean;
  Align?: 'left' | 'right' | 'center';
}

export interface GaugeWidgetOptions {
  EUMin?: number;
  EUMax?: number;
}

export interface LightSensorWidgetOptions {
  WidgetSize?: WidgetSize;
  OnThreshold?: number;
  Align?: 'left' | 'right' | 'center';
}
