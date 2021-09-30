import { Component, OnInit, OnDestroy, Input, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { GridsterConfig } from 'angular-gridster2';
import { interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';

import {
  ProgressBarService,
  ControllerService,
  ChartDataPointsService,
  DashboardService,
  Breadcrumb,
  AuthenticationService,
  ProductTypesService,
  ParticleSensorsService,
  UserPreferencesService,
  SignalRService,
  ActiveControllerService,
} from '@services';
import {
  Controller,
  SensorResponse,
  ParticleDeviceStateResponse,
  DeviceResponse,
  ModuleResponse,
  ManualTaskResponse,
  SensorRealTimeModel,
  DeviceModel,
  ManualTaskModel,
  Dashboard,
  DashboardItem,
  DashboardRequest,
  DashboardType,
  OrgDashboardControllerResponse,
  OrgDashboardControllerDevicesResponse,
  ProductTypeResponse,
  DashboardItemType,
  DashboardItemResponse,
  DeviceTypes,
  ParticleSensor,
  ControllerResponse,
  GenerationStatus,
  RuleGroupResponse,
  ParticleManualTaskState,
  DosingRecipeResponse,
  ParticleDeviceState,
} from '@models';
import { DashboardWidgetsHost } from '../dashboard-widgets/dashboard-widgets-host.base';
import { AddSensorDialogComponent } from './add-sensor-dialog/add-sensor-dialog.component';
import { AddDeviceDialogComponent } from './add-device-dialog/add-device-dialog.component';
import { AddManualTaskDialogComponent } from './add-manual-task-dialog/add-manual-task-dialog.component';
import { AddLabelDialogComponent } from './add-label-dialog/add-label-dialog.component';
import { EditDashboardDialogComponent } from './edit-dashboard-dialog/edit-dashboard-dialog.component';
import { EditItemDialogComponent } from './edit-item-dialog/edit-item-dialog.component';
import { SaveDashboardDialogComponent } from './save-dashboard-dialog/save-dashboard-dialog.component';
import * as moment from 'moment';
import { AddLightSensorDialogComponent } from './add-light-sensor-dialog/add-light-sensor-dialog.component';

export const DashboardColumnWidth = 100;
export const DashboardRowHeight = 45;

@Component({
  selector: 'fuse-custom-dashboard',
  templateUrl: './custom-dashboard.component.html',
  styleUrls: ['./custom-dashboard.component.scss'],
})
export class CustomDashboardComponent extends DashboardWidgetsHost implements OnInit, OnDestroy {
  options: GridsterConfig;
  dashboard: Dashboard;
  dashboards: Dashboard[] = [];
  loading = false;
  controller: Controller = new Controller();
  controllerResponse: ControllerResponse;
  allControllers: Controller[] = [];
  orgControllers: Controller[] = [];
  org: string = null;
  manageItems = false;
  sensorOptions: SensorOption[] = [];
  deviceOptions: DeviceOption[] = [];
  taskOptions: ManualTaskOption[] = [];
  currentDashboardId: string = null;

  private modules: ModuleEntity[] = [];
  private motorDevices: string[] = [];

  public sensorModules: ModuleEntity[] = [];
  public deviceModules: ModuleEntity[] = [];
  public singleDeviceModules: ModuleEntity[] = [];
  public groupModules: ModuleEntity[] = [];
  private _allSensors: NamedEntity[] = [];
  private _allDevices: NamedEntity[] = [];
  public groupedModules: GroupedEntities[] = [];
  public groupedSingleDevices: GroupedDevices[] = [];
  public manualTasks: NamedEntity[] = [];
  private prefersGauges = false;
  private dashboardOpen = false;

  private controllerOffline = false;

  private timer1: number;
  private timer2: number;
  private timer3: number;
  private timer4: number;
  private runTimers = true;
  private refreshRate = 1000;
  private dashboardOpened = 0;
  private isIdle = false;

  get allSensorEntities(): NamedEntity[] {
    return this._allSensors;
  }
  get allDeviceEntities(): NamedEntity[] {
    return this._allDevices;
  }
  get hasCharts(): boolean {
    if (!this.dashboard) {
      return false;
    }

    return this.dashboard.Items.some(di => di.type === 'chart');
  }

  @Input() dashboardType: DashboardType;
  @Input() dashboardId: Observable<string> = null;

  constructor(
    private router: Router,
    private hostElement: ElementRef,
    private authService: AuthenticationService,
    private dashboardService: DashboardService,
    private chartDataPointService: ChartDataPointsService,
    private productsService: ProductTypesService,
    private progressBarService: ProgressBarService,
    protected controllerService: ControllerService,
    protected activeControllerService: ActiveControllerService,
    protected particleSensorService: ParticleSensorsService,
    protected userPrefsService: UserPreferencesService,
    protected signalR: SignalRService,
    public dialog: MatDialog,
    public snackbar: MatSnackBar,
    private fuseNav: FuseNavigationService
  ) {
    super(controllerService, particleSensorService, userPrefsService, snackbar);
  }

  ngOnInit() {
    this.options = {
      gridType: 'fixed',
      fixedColWidth: DashboardColumnWidth,
      fixedRowHeight: DashboardRowHeight,
      maxRows: 1000,
      displayGrid: 'onDrag&Resize',
      draggable: {
        enabled: false,
      },
      resizable: {
        enabled: false,
        handles: {
          s: false,
          e: true,
          n: false,
          w: false,
          se: false,
          ne: false,
          sw: false,
          nw: false,
        },
      },
      allowMultiLayer: true,
      defaultLayerIndex: 5,
      maxLayerIndex: 5,
      itemChangeCallback: (item: DashboardItem) => this.itemChanged(item),
    };

    if (this.dashboardType === 'Controller') {
      this.subs.add(
        this.controllerService.currentContainer.subscribe((r) => {
          this.updateController(r);
        })
      );

      this.subs.add(
        this.controllerService.AllControllers.subscribe(() => {
          if (!this.controller) {
            return;
          }

          this.controllerResponse = this.controllerService.findController(this.controller.Guid);
        })
      );

      this.subs.add(
        this.activeControllerService.ControllerOffline.subscribe((offline) => {
          if (offline !== this.controllerOffline) {
            this.controllerOffline = offline;
            this.setBreadcrumbs();
          }
        })
      );

      this.subs.add(
        this.activeControllerService.SensorReadings.subscribe((readings) => {
          for (const reading of readings) {
            const filteredSensors = this.sensorOptions.filter(
              (sens) => sens.module.SerialNumber === reading.sn
            );
            const readingSensors = this.allSensors.filter((sens) =>
              filteredSensors.some((fs) => fs.sensor.Guid === sens.deviceId)
            );
            for (const sensor of readingSensors) {
              this.updateSensorFormattedReadings(sensor, reading, this.controller);
            }
          }

          this.anyAlerts = this.allSensors.some((sensor) => !!sensor.activeAlerts.value.length);
          this.updateRefreshRate();
        })
      );

      this.subs.add(
        this.activeControllerService.SensorMinimums.subscribe((sensorMins) => {
          this.allSensors.forEach((sensor) => {
            const newSensorMin = sensorMins.has(sensor.deviceId) ? sensorMins.get(sensor.deviceId) : sensor.euMin;
            sensor.rangeMin.next(newSensorMin);
          });
        })
      );

      this.subs.add(
        this.activeControllerService.SensorMaximums.subscribe((sensorMaxes) => {
          this.allSensors.forEach((sensor) => {
            const newSensorMax = sensorMaxes.has(sensor.deviceId) ? sensorMaxes.get(sensor.deviceId) : sensor.euMax;
            sensor.rangeMax.next(newSensorMax);
          });
        })
      );

      this.subs.add(
        this.activeControllerService.DeviceStates.subscribe((states) => {
          this.updateDeviceStates(states);
          this.updateRefreshRate();
        })
      );

      this.subs.add(
        this.activeControllerService.ManualTaskStates.subscribe((states) => {
          this.updateTaskStates(states);
        })
      );

      this.subs.add(
        this.userPrefsService.userPrefs.subscribe((prefs) => {
          this.prefersGauges = prefs.dashboard === 'gauges';
          if (this.currentDashboardId === 'generated' && this.controller) {
            const generated = this.generateDashboard();
            this.dashboardService.setGeneratedDashboard(generated);
            this.activeControllerService.bumpObservables();
          }
        })
      );

      this.subs.add(
        this.activeControllerService.IsIdle.subscribe((isIdle) => {
          this.isIdle = isIdle;
          this.updateRefreshRate();
          this.activeControllerService.RestartTimers();
        })
      );
    }
    if (this.dashboardType === 'Organization') {
      this.subs.add(
        this.authService.OrganizationIdChanged.subscribe((orgId) => {
          this.org = orgId;
          this.updateOrgControllers();
        })
      );

      this.controllerService.getContainers().subscribe((all) => {
        this.allControllers = all;
        this.updateOrgControllers();
      });

      this.setBreadcrumbs();
    }

    this.subs.add(
      this.dashboardId.subscribe((dbId) => {
        this.currentDashboardId = dbId;

        this.setDashboard();
      })
    );

    this.subs.add(
      this.dashboardService.GeneratedDashboard.subscribe((gdb) => {
        if (!gdb) {
          return;
        }

        this.loadDashboard(gdb);
      })
    );

    this.setChartDuration(10);

    super.ngOnInit();
  }

  private setDashboard() {
    if (this.currentDashboardId !== 'generated') {
      const preDash = this.dashboards.find((db) => db.Id === this.currentDashboardId);
      if (preDash) {
        // console.log('preDash', preDash);
        this.loadDashboard(preDash);
      }
    } else {
      // console.log('updateController', 'ControllerDefault');
      const generated = this.generateDashboard();
      this.dashboardService.setGeneratedDashboard(generated);
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.runTimers = false;
    this.killTimers();

    this.dashboardService.clearGeneratedDashboard();
    this.dashboardOpen = false;
  }

  private killTimers() {
    if (this.timer1) {
      window.clearTimeout(this.timer1);
    }
    if (this.timer2) {
      window.clearTimeout(this.timer2);
    }
    if (this.timer3) {
      window.clearTimeout(this.timer3);
    }
    if (this.timer4) {
      window.clearTimeout(this.timer4);
    }
  }

  itemChanged(item: DashboardItem) {
    switch (item.type) {
      case 'label':
        item.w = item.cols;
        break;
    }

    if (this.dashboard.Id === 'generated') {
      return;
    }

    const updateRequest = item.AsRequest;
    this.dashboardService.updateDashboardItem(updateRequest).subscribe(() => {});
  }

  setChartDuration(duration: number): void {
    if (!this.dashboard) {
      return;
    }

    this.dashboard.ChartDuration = duration;
    let refresh = 60000;
    switch (duration) {
      case 60:
        refresh = 180000;
        break;
      case 1440:
        refresh = 900000;
        break;
      default:
        refresh = 60000;
        break;
    }

    if (this.chartSubscription) {
      this.chartSubscription.unsubscribe();
    }

    this.chartSubscription = interval(refresh).subscribe(() => this.loadCharts());
    this.loadCharts();
  }

  addSensor() {
    const allSensors = this.sensorOptions.filter(
      (sens) => !this.dashboard.Items.some(
        (dbItem) => dbItem.sensorId === sens.sensor.Guid &&
          (
            dbItem.type === 'chart' ||
            dbItem.type === 'gauge' ||
            dbItem.type === 'sensor' ||
            dbItem.type === 'sensor-min' ||
            dbItem.type === 'sensor-value'
          )
        )
    );

    if (!allSensors.length) {
      return;
    }

    const curPos = this.getCurrentDashboardPosition();
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { dashboard: this.dashboard, sensorOptions: allSensors, curPos },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(AddSensorDialogComponent, config);

    dialogRef.afterClosed().subscribe((refresh: boolean) => {
      if (!refresh) {
        return;
      }

      this.loadAllData();
      this.loadCharts();
    });
  }

  addLight() {
    const allLights = this.sensorOptions.filter(
      (sens) => sens.sensor.ParticleSensor === ParticleSensor.LightLevel &&
        !this.dashboard.Items.some((dbItem) => dbItem.sensorId === sens.sensor.Guid && dbItem.type === 'light-sensor')
    );

    if (!allLights.length) {
      return;
    }

    const curPos = this.getCurrentDashboardPosition();
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { dashboard: this.dashboard, sensorOptions: allLights, curPos },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(AddLightSensorDialogComponent, config);

    dialogRef.afterClosed().subscribe((refresh: boolean) => {
      if (!refresh) {
        return;
      }

      this.loadAllData();
      this.loadCharts();
    });
  }

  addDevice() {
    const allDevices = this.deviceOptions.filter(
      (dev) => !this.dashboard.Items.some((dbItem) => dbItem.deviceId === dev.device.Guid)
    );

    if (!allDevices.length) {
      return;
    }

    const curPos = this.getCurrentDashboardPosition();
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { dashboard: this.dashboard, deviceOptions: allDevices, curPos },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(AddDeviceDialogComponent, config);

    dialogRef.afterClosed().subscribe((refresh: boolean) => {
      if (!refresh) {
        return;
      }

      this.loadAllData();
    });
  }

  addTask() {
    const allTasks = this.taskOptions
      .filter((task) => this.manualTasks.some(t => t.id === task.task.Id))
      .filter((task) => !this.dashboard.Items.some((dbItem) => dbItem.taskId === task.task.Id));

    if (!allTasks.length) {
      return;
    }

    const curPos = this.getCurrentDashboardPosition();
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { dashboard: this.dashboard, tasks: allTasks, curPos },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(AddManualTaskDialogComponent, config);

    dialogRef.afterClosed().subscribe((refresh: boolean) => {
      if (!refresh) {
        return;
      }

      this.loadAllData();
    });
  }

  addLabel() {
    const curPos = this.getCurrentDashboardPosition();
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { dashboard: this.dashboard, curPos },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(AddLabelDialogComponent, config);

    dialogRef.afterClosed().subscribe(() => {});
  }

  manageMode(managing: boolean) {
    this.manageItems = managing;
    this.options.draggable.enabled = managing;
    this.options.resizable.enabled = managing;
    if (this.options.api && this.options.api.optionsChanged) {
      this.options.api.optionsChanged();
    }
  }

  renameItem(event: Event, idx: number) {
    event.preventDefault();
    event.stopPropagation();

    var controller: Controller = null;

    const item = this.dashboard.Items[idx].AsRequest;
    if (item.Type === 'chart' || item.Type === 'sensor' || item.Type === 'sensor-min' ||
      item.Type === 'sensor-value' || item.Type === 'light-sensor') {
      const sensor = this.sensorOptions.find(so => so.sensor.Guid === item.SensorId);
      controller = this.controller.Guid
        ? this.controller
        : this.orgControllers.find(c => c.Guid === sensor.controller.Guid);
    }

    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { controller: controller, dashboardItem: item },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(EditItemDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: DashboardItem | number) => {
      if (!result) {
        return;
      }

      if (typeof(result) === 'number') {
        if (result === -1) {
          this.dashboard.Items.splice(idx, 1);
        }
        return;
      }

      const existItem = this.dashboard.Items.find((exist) => exist.id === result.id);
      if (existItem) {
        existItem.customName = result.customName;
        if (existItem.type === 'label' || existItem.type === 'gauge' || existItem.type === 'light-sensor') {
          existItem.options = result.options;
          if (existItem.type === 'gauge') {
            const actualSensor = this.sensorOptions.find(so => so.sensor.Guid === existItem.sensorId);
            existItem.setSensorRange(actualSensor.sensor);
          }
        }
      }
    });
  }

  deleteItem(event: Event, idx: number) {
    event.preventDefault();
    event.stopPropagation();

    if (this.dashboard.Id === 'generated') {
      this.dashboard.Items.splice(idx, 1);
      return;
    }

    const item = this.dashboard.Items[idx];
    this.dashboardService.deleteDashboardItem(item.id).subscribe((success) => {
      if (success) {
        this.dashboard.Items.splice(idx, 1);
      }
    });
  }

  onDeviceStateChange(device: DeviceModel): void {
    if (!this.dashboard || this.dashboardType !== 'Organization') {
      return;
    }

    this.loadDeviceStates();
  }

  onManualTaskStateChange(task: ManualTaskModel): void {}

  onManualTaskError(error: any) {
    this.handleErrors(error);
  }

  navToRules(): void {
    this.router.navigate(['controller', this.controller.Guid, 'rules']);
  }

  private updateLocation() {
    if (this.controllerService.IsControllerLoading) {
      return;
    }
    if (this.dashboardType === 'Controller' && (!this.controller || !this.controller.Guid)) {
      return;
    }
    if (this.dashboardType === 'Organization' && !this.org) {
      return;
    }

    const dbFragment = this.currentDashboardId;
    if (dbFragment === null) {
      return;
    }

    if (this.dashboardType === 'Controller') {
      this.router.navigate(['controller', this.controller.Guid, 'dashboard', dbFragment]);
    }
    if (this.dashboardType === 'Organization') {
      this.router.navigate(['org', 'dashboards', dbFragment]);
    }
  }

  private updateController(controller: Controller): void {
    this.controller = controller;
    this.anyAlerts = false;
    this.dashboardOpened = moment().unix();

    this.setBreadcrumbs(false);

    this.sensorOptions = this.controller.Modules.reduce(
      (all, mod) =>
        all.concat(
          mod.Sensors.map((sens) => ({
            controller: this.controller,
            module: mod,
            sensor: sens,
            productType: mod.ProductType,
          }))
        ),
      new Array<SensorOption>()
    );
    this.deviceOptions = this.controller.Modules.reduce(
      (all, mod) =>
        all.concat(
          mod.Devices.map((dev) => ({
            controller: this.controller,
            module: mod,
            device: dev,
            productType: mod.ProductType,
          }))
        ),
      new Array<DeviceOption>()
    );
    this.taskOptions = this.controller.ManualTasks.map((task) => ({
      controller: this.controller,
      task,
    }));

    if (this.controller.Guid) {
      this.controllerResponse = this.controllerService.findController(this.controller.Guid);
      this.initModules();
      this.initManualTasks();

      this.dashboardService
        .getControllerDashboards(this.controller.Guid)
        .subscribe((dashboards) => {
          this.dashboards = dashboards.map((db) => new Dashboard(db));
          const defaultDash = new Dashboard({
            Id: 'generated',
            Name: 'Auto-Generated',
            ChartDuration: 10,
            Items: [],
          });

          this.dashboards.unshift(defaultDash);
          this.setDashboard();
        });
    }
  }

  private updateOrgControllers() {
    if (!this.org || !this.allControllers || !this.allControllers.length) {
      this.orgControllers = [];
    } else {
      this.orgControllers = this.allControllers;
    }

    this.sensorOptions = new Array<SensorOption>();
    this.deviceOptions = new Array<DeviceOption>();
    this.taskOptions = new Array<ManualTaskOption>();
    const ruleGroups = this.orgControllers.reduce((all, c) => {
      all.push(...c.RuleGroups.map(rg => ({controller: c, rulegroup: rg})));

      return all;
    }, new Array<{controller: Controller, rulegroup: RuleGroupResponse}>());

    this.orgControllers.forEach((controller) => {
      this.sensorOptions = controller.Modules.reduce(
        (all, mod) =>
          all.concat(
            mod.Sensors.map((sens) => ({
              controller,
              module: mod,
              sensor: sens,
              productType: mod.ProductType,
            }))
          ),
        this.sensorOptions
      );
      this.deviceOptions = controller.Modules.reduce(
        (all, mod) =>
          all.concat(
            mod.Devices.map((dev) => ({
              controller,
              module: mod,
              device: dev,
              productType: mod.ProductType,
            }))
          ),
        this.deviceOptions
      );
      // if (controller.ManualTasks) {
      //   this.taskOptions.push(...controller.ManualTasks.map((task) => ({ controller, task })));
      // }
    });

    if (this.orgControllers && this.orgControllers.length) {
      this.controllerService.getOrgManualTasks(this.org).subscribe((tasks) => {
        this.taskOptions.push(...tasks.map((task) => {
          const ruleGroup = ruleGroups.find(rg => rg.rulegroup.Id === task.RuleGroupId);
          if (!ruleGroup) {
            return null;
          }
          const controller = ruleGroup.controller;
          return ({ controller, task });
        }).filter(opt => !!opt));

        tasks.forEach((taskRule) => {
          const ruleGroup = ruleGroups.find((rg) => rg.rulegroup.Id === taskRule.RuleGroupId);
          if (!ruleGroup || !ruleGroup.rulegroup.IsActive || !taskRule.IsActive) {
            return;
          }
          const deviceIds = [taskRule.DeviceId, ...taskRule.AdditionalDeviceIds];
          const deviceNames = deviceIds.map((id) => {
            const device = this.deviceOptions.find((dev) => dev.device.Guid === id);
            return device ? device.device.Name : 'UNKNOWN DEVICE';
          });
          const task: NamedEntity = {
            id: taskRule.Id,
            name: taskRule.DisplayName ? taskRule.DisplayName : deviceNames.join(', '),
          };

          this.manualTasks.push(task);
        });

        this.manualTasks.sort((a, b) => a.name.localeCompare(b.name));

        if (this.org && !this.dashboards.length && this.orgControllers.length) {
          this.dashboardService.getOrganizationDashboards(this.org).subscribe((result) => {
            this.dashboards = result.map((db) => new Dashboard(db));
            this.setDashboard();
          });
        }
      });
    }

  }

  protected setBreadcrumbs(updateURL = true) {
    const breadcrumbs = new Array<Breadcrumb>();
    if (this.dashboardType === 'Controller') {
      breadcrumbs.push({
        icon: 'business',
        caption: this.controller.Name,
        warning: this.controllerOffline ? 'The controller could not be reached.' : null,
        warningIcon: 'wifi_off',
        url: ['controller', this.controller.Guid, 'dashboard'],
      });
    }

    if (!this.dashboard) {
      breadcrumbs.push({ icon: 'assessment', caption: 'Dashboards' });
    } else {
      breadcrumbs.push({
        icon: 'assessment',
        caption: 'Dashboards',
        url:
          this.dashboardType === 'Controller'
            ? ['controller', this.controller.Guid, 'dashboard']
            : ['org', 'dashboards'],
      });
      breadcrumbs.push({
        icon: 'assessment',
        caption: this.dashboard.Name,
        warning: this.anyAlerts ? 'Sensor Alerts are active' : null,
      });
    }

    if (!this.dashboardOpen) { return; }

    this.progressBarService.SetCurrentPage(breadcrumbs);

    if (updateURL) {
      this.updateLocation();
    }
  }

  switchDashboard() {
    this.runTimers = false;
    if (this.chartSubscription) {
      this.chartSubscription.unsubscribe();
    }

    this.killTimers();
    this.dashboard = null;
    this.setBreadcrumbs();
    this.dashboardOpen = false;
  }

  navigateToDashboard(dashboard: Dashboard) {
    if (this.dashboardType === 'Controller') {
      this.router.navigate(['controller', this.controller.Guid, 'dashboard', dashboard.Id]);
      const c = this.controllerResponse;
      this.fuseNav.updateNavigationItem(`dashboard${c.Id}`, {
        url: `/controller/${c.Id}/dashboard/${dashboard.Id}`
      });
    }
    if (this.dashboardType === 'Organization') {
      this.router.navigate(['org', 'dashboards', dashboard.Id]);
    }
  }

  loadDashboard(dashboard: Dashboard) {
    // console.log('loadDashboard', dashboard);

    this.dashboard = dashboard;
    this.dashboardOpen = true;
    this.dashboard.Items.forEach((item) => {
      if (item.sensorId) {
        const selected = this.sensorOptions.find((sens) => sens.sensor.Guid === item.sensorId);
        if (!selected) {
          return;
        }

        const productType = this.productsService.FindProductType(selected.productType);
        item.createSensorModel(
          this.particleSensorService,
          selected.controller,
          productType,
          selected.sensor
        );
      }
      if (item.deviceId) {
        const selected = this.deviceOptions.find((dev) => dev.device.Guid === item.deviceId);
        if (!selected) {
          return;
        }

        const productType = this.productsService.FindProductType(selected.productType);
        item.createDeviceModel(selected.controller, productType, selected.device, selected.module);
      }
      if (item.taskId) {
        const selected = this.taskOptions.find((t) => t.task.Id === item.taskId);
        if (!selected) {
          return;
        }

        item.createTaskModel(selected.controller, selected.task);
        if (!item.task.isActive) {
          const ruleGroup = selected.controller.RuleGroups &&
            selected.controller.RuleGroups.find(rg => rg.Id === selected.task.RuleGroupId);
          if (ruleGroup && !ruleGroup.IsActive) {
            // Selected Task is on an inactive rule group. See if we can find the same task on the active rule group
            const activeRuleGroup = selected.controller.RuleGroups.find(rg => rg.IsActive);
            const taskName = item.task.name;
            const matchingTask = this.taskOptions.find((t) => t.task.RuleGroupId === activeRuleGroup.Id &&
              DashboardItem.taskName(t.controller, t.task).toLowerCase() === taskName.toLowerCase());

            if (matchingTask) {
              item.createTaskModel(matchingTask.controller, matchingTask.task);
            }
          }
        }
      }
    });

    this.setBreadcrumbs();
    this.setChartDuration(dashboard.ChartDuration);
    this.loadAllData();
    this.activeControllerService.bumpObservables();
  }

  addDashboard() {
    const newDashboardRequest: DashboardRequest = {
      Name: 'New Dashboard',
      ChartDuration: 10,
      ContainerId: this.dashboardType === 'Controller' ? this.controller.Guid : null,
      OrganizationId: this.dashboardType === 'Organization' ? this.org : null,
    };

    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { controller: this.controller, dashboard: newDashboardRequest },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(EditDashboardDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: Dashboard) => {
      if (!result) {
        return;
      }
      this.dashboards.push(result);
      this.dashboard = result;

      this.setBreadcrumbs();
      this.loadAllData();
    });
  }

  editDashboard() {
    const editDashboardRequest = this.dashboard.AsRequest;

    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { controller: this.controller, dashboard: editDashboardRequest },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(EditDashboardDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: Dashboard) => {
      if (!result) {
        return;
      }
      if (this.dashboard.Id === 'generated') {
        this.dashboard.ChartDuration = result.ChartDuration;
      } else {
        const existDashboard = this.dashboards.find((exist) => exist.Id === result.Id);
        if (existDashboard) {
          existDashboard.Name = result.Name;
          existDashboard.ChartDuration = result.ChartDuration;
        }
      }

      this.loadAllData();
    });
  }

  deleteDashboard(item: Dashboard, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.dashboardService.deleteDashboard(item.Id).subscribe((success) => {
      if (success) {
        const itemIdx = this.dashboards.findIndex((exist) => exist.Id === item.Id);
        if (itemIdx > -1) {
          this.dashboards.splice(itemIdx, 1);
        }
      }
    });
  }

  defaultDashboard(item: Dashboard, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const newDashboardId = item.Id !== 'generated' ? item.Id : undefined;
    this.controllerService.updateControllerDefaultDashboard(this.controllerResponse, newDashboardId).subscribe((success) => {
      if (!success) {
        return;
      }

      this.controllerResponse.DefaultDashboardId = newDashboardId;
      const c = this.controllerResponse;
      this.fuseNav.updateNavigationItem(`dashboard${c.Id}`, {
        url: `/controller/${c.Id}/dashboard/${c.DefaultDashboardId ? c.DefaultDashboardId : 'generated'}`
      });
    });
  }

  saveDashboard() {
    const newDashboardRequest = this.dashboard.AsFullRequest;
    newDashboardRequest.Id = undefined;
    newDashboardRequest.Name = '';
    newDashboardRequest.Items.forEach((item) => {
      item.Id = undefined;
      item.DashboardId = undefined;
    });

    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { dashboard: newDashboardRequest },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(SaveDashboardDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: Dashboard) => {
      if (!result) {
        return;
      }
      this.dashboardType = 'Controller';
      this.dashboardService.clearGeneratedDashboard();
      this.dashboards.push(result);
      this.loadDashboard(result);
    });
  }

  protected loadAllData(): void {
    if (!this.dashboard || this.dashboardType !== 'Organization') {
      return;
    }

    this.killTimers();
    this.runTimers = true;

    this.loadSensorReadings();
    this.loadDeviceStates();
    this.loadSensorSummaries();
    this.startLoadTaskStates();
  }

  protected startLoadSensorReadings(): void {
    if (this.timer2) {
      window.clearTimeout(this.timer2);
    }
    if (this.runTimers) {
      this.timer2 = window.setTimeout(() => {
        this.loadSensorReadings();
      }, this.refreshRate);
    }
  }
  protected startLoadSensorSummaries(): void {
    if (this.timer3) {
      window.clearTimeout(this.timer3);
    }
    if (this.runTimers) {
      this.timer3 = window.setTimeout(() => {
        this.loadSensorSummaries();
      }, 60000 * 5);
    }
  }
  protected startLoadDeviceStates(): void {
    if (this.timer1) {
      window.clearTimeout(this.timer1);
    }
    if (this.runTimers) {
      this.timer1 = window.setTimeout(() => {
        this.loadDeviceStates();
      }, this.refreshRate);
    }
  }
  protected startLoadTaskStates(): void {
    if (this.timer4) {
      window.clearTimeout(this.timer4);
    }
    if (this.runTimers) {
      this.timer4 = window.setTimeout(() => {
        this.loadTaskStates();
      }, this.refreshRate);
    }
  }

  protected loadSensorReadings(): void {
      this.controllerService.getOrgDashboardReadings().subscribe(
        (r) => {
          this.updateOrgFormattedReadings(r);
          this.startLoadSensorReadings();
        },
        (err) => {
          this.handleErrors(err);
          this.startLoadSensorReadings();
        }
      );
  }

  private updateOrgFormattedReadings(readings: OrgDashboardControllerResponse[]) {
    readings.forEach((c) => {
      c.OrgDashboardReadings.forEach((reading) => {
        const sensors = this.allSensors.filter((sens) => sens.deviceId === reading.SensorId);
        const sensorOption = this.sensorOptions.find(
          (sens) => sens.sensor.Guid === reading.SensorId
        );
        if (!sensors.length || !sensorOption) {
          return;
        }
        for (const sensor of sensors) {
          this.updateSensorFormattedReadings(sensor, reading, sensorOption.controller);
        }
      });
    });

    this.anyAlerts = this.allSensors.some((sensor) => !!sensor.activeAlerts.value.length);
    this.updateRefreshRate();
  }

  protected loadSensorSummaries(): void {
    const newMin = new Map<string, number>();
    const newMax = new Map<string, number>();
    this.allSensors.forEach((sens) => {
      newMin.set(sens.deviceId, Number.MAX_VALUE);
      newMax.set(sens.deviceId, Number.MIN_VALUE);
    });

    const controllerGuids = this.allSensors.reduce((all, sensor) => {
      if (!all.find((exist) => exist === sensor.controllerId)) {
        all.push(sensor.controllerId);
      }

      return all;
    }, new Array<string>());

    this.getSensorSummaries(controllerGuids, newMin, newMax);
    this.startLoadSensorSummaries();
  }

  protected loadTaskStates(): void {
    this.controllerService.getOrgManualTaskStates(this.org, this.dashboard.Id).subscribe(
      (r) => {
        this.updateTaskStates(r);
        this.startLoadTaskStates();
      },
      (err) => {
        this.handleErrors(err);
        this.startLoadTaskStates();
      }
    );
}

get activeRuleGroup(): Observable<RuleGroupResponse> {
    return this.activeControllerService.ActiveRuleGroup;
  }

  get activeDosingRecipes(): Observable<DosingRecipeResponse[]> {
    return this.activeControllerService.DosingRecipeStates.pipe(
      map(states => {
        const result = new Array<DosingRecipeResponse>();
        if (!states) {
          return result;
        }

        states.r.forEach(r => {
          if (r.s !== ParticleDeviceState.AutoOn) { return; }
          const recipes = [...this.controller.DosingRecipes, ...this.controller.SharedDosingRecipes];
          const recipe = recipes.find(dr => dr.DatabaseId === r.id);

          if (recipe) {
            result.push(recipe);
          }
        });

        return result;
      })
    );
  }

  get hasActiveDosingRecipes(): Observable<boolean> {
    return this.activeDosingRecipes.pipe(map(recipes => recipes.length > 0));
  }
  get activeDosingRecipeNames(): Observable<string> {
    return this.activeDosingRecipes.pipe(map(recipes => recipes.map(r => r.Name).join(', ')));
  }

  get allSensors(): SensorRealTimeModel[] {
    if (!this.dashboard || !this.dashboard.Items || !this.dashboard.Items.length) {
      return [];
    }

    return this.dashboard.Items.filter((item) => !!item.sensor).reduce(
      (all, dbItem) => all.concat(dbItem.sensor),
      new Array<SensorRealTimeModel>()
    );
  }
  get allDevices(): DeviceModel[] {
    if (!this.dashboard || !this.dashboard.Items || !this.dashboard.Items.length) {
      return [];
    }

    return this.dashboard.Items.filter((item) => !!item.device).reduce(
      (all, dbItem) => all.concat(dbItem.device),
      new Array<DeviceModel>()
    );
  }

  protected loadCharts(): void {
    if (!this.dashboard) {
      return;
    }

    const controllers = new Array<{ Guid: string; TimeZone: string }>();
    if (this.dashboardType === 'Controller') {
      controllers.push({ Guid: this.controller.Guid, TimeZone: this.controller.TimeZoneId });
    }
    if (this.dashboardType === 'Organization') {
      const allGuids = this.allSensors.reduce((all, sensor) => {
        if (!all.find((exist) => exist.Guid === sensor.controllerId)) {
          const sensorController = this.allControllers.find((c) => c.Guid === sensor.controllerId);
          if (sensorController) {
            all.push({ Guid: sensorController.Guid, TimeZone: sensorController.TimeZoneId });
          }
        }

        return all;
      }, new Array<{ Guid: string; TimeZone: string }>());

      controllers.push(...allGuids);
    }

    this.chartsLoading = true;
    controllers.forEach((controller) => {
      this.chartDataPointService
        .getChartData(controller.Guid, this.dashboard.ChartDuration)
        .subscribe(
          (d) => this.createChartData(d, controller.TimeZone),
          (err) => this.handleErrors(err)
        );
    });
  }

  protected loadDeviceStates(): void {
      this.controllerService.getOrgDashboardStates().subscribe(
        (r) => {
          this.updateOrgDeviceStates(r);
          this.startLoadDeviceStates();
        },
        (err) => {
          this.handleErrors(err);
          this.startLoadDeviceStates();
        }
      );
  }

  private updateOrgDeviceStates(states: OrgDashboardControllerDevicesResponse[]) {
    states.forEach((c) => {
      c.OrgDashboardDeviceStates.forEach((state) => {
        const device = this.allDevices.find((dev) => dev.deviceId === state.DeviceId);
        const deviceOption = this.deviceOptions.find((dev) => dev.device.Guid === state.DeviceId);
        if (!device || !deviceOption) {
          return;
        }

        this.updateDeviceState(device, state);
      });
    });

    this.updateRefreshRate();
  }

  private updateDeviceStates(states: ParticleDeviceStateResponse[]): void {
    if (!states || !states.length) {
      return;
    }

    for (const device of this.allDevices) {
      const state = states.find((s) => s.sn === device.moduleSerialNumber);
      this.updateDeviceState(device, state);
    }

    this.updateRefreshRate();
  }

  private updateTaskStates(states: ParticleManualTaskState[]): void {
    if (!this.dashboard || !states) {
      return;
    }

    for (const item of this.dashboard.Items) {
      if (item.type !== 'task' || !item.task) {
        continue;
      }

      const taskState = states.find(state => state.id === item.task.id);
      if (taskState && item.task.lastUpdate && item.task.lastUpdate === taskState.ts) {
        continue;
      }
      item.task.remaining = taskState ? taskState.d - (taskState.ts || moment().unix()) : null;
      item.task.lastUpdate = taskState ? taskState.ts : null;
    }
  }

  private getCurrentDashboardPosition(currentView = true): GenerationStatus {
    const grid = document.getElementById('grid');
    const columnWidth = DashboardColumnWidth + 10;
    const rowHeight = DashboardRowHeight + 10;
    const curViewX = currentView ? Math.round(grid.scrollLeft / columnWidth) : 0;
    const curViewY = currentView ? Math.round(grid.scrollTop / rowHeight) : 0;

    const availWidth = this.hostElement.nativeElement.clientWidth;
    const availColumns = Math.floor(availWidth / columnWidth);

    const curPos: GenerationStatus = {
      x: curViewX,
      y: curViewY,
      id: 0,
      availColumns
    };

    return curPos;
  }

  private generateDashboard(): Dashboard {
    // console.log('generateDashboard');

    const genDashboard = new Dashboard();
    genDashboard.Id = 'generated';
    genDashboard.Name = 'Default';
    genDashboard.ContainerId = this.controller.Guid;
    genDashboard.ChartDuration = 10;

    const curPos = this.getCurrentDashboardPosition(false);
    this.generateSensorsSection(genDashboard, curPos);
    this.generateDevicesSection(genDashboard, curPos);
    this.generateGroupsSection(genDashboard, curPos);
    this.generateTasksSection(genDashboard, curPos);

    // console.log('generatedDashboard', genDashboard);

    return genDashboard;
  }

  private generateSensorsSection(
    genDashboard: Dashboard,
    curPos: GenerationStatus
  ) {
    if (this.sensorModules.length < 1) {
      return;
    }

    const widgetW = this.prefersGauges ? 3 : 4;
    const widgetH = this.prefersGauges ? 6 : 4;
    const widgetType: DashboardItemType = this.prefersGauges ? 'gauge' : 'chart';

    this.sensorModules.forEach((module) => {
      if (this.groupModules.some(groupMod => groupMod.id === module.id)) {
        return;
      }

      const moduleLabel = new DashboardItemResponse({
        Id: curPos.id.toString(),
        DashboardId: genDashboard.Id,
        Type: 'label',
        CustomName: module.name,
        X: 0,
        Y: curPos.y,
        Layer: 5,
        W: curPos.availColumns,
        Options: {
          FontSize: 'large',
          Underline: false,
          Bold: false,
          Align: 'left',
        },
      });
      genDashboard.Items.push(new DashboardItem(moduleLabel));
      curPos.x = 0;
      curPos.y++;
      curPos.id++;

      module.sensors.forEach((sensor) => {
        const sensorWidget = new DashboardItemResponse({
          Id: curPos.id.toString(),
          DashboardId: genDashboard.Id,
          Type: widgetType,
          X: curPos.x,
          Y: curPos.y,
          Layer: 5,
          SensorId: sensor.id,
        });
        genDashboard.Items.push(new DashboardItem(sensorWidget));
        curPos.id++;
        curPos.x += widgetW;
        if (curPos.x + widgetW > curPos.availColumns) {
          curPos.x = 0;
          curPos.y += widgetH;
        }
      });
      if (curPos.x !== 0) {
        curPos.x = 0;
        curPos.y += widgetH;
      }
    });
  }
  private generateDevicesSection(
    genDashboard: Dashboard,
    curPos: GenerationStatus
  ) {
    if (this.deviceModules.length + this.groupedSingleDevices.length < 1) {
      return;
    }

    this.deviceModules.forEach((module) => {
      if (this.groupModules.some(groupMod => groupMod.id === module.id)) {
        return;
      }

      const moduleLabel = new DashboardItemResponse({
        Id: curPos.id.toString(),
        DashboardId: genDashboard.Id,
        Type: 'label',
        CustomName: module.name,
        X: 0,
        Y: curPos.y,
        Layer: 5,
        W: curPos.availColumns,
        Options: {
          FontSize: 'large',
          Underline: false,
          Bold: false,
          Align: 'left',
        },
      });
      genDashboard.Items.push(new DashboardItem(moduleLabel));
      curPos.id++;
      curPos.x = 0;
      curPos.y++;

      let rowsUsed = 0;
      module.devices.forEach((device) => {
        const deviceWidgetConfig = new DashboardItemResponse({
          Id: curPos.id.toString(),
          DashboardId: genDashboard.Id,
          Type: 'device',
          X: curPos.x,
          Y: curPos.y,
          Layer: 5,
          DeviceId: device.id,
        });

        const actualDevice = this.deviceOptions.find((devOpt) => devOpt.device.Guid === device.id);
        const deviceWidget = new DashboardItem(deviceWidgetConfig);
        deviceWidget.createDeviceModel(
          this.controller,
          module.productType,
          actualDevice.device,
          actualDevice.module
        );

        genDashboard.Items.push(deviceWidget);
        curPos.id++;
        curPos.x += 3;
        rowsUsed = Math.max(rowsUsed, deviceWidget.rows);
        if (curPos.x + 3 > curPos.availColumns) {
          curPos.x = 0;
          curPos.y += rowsUsed;
          rowsUsed = 0;
        }
      });
      if (curPos.x !== 0) {
        curPos.x = 0;
        curPos.y += rowsUsed;
      }
    });

    this.groupedSingleDevices.forEach((groupedDevices) => {
      const productTypeLabel = new DashboardItemResponse({
        Id: curPos.id.toString(),
        DashboardId: genDashboard.Id,
        Type: 'label',
        CustomName: `${groupedDevices.productType}s`,
        X: 0,
        Y: curPos.y,
        Layer: 5,
        W: curPos.availColumns,
        Options: {
          FontSize: 'large',
          Underline: false,
          Bold: false,
          Align: 'left',
        },
      });
      genDashboard.Items.push(new DashboardItem(productTypeLabel));
      curPos.id++;
      curPos.x = 0;
      curPos.y++;

      let rowsUsed = 0;
      groupedDevices.devices.forEach((device) => {
        const deviceWidgetConfig = new DashboardItemResponse({
          Id: curPos.id.toString(),
          DashboardId: genDashboard.Id,
          Type: 'device',
          X: curPos.x,
          Y: curPos.y,
          Layer: 5,
          DeviceId: device.id,
        });

        const actualDevice = this.deviceOptions.find((devOpt) => devOpt.device.Guid === device.id);
        const productType = this.productsService.FindProductType(actualDevice.productType);
        const deviceWidget = new DashboardItem(deviceWidgetConfig);
        deviceWidget.createDeviceModel(
          this.controller,
          productType,
          actualDevice.device,
          actualDevice.module
        );

        genDashboard.Items.push(deviceWidget);
        curPos.id++;
        curPos.x += 3;
        rowsUsed = Math.max(rowsUsed, deviceWidget.rows);
        if (curPos.x + 3 > curPos.availColumns) {
          curPos.x = 0;
          curPos.y += rowsUsed;
          rowsUsed = 0;
        }
      });
      if (curPos.x !== 0) {
        curPos.x = 0;
        curPos.y += rowsUsed;
      }
    });
  }
  private generateGroupsSection(
    genDashboard: Dashboard,
    curPos: GenerationStatus
  ) {
    if (this.groupedModules.length < 1) {
      return;
    }

    const widgetW = this.prefersGauges ? 3 : 4;
    const widgetH = this.prefersGauges ? 6 : 4;
    const widgetType: DashboardItemType = this.prefersGauges ? 'gauge' : 'chart';

    this.groupedModules.forEach((group) => {
      if (!group.devices.length && !group.sensors.length) {
        return;
      }

      const moduleLabel = new DashboardItemResponse({
        Id: curPos.id.toString(),
        DashboardId: genDashboard.Id,
        Type: 'label',
        CustomName: group.groupName,
        X: 0,
        Y: curPos.y,
        Layer: 5,
        W: curPos.availColumns,
        Options: {
          FontSize: 'large',
          Underline: false,
          Bold: false,
          Align: 'left',
        },
      });
      genDashboard.Items.push(new DashboardItem(moduleLabel));
      curPos.x = 0;
      curPos.y++;
      curPos.id++;

      group.sensors.forEach((sensor) => {
        const sensorWidget = new DashboardItemResponse({
          Id: curPos.id.toString(),
          DashboardId: genDashboard.Id,
          Type: widgetType,
          X: curPos.x,
          Y: curPos.y,
          Layer: 5,
          SensorId: sensor.id,
        });
        genDashboard.Items.push(new DashboardItem(sensorWidget));
        curPos.id++;
        curPos.x += widgetW;
        if (curPos.x + widgetW > curPos.availColumns) {
          curPos.x = 0;
          curPos.y += widgetH;
        }
      });
      if (curPos.x !== 0) {
        curPos.x = 0;
        curPos.y += widgetH;
      }
      let rowsUsed = 0;
      group.devices.forEach((device) => {
        const deviceWidgetConfig = new DashboardItemResponse({
          Id: curPos.id.toString(),
          DashboardId: genDashboard.Id,
          Type: 'device',
          X: curPos.x,
          Y: curPos.y,
          Layer: 5,
          DeviceId: device.id,
        });

        const actualDevice = this.deviceOptions.find((devOpt) => devOpt.device.Guid === device.id);
        const actualProductType = this.productsService.FindProductType(actualDevice.module.ProductType);
        const deviceWidget = new DashboardItem(deviceWidgetConfig);
        deviceWidget.createDeviceModel(
          this.controller,
          actualProductType,
          actualDevice.device,
          actualDevice.module
        );

        genDashboard.Items.push(deviceWidget);
        curPos.id++;
        curPos.x += 3;
        rowsUsed = Math.max(rowsUsed, deviceWidget.rows);
        if (curPos.x + 3 > curPos.availColumns) {
          curPos.x = 0;
          curPos.y += rowsUsed;
          rowsUsed = 0;
        }
      });
      if (curPos.x !== 0) {
        curPos.x = 0;
        curPos.y += rowsUsed;
      }
    });
  }
  private generateTasksSection(
    genDashboard: Dashboard,
    curPos: GenerationStatus
  ) {
    if (this.manualTasks.length < 1) {
      return;
    }

    const tasksLabel = new DashboardItemResponse({
      Id: curPos.id.toString(),
      DashboardId: genDashboard.Id,
      Type: 'label',
      CustomName: 'Manual Tasks',
      X: 0,
      Y: curPos.y,
      Layer: 5,
      W: curPos.availColumns,
      Options: {
        FontSize: 'normal',
        Underline: true,
        Bold: false,
        Align: 'left',
      },
    });
    genDashboard.Items.push(new DashboardItem(tasksLabel));
    curPos.id++;
    curPos.x = 0;
    curPos.y++;

    this.manualTasks.forEach((task) => {
      const taskWidget = new DashboardItemResponse({
        Id: curPos.id.toString(),
        DashboardId: genDashboard.Id,
        Type: 'task',
        X: curPos.x,
        Y: curPos.y,
        Layer: 5,
        TaskId: task.id,
      });
      genDashboard.Items.push(new DashboardItem(taskWidget));
      curPos.id++;
      curPos.x += 3;
      if (curPos.x + 3 > curPos.availColumns) {
        curPos.x = 0;
        curPos.y += 2;
      }
    });
    if (curPos.x !== 0) {
      curPos.x = 0;
      curPos.y += 2;
    }
  }
  private initModules(): void {
    if (!this.controller.Modules) {
      return;
    }
    this.modules = [];
    // this.devices = [];
    this.motorDevices = [];

    // First, identify all the motor control devices, so we can ignore them all
    for (const module of this.controller.Modules) {
      if (!module.MotorControl) {
        continue;
      }

      if (!this.motorDevices.find((devId) => devId === module.MotorControl.OpenDeviceId)) {
        this.motorDevices.push(module.MotorControl.OpenDeviceId);
      }
      if (!this.motorDevices.find((devId) => devId === module.MotorControl.CloseDeviceId)) {
        this.motorDevices.push(module.MotorControl.CloseDeviceId);
      }
    }
    // Then, populate the shown items, hiding modules requested as hidden,
    // and devices that are rolled up into motor controls
    for (const mod of this.controller.Modules) {
      if (mod.IsHidden) {
        continue;
      }

      const moduleModel: ModuleEntity = {
        name: mod.Name,
        id: mod.Guid,
        groupName: mod.GroupName,
        sensors: [],
        devices: [],
        productType: this.productsService.FindProductType(mod.ProductType),
      };

      if (!moduleModel.productType) {
        console.error('No Product found', mod.ProductType);
        continue;
      }

      for (const device of mod.Devices) {
        if (device.DeviceType === DeviceTypes.NotInUse) {
          continue;
        }
        if (this.motorDevices.find((devId) => devId === device.Guid)) {
          continue;
        }
        const deviceModel: NamedEntity = {
          name: device.Name,
          id: device.Guid,
        };
        moduleModel.devices.push(deviceModel);
      }

      const sensors = mod.Sensors.filter(
        (s) =>
          s.ParticleSensor !== ParticleSensor.Voltage &&
          s.ParticleSensor !== ParticleSensor.Amperage
      );
      for (const sensor of sensors) {
        const sensorModel: NamedEntity = {
          name: sensor.Name,
          id: sensor.Guid,
        };
        moduleModel.sensors.push(sensorModel);
      }

      this.modules.push(moduleModel);
    }

    this.sensorModules = this.modules.filter((m) => m.sensors.length > 0);
    this.deviceModules = this.modules.filter(
      (m) => !m.productType.IsSingleDevice && m.devices.length
    );
    this.singleDeviceModules = this.modules.filter(
      (m) => m.productType.IsSingleDevice && m.devices.length
    );
    this.groupModules = this.modules.filter(
      (m) => m.groupName && m.groupName.length
    );
    this._allSensors = this.modules.reduce(
      (all, mod) => all.concat(mod.sensors),
      new Array<NamedEntity>()
    );
    this._allDevices = this.modules.reduce(
      (all, mod) => all.concat(mod.devices),
      new Array<NamedEntity>()
    );
    this.groupedModules = this.groupModules.reduce((all, mod) => {
      let exist = all.find((ex) => ex.groupName === mod.groupName);
      if (!exist) {
        exist = {
          groupName: mod.groupName,
          sensors: new Array<NamedEntity>(),
          devices: new Array<NamedEntity>()
        };
        all.push(exist);
      }

      exist.sensors.push(...mod.sensors);
      exist.devices.push(...mod.devices);

      return all;
    }, new Array<GroupedEntities>());
    this.groupedSingleDevices = this.singleDeviceModules.reduce((all, mod) => {
      let exist = all.find((ex) => ex.productType === mod.productType.Description);
      if (!exist) {
        exist = { productType: mod.productType.Description, devices: new Array<NamedEntity>() };
        all.push(exist);
      }

      exist.devices.push(mod.devices[0]);

      return all;
    }, new Array<GroupedDevices>());
  }

  private initManualTasks() {
    this.manualTasks = [];

    if (!this.controller.Modules || !this.controller.ManualTasks) {
      return;
    }

    const sharedDevices = this.controller.SharedModules.reduce(
      (all, mod) => all.concat(mod.Devices),
      new Array<DeviceResponse>()
    );
    const devices = sharedDevices.concat(
      this.controller.Modules.reduce(
        (all, mod) => all.concat(mod.Devices),
        new Array<DeviceResponse>()
      )
    );

    this.controller.ManualTasks.forEach((taskRule) => {
      const ruleGroup = this.controller.RuleGroups.find((rg) => rg.Id === taskRule.RuleGroupId);
      if (!ruleGroup || !ruleGroup.IsActive || !taskRule.IsActive) {
        return;
      }
      const deviceIds = [taskRule.DeviceId, ...taskRule.AdditionalDeviceIds];
      const deviceNames = deviceIds.map((id) => {
        const device = devices.find((dev) => dev.Guid === id);
        return device ? device.Name : 'UNKNOWN DEVICE';
      });
      const task: NamedEntity = {
        id: taskRule.Id,
        name: taskRule.DisplayName ? taskRule.DisplayName : deviceNames.join(', '),
      };

      this.manualTasks.push(task);
    });

    this.manualTasks.sort((a, b) => a.name.localeCompare(b.name));
  }

  private updateRefreshRate() {
    const outdated = this.allSensors.some((sens) => sens.outdated) || this.allDevices.some((dev) => dev.outdated);
    const needsUpdate = this.allSensors.some((sens) => sens.needsUpdate) || this.allDevices.some((dev) => dev.needsUpdate);
    const dbAge = moment().unix() - this.dashboardOpened;
    const supportsStreaming = this.controller && this.controller.FirmwareVersion < 999;
    const refreshRate = this.isIdle ?
      (supportsStreaming ? 5 * 60 * 1000 : 30000) :
      (outdated ? 1000 : 3000);
    if (this.dashboardType === 'Controller') {
      this.activeControllerService.updateRefreshRate(refreshRate);
      if (supportsStreaming) {
        const sanityRefreshRate = this.isIdle ? (5 * 60 * 1000) : ((outdated && dbAge < 30) || needsUpdate ? 1000 : 120000);
        this.activeControllerService.updateSanityRefreshRate(sanityRefreshRate);
      } else {
        this.activeControllerService.updateSanityRefreshRate(outdated ? 1000 : 3000);
      }
    } else {
      this.refreshRate = outdated ? 10000 : 30000;
    }
  }
}

export interface ModuleOption {
  controller: Controller;
  module: ModuleResponse;
  productType: number;
}

export interface SensorOption {
  controller: Controller;
  module: ModuleResponse;
  sensor: SensorResponse;
  productType: number;
}

export interface DeviceOption {
  controller: Controller;
  module: ModuleResponse;
  device: DeviceResponse;
  productType: number;
}

export interface ManualTaskOption {
  controller: Controller;
  task: ManualTaskResponse;
}

interface NamedEntity {
  id: string;
  name: string;
}
interface ModuleEntity extends NamedEntity {
  groupName?: string;
  productType: ProductTypeResponse;
  sensors: NamedEntity[];
  devices: NamedEntity[];
}
interface GroupedDevices {
  productType: string;
  devices: NamedEntity[];
}
interface GroupedEntities {
  groupName: string;
  sensors: NamedEntity[];
  devices: NamedEntity[];
}
