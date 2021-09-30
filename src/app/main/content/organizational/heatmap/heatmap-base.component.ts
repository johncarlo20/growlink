import { OnInit, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DataSource } from '@angular/cdk/table';
import { interval } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import {
  ControllerService,
  ProgressBarService,
  HeatmapService,
  AuthenticationService,
} from '@services';
import { MappedSensor, MappedDevice } from '../org-rules/org-rules.models';
import { HeatmapConfiguration, HeatmapSensor, HeatmapGroup, DeviceTypes } from '@models';
import { BaseAPIComponent } from '@util';
import { HeatmapDevice } from '@models';
import { environment } from '../../../../../environments/environment';

const FONT_FAMILY = `'Muli', 'Helvetica Neue', 'Arial', sans-serif`;

@Component({template: ''})
export abstract class HeatmapBaseComponent extends BaseAPIComponent implements OnInit {
  organizationId: string;
  config: HeatmapConfiguration;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  img: HTMLImageElement;
  offActiveImage: HTMLImageElement;
  onActiveImage: HTMLImageElement;
  offAutoImage: HTMLImageElement;
  onAutoImage: HTMLImageElement;
  neutralAutoImage: HTMLImageElement;

  sensorList: MappedSensor[] = [];
  deviceList: MappedDevice[] = [];
  sensorDetails = new Map<string, SensorsDataSource>();
  deviceDetails = new Map<string, DevicesDataSource>();
  noDrawSensorId: string = null;
  noDrawDeviceId: string = null;

  sensorColumns = ['name', 'value'];
  deviceColumns = ['name', 'value'];
  dataColumns = ['name', 'value'];
  realTime = true;
  aspect = 1;

  constructor(
    protected route: ActivatedRoute,
    protected controllers: ControllerService,
    protected heatmaps: HeatmapService,
    protected auth: AuthenticationService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);
  }

  ngOnInit() {
    super.ngOnInit();

    this.subs.add(interval(30000).subscribe((n) => this.updateReadings()));
    this.subs.add(
      this.auth.OrganizationIdChanged.subscribe((orgId) => {
        this.organizationId = orgId;
      })
    );

    this.progressBarService.SetCurrentPage([
      { icon: 'insert_chart', caption: 'Heat Maps', url: ['org', 'heatmaps'] },
      { icon: 'settings', caption: 'Loading...' },
    ]);

    this.offActiveImage = document.createElement('img') as HTMLImageElement;
    this.offActiveImage.addEventListener('load', () => {
      this.drawHeatmap();
    });
    this.offActiveImage.setAttribute('src', '/assets/images/offactive.png');
    this.onActiveImage = document.createElement('img') as HTMLImageElement;
    this.onActiveImage.addEventListener('load', () => {
      this.drawHeatmap();
    });
    this.onActiveImage.setAttribute('src', '/assets/images/onactive.png');

    this.offAutoImage = document.createElement('img') as HTMLImageElement;
    this.offAutoImage.addEventListener('load', () => {
      this.drawHeatmap();
    });
    this.offAutoImage.setAttribute('src', '/assets/images/offauto.png');
    this.onAutoImage = document.createElement('img') as HTMLImageElement;
    this.onAutoImage.addEventListener('load', () => {
      this.drawHeatmap();
    });
    this.onAutoImage.setAttribute('src', '/assets/images/onauto.png');
    this.neutralAutoImage = document.createElement('img') as HTMLImageElement;
    this.neutralAutoImage.addEventListener('load', () => {
      this.drawHeatmap();
    });
    this.neutralAutoImage.setAttribute('src', '/assets/images/neutralauto.png');

    setTimeout(() => {
      this.controllers.getContainers(false).subscribe(
        (controllerList) => {
          controllerList.forEach((controller) => {
            controller.Modules.forEach((mod) => {
              mod.Sensors.forEach((sensor) => {
                this.sensorList.push(
                  Object.assign({}, sensor, { Module: mod, Controller: controller })
                );
              });
              mod.Devices.filter((dev) => dev.DeviceType !== DeviceTypes.NotInUse).forEach(
                (dev) => {
                  this.deviceList.push(
                    Object.assign({}, dev, { Module: mod, Controller: controller })
                  );
                }
              );
            });
          });

          this.sensorList = this.sensorList.reduce((all, sens) => {
            if (!all.find((exist) => exist.Guid === sens.Guid)) {
              all.push(sens);
            }

            return all;
          }, Array<MappedSensor>());
          this.deviceList = this.deviceList.reduce((all, dev) => {
            if (!all.find((exist) => exist.Guid === dev.Guid)) {
              all.push(dev);
            }

            return all;
          }, Array<MappedDevice>());

          this.updateSensorDetails();
          this.updateDeviceDetails();
          this.updateReadings();
        },
        (error) => this.handleError(error)
      );
    });
  }

  getSensorDetails(grpId: string): SensorsDataSource {
    if (!this.sensorDetails.has(grpId)) {
      this.sensorDetails.set(grpId, new SensorsDataSource([]));
    }

    return this.sensorDetails.get(grpId);
  }

  updateSensorDetails() {
    if (!this.config || !this.config.Groups) {
      return;
    }

    this.config.Groups.forEach((grp) => {
      const details = grp.Sensors.map((s) => {
        const sensorsLoaded = this.sensorList.length > 0;
        const sensorData = this.sensorList.find((exist) => exist.Guid === s.SensorId);
        const currentValue = s.currentValue === null ? '--' : `${s.currentValue} ${s.suffix}`;

        if (!sensorData) {
          if (!sensorsLoaded) {
            return { id: s.Id, name: 'Loading...', currentValue: 'Updating' };
          }
          return { id: s.Id, name: 'Sensor Not Found', currentValue: '--' };
        }

        return { id: s.Id, name: sensorData.Name, currentValue: currentValue };
      });
      if (!this.sensorDetails.has(grp.Id)) {
        this.sensorDetails.set(grp.Id, new SensorsDataSource(details));
      } else {
        this.sensorDetails.get(grp.Id).update(details);
      }
    });
  }

  getDeviceDetails(grpId: string): DevicesDataSource {
    if (!this.deviceDetails.has(grpId)) {
      this.deviceDetails.set(grpId, new DevicesDataSource([]));
    }

    return this.deviceDetails.get(grpId);
  }

  updateDeviceDetails() {
    if (!this.config || !this.config.Groups) {
      return;
    }

    this.config.Groups.forEach((grp) => {
      const details = grp.Devices.map((d) => {
        const devicesLoaded = this.deviceList.length > 0;
        const deviceData = this.deviceList.find((exist) => exist.Guid === d.DeviceId);
        const currentState =
          d.autoManual === null || d.currentState === null
            ? 'Updating...'
            : `${d.autoManual ? 'Manual' : 'Auto'}-${d.currentState ? 'On' : 'Off'} ${
                d.throttle ? '(' + d.throttle.toFixed(0) + '%)' : ''
              }`;

        if (!deviceData) {
          if (!devicesLoaded) {
            return { id: d.Id, name: 'Loading...', currentState: '--' };
          }

          return { id: d.Id, name: 'Device Not Found', currentState: '--' };
        }

        return { id: d.Id, name: deviceData.Name, currentState };
      });
      if (!this.deviceDetails.has(grp.Id)) {
        this.deviceDetails.set(grp.Id, new DevicesDataSource(details));
      } else {
        this.deviceDetails.get(grp.Id).update(details);
      }
    });
  }

  loadHeatmap() {
    this.img = document.createElement('img') as HTMLImageElement;
    this.canvas = document.getElementById('heatmap-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.img.addEventListener('load', () => {
      this.config.width = this.img.naturalWidth;
      this.config.height = this.img.naturalHeight;

      this.canvas.width = this.img.naturalWidth;
      this.canvas.height = this.img.naturalHeight;

      this.aspect = Math.floor(this.canvas.width / this.canvas.clientWidth);

      this.loaded();

      this.drawHeatmap();
    });
    this.img.setAttribute('src', this.environmentAPI(this.config.BackgroundImageUrl));
    this.config.Groups.forEach((grp, idx) => {
      grp.Devices.forEach((dev) => dev.loadImage(() => this.drawHeatmap()));
      if (idx === 0) {
        grp.IsActive = true;
      } else {
        grp.IsActive = false;
      }
    });
  }

  protected loaded() {}

  protected markGroupActive(active: boolean, group: HeatmapGroup) {
    group.IsActive = active;
    if (group.IsActive) {
      this.config.Groups.filter((grp) => grp.Id !== group.Id).forEach((grp) => {
        grp.IsActive = false;
      });
    }
    this.drawHeatmap();
  }
  setGroupActive(ev: MatSlideToggleChange, group: HeatmapGroup) {
    this.markGroupActive(ev.checked, group);
  }

  ignoreClick(ev: MouseEvent) {
    ev.cancelBubble = true;
  }

  protected NaNGradient(sensor: HeatmapSensor) {
    const grd = this.ctx.createRadialGradient(
      sensor.xCenter,
      sensor.yCenter,
      5,
      sensor.xCenter,
      sensor.yCenter,
      Math.min(sensor.width, sensor.height)
    );
    const stop1 = `rgba(128, 128, 128, 0.6)`;
    const stop2 = `rgba(128, 128, 128, 0.23)`;
    grd.addColorStop(0, stop1);
    grd.addColorStop(0.9, stop2);
    grd.addColorStop(1, stop2);

    this.ctx.fillStyle = grd;
  }
  protected ValueGradient(sensor: HeatmapSensor, grp: HeatmapGroup) {
    const grd = this.ctx.createRadialGradient(
      sensor.xCenter,
      sensor.yCenter,
      5,
      sensor.xCenter,
      sensor.yCenter,
      Math.min(sensor.width, sensor.height)
    );
    const valuePercentage = Math.min(
      1.0,
      Math.max(0.0, (sensor.currentValue - grp.MinReading) / grp.Range)
    );
    const blueComp = 1.0 - valuePercentage * 2.0;
    const redComp = (valuePercentage - 0.5) * 2.0;
    const greenComp = 1.0 - Math.abs(valuePercentage - 0.5) * 2.0;
    const stop1 = `rgba(${redComp * 256}, ${greenComp * 256}, ${blueComp * 256}, 0.6)`;
    const stop2 = `rgba(${redComp * 256}, ${greenComp * 256}, ${blueComp * 256}, 0.23)`;
    grd.addColorStop(0, stop1);
    grd.addColorStop(0.9, stop2);
    grd.addColorStop(1, stop2);

    this.ctx.fillStyle = grd;
  }

  drawHeatmap() {
    if (!this.ctx) {
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);

    const fontAspect = Math.max(0.5, this.canvas.width / this.canvas.clientWidth);

    this.config.Groups.forEach((grp) => {
      if (!grp.IsActive) {
        return;
      }

      grp.Sensors.forEach((sensor) => {
        if (sensor.Id === this.noDrawSensorId) {
          return;
        }

        if (
          sensor.currentValue === null ||
          sensor.currentValue === undefined ||
          sensor.currentValue === NaN
        ) {
          this.NaNGradient(sensor);
        } else {
          this.ValueGradient(sensor, grp);
        }
        this.ctx.fillRect(sensor.LocationX0, sensor.LocationY0, sensor.width, sensor.height);

        const sensorModel = this.sensorList.find((s) => s.Guid === sensor.SensorId);
        const sensorText = sensor.currentValue ? `${sensor.currentValue} ${sensor.suffix}` : '';
        const sensorNameText = sensorModel ? `${sensorModel.Name}` : '...';
        this.ctx.fillStyle = 'black';
        this.ctx.textBaseline = 'top';
        this.ctx.font = `${fontAspect * 20}px ${FONT_FAMILY}`;
        const metrics = this.ctx.measureText(sensorText);
        const metricsName = this.ctx.measureText(sensorNameText);
        const textX = sensor.xCenter - metrics.width / 2;
        const textY = sensor.yCenter + this.aspect * 2;
        this.ctx.fillText(sensorText, textX, textY);

        const textNameX = sensor.xCenter - metricsName.width / 2;
        const textNameY = sensor.yCenter - 20 * fontAspect - 2;
        this.ctx.fillText(sensorNameText, textNameX, textNameY);
      });
      grp.Devices.forEach((device) => {
        if (device.Id === this.noDrawDeviceId) {
          return;
        }

        this.ctx.fillStyle = '#FFFFFFCC';
        this.ctx.fillRect(
          device.LocationX - 2,
          device.LocationY - 2,
          device.width + 4,
          device.height + 30 * this.aspect + 6
        );

        this.ctx.drawImage(
          device.image,
          device.LocationX,
          device.LocationY,
          device.Size,
          device.Size
        );

        let stateIcon: HTMLImageElement = null;
        switch (device.stateCode) {
          case 'unknown':
            stateIcon = this.neutralAutoImage;
            break;
          case 'offAuto':
            stateIcon = this.offAutoImage;
            break;
          case 'onAuto':
            stateIcon = this.onAutoImage;
            break;
          case 'offManual':
            stateIcon = this.offActiveImage;
            break;
          case 'onManual':
            stateIcon = this.onActiveImage;
            break;
          default:
            return;
        }
        this.ctx.drawImage(
          stateIcon,
          device.currentState ? device.LocationX + 2 : device.xCenter - 15 * this.aspect,
          device.LocationY + device.height + 2,
          30 * this.aspect,
          30 * this.aspect
        );
        if (device.throttle) {
          const throttleText = `${device.throttle.toFixed(0)}%`;
          this.ctx.fillStyle = 'black';
          this.ctx.textBaseline = 'top';
          this.ctx.font = `${fontAspect * 14}px ${FONT_FAMILY}`;
          const textStatusX = device.LocationX + 30 * this.aspect + 4;
          const textStatusY = device.LocationY + device.height + 10;
          this.ctx.fillText(throttleText, textStatusX, textStatusY);
        }

        this.ctx.fillStyle = 'black';
        this.ctx.textBaseline = 'top';
        this.ctx.font = `${fontAspect * 20}px ${FONT_FAMILY}`;
        const deviceModel = this.deviceList.find((d) => d.Guid === device.DeviceId);
        const deviceText = deviceModel ? deviceModel.Name : '...';
        const metrics = this.ctx.measureText(deviceText);
        const textX = device.xCenter - metrics.width / 2;
        const textY = device.LocationY - 20 * this.aspect - 2;
        this.ctx.fillText(deviceText, textX, textY);
      });
    });
  }

  environmentAPI(url: string) {
    if (!this.config || !this.config.Id) {
      return url;
    }

    return environment.api + url;
  }

  protected get allSensors() {
    if (!this.config || !this.config.Groups || !this.config.Groups.length) {
      return [];
    }

    return this.config.Groups.reduce(
      (all, grp) => all.concat(grp.Sensors),
      new Array<HeatmapSensor>()
    );
  }

  protected get allDevices() {
    if (!this.config || !this.config.Groups || !this.config.Groups.length) {
      return [];
    }

    return this.config.Groups.reduce(
      (all, grp) => all.concat(grp.Devices),
      new Array<HeatmapDevice>()
    );
  }

  protected updateReadings(): void {
    if (!this.config || !this.config.Groups || !this.config.Groups.length) {
      return;
    }

    this.updateSensorsValues();
    this.updateDevicesValues();
  }

  protected updateDevicesValues() {
    if (!this.realTime) {
      return;
    }

    this.controllers.getOrgDashboardStates().subscribe(
      (c) => {
        if (!this.realTime) {
          return;
        }

        c.forEach((controller) => {
          controller.OrgDashboardDeviceStates.forEach((reading) => {
            const device = this.deviceList.find((d) => d.Guid === reading.DeviceId);
            if (device) {
              const targetDevices = this.allDevices.filter((d) => d.DeviceId === device.Guid);
              targetDevices.forEach((targetDevice) => {
                targetDevice.currentState = reading.State;
                targetDevice.autoManual = reading.IsManual;
                targetDevice.throttle = reading.Throttle;
              });
            }
          });
        });
        this.updateDeviceDetails();
        this.drawHeatmap();
      },
      (error) => this.handleError(error)
    );
  }

  protected updateSensorsValues() {
    if (!this.realTime) {
      return;
    }

    this.controllers.getOrgDashboardReadings().subscribe(
      (c) => {
        if (!this.realTime) {
          return;
        }

        c.forEach((controller) => {
          controller.OrgDashboardReadings.forEach((reading) => {
            const sensor = this.sensorList.find((s) => s.Guid === reading.SensorId);
            if (sensor) {
              const targetSensors = this.allSensors.filter((s) => s.SensorId === sensor.Guid);
              targetSensors.forEach((targetSensor) => {
                targetSensor.currentValue = reading.Value;
                targetSensor.suffix = reading.Suffix;
              });
            }
          });
        });
        this.updateSensorDetails();
        this.drawHeatmap();
      },
      (error) => this.handleError(error)
    );
  }
}

interface SensorDetails {
  id: string;
  name: string;
  currentValue: string;
}

class SensorsDataSource implements DataSource<SensorDetails> {
  private data: BehaviorSubject<SensorDetails[]>;

  private nameSort(a: SensorDetails, b: SensorDetails) {
    if (a.name.toLowerCase() === 'sensor not found') {
      return 1;
    }
    if (b.name.toLowerCase() === 'sensor not found') {
      return -1;
    }
    return a.name.localeCompare(b.name);
  }

  constructor(initialData?: SensorDetails[]) {
    const sorted = initialData.sort(this.nameSort);
    this.data = new BehaviorSubject<SensorDetails[]>(sorted);
  }

  get Data(): Observable<SensorDetails[]> {
    return this.data.asObservable();
  }
  connect(): Observable<SensorDetails[]> {
    return this.data.asObservable();
  }

  update(newData?: SensorDetails[]): void {
    const sorted = newData.sort(this.nameSort);
    this.data.next(sorted);
  }

  disconnect(): void {
    this.data.complete();
  }
}

interface DeviceDetails {
  id: string;
  name: string;
  currentState: string;
}

class DevicesDataSource implements DataSource<DeviceDetails> {
  private data: BehaviorSubject<DeviceDetails[]>;

  private nameSort(a: DeviceDetails, b: DeviceDetails) {
    if (a.name.toLowerCase() === 'device not found') {
      return 1;
    }
    if (b.name.toLowerCase() === 'device not found') {
      return -1;
    }
    return a.name.localeCompare(b.name);
  }

  constructor(initialData?: DeviceDetails[]) {
    const sorted = initialData.sort(this.nameSort);
    this.data = new BehaviorSubject<DeviceDetails[]>(sorted);
  }

  get Data(): Observable<DeviceDetails[]> {
    return this.data.asObservable();
  }
  connect(): Observable<DeviceDetails[]> {
    return this.data.asObservable();
  }

  update(newData?: DeviceDetails[]): void {
    const sorted = newData.sort(this.nameSort);
    this.data.next(sorted);
  }

  disconnect(): void {
    this.data.complete();
  }
}
