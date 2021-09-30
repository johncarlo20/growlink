import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataSource } from '@angular/cdk/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  Controller,
  ModuleResponse,
  SensorResponse,
  DeviceResponse,
  ParticleSensor,
  ParticleDevice,
  DeviceTypes,
  ProductTypeResponse,
  SensorAlertResponse,
  ParticleSensorResponse,
  SelectItem,
} from '@models';
import { ControllerService, ProgressBarService, ProductTypesService, DeviceTypesService, ParticleSensorsService, ParticleDevicesService } from '@services';
import { ConfirmDeleteDialogOptions, ConfirmDeleteDialogComponent } from '../../../dialogs/confirm-delete-dialog.component';
import { EditModuleDialogComponent } from './edit-module-dialog.component';
import { EditSensorDialogComponent, EditSensorDialogModel } from './edit-sensor-dialog.component';
import { EditDeviceDialogComponent } from './edit-device-dialog.component';
import { EntityUpdatesComponent } from '../../../entity-updates/entity-updates.component';
import { UploadConfirmDialogComponent } from '../upload-confirm/upload-confirm-dialog.component';
import { BaseAPIComponent } from '@util';
import { AddModulesDialogComponent } from './add-modules-dialog.component';

@Component({
  selector: 'fuse-modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.scss'],
})
export class ModulesComponent extends BaseAPIComponent implements OnInit {
  isReadOnly = true;

  controller: Controller = new Controller();
  particleSensors: ParticleSensorResponse[] = [];
  modules = new ModulesDataSource();
  sensors = new SensorsDataSource();
  devices = new DevicesDataSource();

  displayedColumns: string[] = ['name', 'type', 'serial', 'actions'];
  sensorsColumns: string[] = ['sensorType', 'sensorSerial', 'name', 'sensorAdjust', 'actions'];
  devicesColumns: string[] = ['device', 'name', 'devType', 'actions'];

  selectedModule: ModuleResponse;

  hasNutrientModule = false;
  changes = false;

  private setDeviceTypeTimeout = -1;

  constructor(
    private router: Router,
    private controllerService: ControllerService,
    private productService: ProductTypesService,
    private deviceService: DeviceTypesService,
    private particleSensorService: ParticleSensorsService,
    private particleDevicesService: ParticleDevicesService,
    public dialog: MatDialog,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);
  }

  ngOnInit() {
    super.ngOnInit();

    this.subs.add(
      this.controllerService.currentContainer.subscribe(r => {
        this.updateController(r);
      })
    );
  }

  canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (!this.changes) {
      return true;
    }

    const config: MatDialogConfig = {
      data: { msg: 'There are changes that have been made to the modules which have not been uploaded to the controller.' },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(UploadConfirmDialogComponent, config);

    return dialogRef.afterClosed().pipe(
      tap((result: boolean) => {
        if (!result) {
          this.progressBarService.SetLoading(false);
        }
      })
    );
  }

  getTypeName(module: ModuleResponse): string {
    const productType = this.productService.FindProductType(module.ProductType);
    if (!productType) {
      return 'UNKNOWN';
    }
    if (module.IsAggregate) {
      return `${productType.Description} (Aggregate)`;
    }

    return productType.Description;
  }

  getSensorName(sensor: SensorResponse): string {
    return this.particleSensorService.FindParticleSensor(sensor.ParticleSensor).Description;
  }

  getAdjustment(sensor: SensorResponse): string {
    const particleSensor = this.particleSensors.find(ps => ps.Id === sensor.ParticleSensor);
    const allowManualAdjustment = particleSensor ? particleSensor.AllowManualAdjustment : false;
    if (
      !allowManualAdjustment ||
      !sensor.CalibrationIntercept
    ) {
      return '--';
    }

    let value = sensor.CalibrationIntercept.toFixed(1);
    if (value[value.length - 1] === '0') { value = sensor.CalibrationIntercept.toFixed(0); }

    return `${sensor.CalibrationIntercept > 0 ? '+' : ''}${value || 0}${
      sensor.ReadingSuffix
      }`;
  }

  getDevice(device: ParticleDevice): string {
    const particleDevice = this.particleDevicesService.FindParticleDevice(device);
    return particleDevice ? particleDevice.Description : 'UNKNOWN';
  }

  get ProductType(): ProductTypeResponse {
    if (!this.selectedModule) {
      return null;
    }

    return this.productService.FindProductType(this.selectedModule.ProductType);
  }

  getDosing(device: DeviceResponse): string {
    if (device.DeviceType !== DeviceTypes.DosingPump) {
      return '--';
    }

    return `${device.DosingRatio || 0}%`;
  }

  get isFixedDeviceProduct(): boolean {
    if (!this.ProductType) {
      return false;
    }

    const inlineDosing = this.controller.EnableInlineDosing;
    const isDosingModule = this.deviceService.isDosingModule(this.ProductType);
    const isFixedDevice = this.ProductType.IsFixedDevice;

    if (inlineDosing && isFixedDevice && isDosingModule) {
      return false;
    }

    return isFixedDevice;
  }

  selectModule(mod: ModuleResponse) {
    this.selectedModule = mod;
    if (mod) {
      this.sensors.update(mod.Sensors);
      this.devices.update(mod.Devices);
    }
    this.getSelectedModuleDeviceTypes();
  }

  editModule(mod: ModuleResponse) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const config: MatDialogConfig<{ mod: ModuleResponse; controller: Controller }> = {
      panelClass: 'edit-module-panel',
      minWidth: '70vw',
      data: { mod: mod, controller: this.controller },
    };
    const dialogRef = this.dialog.open(EditModuleDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: ModuleResponse) => {
      if (!result) {
        return;
      }

      if (mod.GrowMedium !== result.GrowMedium) {
        this.changes = true;
      }
      if (mod.SoilECType !== result.SoilECType) {
        this.changes = true;
      }
      if (mod.AggregateModuleId !== result.AggregateModuleId) {
        this.changes = true;
      }

      this.modules.replace(mod.Guid, result);
      const existModIdx = this.controller.Modules.findIndex(controllerMod => controllerMod.Guid === mod.Guid);
      if (existModIdx > -1) {
        this.controller.Modules.splice(existModIdx, 1, result);
      }

      this.modules.update(this.controller.Modules.filter(md => !md.MotorControl));
    });
  }

  deleteModule(mod: ModuleResponse, ev: MouseEvent) {
    this.ignoreClick(ev);

    if (this.isReadOnly || this.loading) {
      return;
    }

    const isController = mod.SerialNumber.toLowerCase() === this.controller.DeviceId.toLowerCase();
    if (isController) {
      this.deleteController();
      return;
    }

    const modIdx = this.controller.Modules.findIndex(exist => exist.Guid === mod.Guid);
    if (modIdx === -1) {
      return;
    }

    const existMod = this.controller.Modules[modIdx];
    const modSensors = existMod.Sensors.map(sens => sens.Guid);
    const modDevices = existMod.Devices.map(dev => dev.Guid);
    const modTriggers = this.controller.SensorTriggers
      .filter(trigger => modDevices.some(devId => devId === trigger.DeviceId) ||
        modDevices.some(devId => trigger.AdditionalDeviceIds.some(addId => addId === devId)) ||
        modSensors.some(sensId => sensId === trigger.SensorId));
    const modSchedules = this.controller.Schedules
      .filter(schedule => modDevices.some(devId => devId === schedule.DeviceId) ||
        modDevices.some(devId => schedule.AdditionalDeviceIds.some(addId => addId === devId)));
    const modTimers = this.controller.Timers
      .filter(timer => modDevices.some(devId => devId === timer.DeviceId) ||
        modDevices.some(devId => timer.AdditionalDeviceIds.some(addId => addId === devId)));
    const modTasks = this.controller.ManualTasks
      .filter(task => modDevices.some(devId => devId === task.DeviceId) ||
        modDevices.some(devId => task.AdditionalDeviceIds.some(addId => addId === devId)));
    const modAlerts = existMod.Sensors.reduce((all, sensor) => {
      return all.concat(sensor.Alerts.filter(alert => modSensors.some(sensId => sensId === alert.SensorId)));
    }, new Array<SensorAlertResponse>());
    const ruleCount = modTriggers.length + modSchedules.length + modTimers.length + modTasks.length + modAlerts.length;

    const data: ConfirmDeleteDialogOptions = {
      message: `Are you sure you want to delete module ${mod.Name}?`,
      heading: `Delete module ${mod.Name}`,
      warning: ruleCount ? `${ruleCount} rule${ruleCount !== 1 ? 's' : ''} attached to this module will be affected` : null,
    };

    const config: MatDialogConfig = { data };
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        return;
      }

      this.controllerService.deleteModule(mod.Guid).subscribe(
        () => {
          // Remove Sensor Triggers linked to Sensors/Devices on this module
          modTriggers.forEach(trigger => {
            trigger.AdditionalDeviceIds = trigger.AdditionalDeviceIds.filter(deviceId => !modDevices.some(devId => devId === deviceId));
            if (modDevices.some(devId => devId === trigger.DeviceId)) {
              trigger.DeviceId = trigger.AdditionalDeviceIds.length ? trigger.AdditionalDeviceIds.splice(0, 1)[0] : null;
            }
            if (modSensors.some(sensId => sensId === trigger.SensorId)) {
              trigger.SensorId = null;
            }
          });
          this.controller.SensorTriggers = this.controller.SensorTriggers
            .filter(trigger => trigger.DeviceId && trigger.SensorId);

          // Remove Timers linked to Devices on this module
          modTimers.forEach(timer => {
            timer.AdditionalDeviceIds = timer.AdditionalDeviceIds.filter(deviceId => !modDevices.some(devId => devId === deviceId));
            if (modDevices.some(devId => devId === timer.DeviceId)) {
              timer.DeviceId = timer.AdditionalDeviceIds.length ? timer.AdditionalDeviceIds.splice(0, 1)[0] : null;
            }
          });
          this.controller.Timers = this.controller.Timers
            .filter(timer => timer.DeviceId);
          // Remove Schedules linked to Devices on this module
          modSchedules.forEach(schedule => {
            schedule.AdditionalDeviceIds = schedule.AdditionalDeviceIds.filter(deviceId => !modDevices.some(devId => devId === deviceId));
            if (modDevices.some(devId => devId === schedule.DeviceId)) {
              schedule.DeviceId = schedule.AdditionalDeviceIds.length ? schedule.AdditionalDeviceIds.splice(0, 1)[0] : null;
            }
          });
          this.controller.Schedules = this.controller.Schedules
            .filter(schedule => schedule.DeviceId);
          // Remove Tasks linked to Devices on this module
          modTasks.forEach(task => {
            task.AdditionalDeviceIds = task.AdditionalDeviceIds.filter(deviceId => !modDevices.some(devId => devId === deviceId));
            if (modDevices.some(devId => devId === task.DeviceId)) {
              task.DeviceId = task.AdditionalDeviceIds.length ? task.AdditionalDeviceIds.splice(0, 1)[0] : null;
            }
          });
          this.controller.ManualTasks = this.controller.ManualTasks
            .filter(task => task.DeviceId);

          this.modules.remove(mod);
          this.controller.Modules.splice(modIdx, 1);
          if (this.selectedModule && this.selectedModule.Guid === mod.Guid) {
            this.selectModule(null);
          }

          this.changes = true;
        },
        error => this.handleError(error)
      );
    });
  }

  deleteController() {
    const moduleCount = this.controller.Modules.length - 1;
    const allSensors = this.controller.Modules
      .reduce((all, controllerModules) => all.concat(controllerModules.Sensors), new Array<SensorResponse>());
    const ruleCount = allSensors.reduce((count, sens) => count += sens.Alerts.length, 0) +
      this.controller.SensorTriggers.length +
      this.controller.Schedules.length +
      this.controller.Timers.length;

    const data: ConfirmDeleteDialogOptions = {
      message: `Are you sure you want to delete controller ${this.controller.Name}?
        This will also remove all associated modules and permanently delete any rules attached to this controller.`,
      heading: `Delete controller ${this.controller.Name}`,
      warning: moduleCount || ruleCount ?
        `${moduleCount} module${moduleCount !== 1 ? 's' : ''} and ${ruleCount} rule${ruleCount !== 1 ? 's' : ''}
        attached to this controller will also be deleted` : null,
    };

    const config: MatDialogConfig = { data };
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        return;
      }

      this.controllerService.deleteController(this.controller.Guid).subscribe(
        () => {
          this.controllerService.removeController(this.controller.Guid);
          this.router.navigate(['home']);
        },
        error => this.handleError(error)
      );
    });
  }

  editSensor(sensor: SensorResponse) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const particleSensor = this.particleSensors.find(ps => ps.Id === sensor.ParticleSensor);
    const config: MatDialogConfig<EditSensorDialogModel> = {
      panelClass: 'edit-module-panel',
      data: { sensor, module: this.selectedModule, controller: this.controller, particleSensor: particleSensor },
    };

    const dialogRef = this.dialog.open(EditSensorDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: SensorResponse) => {
      if (!result) {
        return;
      }

      if (sensor.CalibrationIntercept !== result.CalibrationIntercept) {
        this.changes = true;
      }

      this.sensors.replace(sensor.Guid, result);
    });
  }

  editDevice(dev: DeviceResponse) {
    if (this.isReadOnly || this.loading) {
      return;
    }
    const deviceTypes = this.getDeviceAvailTypes(dev);

    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: {
        device: dev,
        moduleId: this.selectedModule.Guid,
        deviceTypes,
        isFixedDevice: this.isFixedDeviceProduct,
        sharedController: this.controller.IsSharedController,
      },
    };

    const dialogRef = this.dialog.open(EditDeviceDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: DeviceResponse) => {
      if (!result) {
        return;
      }

      if (dev.DeviceType !== result.DeviceType) {
        this.changes = true;
      }
      if (result.MaxGallonsPerHour !== null && dev.MaxGallonsPerHour !== result.MaxGallonsPerHour) {
        this.changes = true;
      }

      this.devices.replace(dev.Guid, result);
    });
  }

  viewHistory(entityId: string, entityName: string) {
    const config: MatDialogConfig = {
      panelClass: 'entity-updates-panel',
      data: { entityId, entityName, controller: this.controller },
    };

    const dialogRef = this.dialog.open(EntityUpdatesComponent, config);

    dialogRef.afterClosed().subscribe(() => { });
  }

  setSensorName(ev: Event, sensor: SensorResponse): void {
    const input = ev.target as HTMLInputElement;
    input.disabled = true;

    const newSensor = { ...sensor, Name: input.value };
    this.controllerService.updateSensor(newSensor).subscribe(
      r => {
        this.showMessage(`Successfully updated sensor ${newSensor.Name}`);
        input.disabled = false;
        sensor.Name = input.value;
      },
      error => this.handleError(error)
    );
  }

  setDeviceName(ev: Event, device: DeviceResponse): void {
    const input = ev.target as HTMLInputElement;
    input.disabled = true;

    const newDevice = { ...device, Name: input.value, ModuleId: this.selectedModule.Guid };
    this.controllerService.updateDevice(newDevice).subscribe(
      r => {
        this.showMessage(`Successfully updated device ${newDevice.Name}`);
        input.disabled = false;
        device.Name = input.value;
      },
      error => this.handleError(error)
    );
  }
  setDeviceType(ev: MatSelectChange, device: DeviceResponse): void {
    if (device.DeviceType === ev.value) {
      window.clearTimeout(this.setDeviceTypeTimeout);
      return;
    }

    window.clearTimeout(this.setDeviceTypeTimeout);
    ((event: MatSelectChange, dev: DeviceResponse, moduleId: string) => {
      this.setDeviceTypeTimeout = window.setTimeout(() => {
        const input = event.source;
        input.disabled = true;

        const newDevice = { ...dev, DeviceType: event.value, ModuleId: moduleId };
        this.controllerService.updateDevice(newDevice).subscribe(
          r => {
            this.showMessage(`Successfully updated device ${newDevice.Name}`);
            input.disabled = false;
            device.DeviceType = event.value;
            this.changes = true;
          },
          error => this.handleError(error)
        );
      }, 1000);
    })(ev, device, this.selectedModule.Guid);
  }

  getSelectedModuleDeviceTypes() {
    if (!this.selectedModule.availTypes) {
      this.selectedModule.availTypes = this.deviceService.forSelectList(this.selectedModule.AvailableDeviceTypes);
    }
  }

  getDeviceAvailTypes(dev: DeviceResponse): SelectItem[] {
    if (dev.AvailableDeviceTypes && !dev.availTypes) {
      dev.availTypes = this.deviceService.forSelectList(dev.AvailableDeviceTypes);
    }
    if (dev.availTypes) {
      return dev.availTypes;
    }

    return this.selectedModule.availTypes;
  }

  showAvailableModules() {
    const config: MatDialogConfig = {
      panelClass: 'add-module-panel',
      data: {
        controller: this.controller
      },
    };

    const dialogRef = this.dialog.open(AddModulesDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        return;
      }

      this.changes = true;
      this.modules.update(this.controller.Modules.filter(mod => !mod.MotorControl));
    });
  }

  pushControllerUpdate() {
    if (!this.changes) {
      return;
    }

    this.controllerService.updateConfig().subscribe(
      r => {
        this.showMessage(`Controller Configuration updated`);
        this.changes = false;
        this.controllerService.setCurrentController(this.controller.Guid);
      },
      error => this.handleError(error)
    );
  }

  ignoreClick(ev: MouseEvent) {
    ev.cancelBubble = true;
  }

  private updateController(controller: Controller): void {
    this.progressBarService.SetCurrentPage([
      {
        icon: 'business',
        caption: controller.Name,
        url: ['controller', controller.Guid, 'dashboard'],
      },
      { icon: 'view_list', caption: 'Modules' },
    ]);

    if (controller.Guid === undefined) {
      return;
    }

    this.controller = controller;
    this.controller.Modules.forEach(m => {
      const moduleType = this.productService.FindProductType(m.ProductType);

      if (!moduleType.IsMultiDevice && m.Devices.length === 1) {
        m.Name = m.Devices[0].Name;
      }
    });

    // const cont = this.controllerService.allControllers.find(c => c.DeviceId === controller.DeviceId);
    this.isReadOnly = controller.isReadOnly;
    this.hasNutrientModule = controller.Modules.reduce((hasModule, mod) => {
      const productType = this.productService.FindProductType(mod.ProductType);

      return hasModule || productType.IsNutrientModule;
    }, false);

    this.particleSensorService.LoadControllerParticleSensors(controller).subscribe(result => {
      console.log('particleSensors', result.filter(ps => ps.AllowCalibrateToValue));
      this.particleSensors = result;
    });

    const currentModule = this.selectedModule;

    this.modules.update(this.controller.Modules.filter(mod => !mod.MotorControl));
    this.sensors.update([]);
    this.devices.update([]);

    this.selectedModule = null;

    const newModule = currentModule ? this.controller.Modules.find(m => m.Guid === currentModule.Guid) : null;
    if (newModule) {
      this.selectModule(newModule);
    }
  }
}

class ModulesDataSource implements DataSource<ModuleResponse> {
  private data: BehaviorSubject<ModuleResponse[]>;

  constructor(initialData?: ModuleResponse[]) {
    this.data = new BehaviorSubject<ModuleResponse[]>(initialData);
  }

  get Data(): Observable<ModuleResponse[]> {
    return this.data.asObservable();
  }

  connect(): Observable<ModuleResponse[]> {
    return this.data.asObservable();
  }

  update(newData?: ModuleResponse[]): void {
    this.data.next(newData);
  }

  disconnect(): void {
    this.data.complete();
  }

  replace(id: string, newMod: ModuleResponse) {
    const modIdx = this.data.value.findIndex(mod => mod.Guid === id);
    const newMods = [...this.data.value];
    newMods.splice(modIdx, 1, newMod);
    this.data.next(newMods);
  }

  remove(mod: ModuleResponse) {
    const curList = [...this.data.value];
    const modIdx = curList.findIndex(exist => exist.Guid === mod.Guid);
    if (modIdx > -1) {
      curList.splice(modIdx, 1);
      this.data.next(curList);
    }
  }
}

class SensorsDataSource implements DataSource<SensorResponse> {
  private data: BehaviorSubject<SensorResponse[]>;

  constructor(initialData: SensorResponse[] = []) {
    this.data = new BehaviorSubject<SensorResponse[]>(initialData);
  }

  get Data(): Observable<SensorResponse[]> {
    return this.data.asObservable();
  }
  get any(): boolean {
    return this.data.value.length > 0;
  }
  get count(): string {
    return this.data.value.length > 0 ? `${this.data.value.length} sensor(s)` : 'None';
  }

  connect(): Observable<SensorResponse[]> {
    return this.data.asObservable();
  }

  update(newData?: SensorResponse[]): void {
    this.data.next(newData);
  }

  disconnect(): void { }

  replace(id: string, newSens: SensorResponse) {
    const sensIdx = this.data.value.findIndex(sens => sens.Guid === id);
    const newSensors = [...this.data.value];
    newSensors.splice(sensIdx, 1, newSens);
    this.data.next(newSensors);
  }
}

class DevicesDataSource implements DataSource<DeviceResponse> {
  private data: BehaviorSubject<DeviceResponse[]>;

  constructor(initialData: DeviceResponse[] = []) {
    this.data = new BehaviorSubject<DeviceResponse[]>(initialData);
  }

  get Data(): Observable<DeviceResponse[]> {
    return this.data.asObservable();
  }
  get any(): boolean {
    return this.data.value.length > 0;
  }
  get count(): string {
    return this.data.value.length > 0 ? `${this.data.value.length} device(s)` : 'None';
  }

  connect(): Observable<DeviceResponse[]> {
    return this.data.asObservable();
  }

  update(newData?: DeviceResponse[]): void {
    this.data.next(newData);
  }

  disconnect(): void { }

  replace(id: string, newDev: DeviceResponse) {
    const devIdx = this.data.value.findIndex(dev => dev.Guid === id);
    const newDevices = [...this.data.value];
    newDevices.splice(devIdx, 1, newDev);
    this.data.next(newDevices);
  }
}
