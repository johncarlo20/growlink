import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { Observable } from 'rxjs';
import { interval } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FileUploader, FileItem } from 'ng2-file-upload';
import { HeatmapGroupDialogComponent } from './heatmap-group-dialog/heatmap-group-dialog.component';
import { HeatmapSensorDialogComponent } from './heatmap-sensor-dialog/heatmap-sensor-dialog.component';
import { HeatmapDeviceDialogComponent } from './heatmap-device-dialog/heatmap-device-dialog.component';
import {
  ControllerService,
  ProgressBarService,
  HeatmapService,
  AuthenticationService,
} from '@services';
import {
  HeatmapConfiguration,
  HeatmapGroup,
  HeatmapSensor,
  DeviceTypes,
  ParticleSensor,
  DataPointMetric,
  HeatmapDevice,
} from '@models';
import { environment } from '../../../../../environments/environment';
import { HeatmapBaseComponent } from './heatmap-base.component';
import { ConfirmUnsavedDialogComponent } from '../../../dialogs/confirm-unsaved-dialog.component';

@Component({
  selector: 'fuse-heatmap-config',
  templateUrl: './heatmap-config.component.html',
  styleUrls: ['./heatmap-config.component.scss'],
})
export class HeatmapConfigComponent extends HeatmapBaseComponent implements OnInit {
  snackOptions: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
  };
  uploader = new FileUploader({
    url: `${environment.api}/api/HeatmapBackgroundImages/`,
    method: 'PUT',
  });
  mapName = new FormControl('', [Validators.required]);
  newSensor: HeatmapSensor = null;
  editingSensor: HeatmapSensor = null;
  newDevice: HeatmapDevice = null;
  editingDevice: HeatmapDevice = null;
  rename = false;
  canRedraw = true;
  unsavedChanges = false;

  groupsToDelete: string[] = [];
  sensorsToDelete: string[] = [];
  devicesToDelete: string[] = [];

  defaultWidth = 100;
  defaultHeight = 50;

  nextSensorId = 1;
  nextDeviceId = 1;
  nextGroupId = 1;

  constructor(
    private router: Router,
    route: ActivatedRoute,
    controllers: ControllerService,
    progressBarService: ProgressBarService,
    heatmaps: HeatmapService,
    auth: AuthenticationService,
    snackbar: MatSnackBar,
    public dialog: MatDialog
  ) {
    super(route, controllers, heatmaps, auth, progressBarService, snackbar);

    this.uploader.authToken = `Bearer ${this.auth.token}`;
    this.uploader.setOptions({ authToken: `Bearer ${this.auth.token}` });
    this.dataColumns = ['name', 'value', 'actions'];
  }

  ngOnInit() {
    super.ngOnInit();

    this.subs.add(interval(20).subscribe(n => (this.canRedraw = true)));
    this.route.paramMap.subscribe(params => {
      const editId = params.has('id') ? params.get('id') : null;
      if (editId) {
        this.progressBarService.SetCurrentPage([
          { icon: 'insert_chart', caption: 'Heat Maps', url: ['org', 'heatmaps'] },
          { icon: 'settings', caption: 'Edit Heatmap' },
        ]);

        this.heatmaps.getHeatmap(editId).subscribe(
          heatmap => {
            this.config = heatmap;
            this.mapName.setValue(this.config.Name);

            window.setTimeout(() => this.loadHeatmap());
          },
          error => this.handleError(error)
        );
      } else {
        this.progressBarService.SetCurrentPage([
          { icon: 'insert_chart', caption: 'Heat Maps', url: ['org', 'heatmaps'] },
          { icon: 'settings', caption: 'New Heatmap' },
        ]);
      }
    });
  }

  canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (!this.unsavedChanges) {
      return true;
    }

    const config: MatDialogConfig = {
      data: { message: `Unsaved changed to Heatmap ${this.config.Name} will be lost!` }
    };
    const dialogRef = this.dialog.open(ConfirmUnsavedDialogComponent, config);

    return dialogRef.afterClosed().pipe(
      tap((result: boolean) => {
        if (!result) {
          this.progressBarService.SetLoading(false);
        }
      })
    );
  }

  loaded() {
    super.loaded();

    this.defaultWidth *= this.aspect;
    this.defaultHeight *= this.aspect;
  }

  selectFile(): void {
    document.getElementById('imageFile').click();
  }

  imageSelected(files: File[]) {
    const imageFile = files[0];

    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      this.config = new HeatmapConfiguration({
        OrganizationId: this.organizationId,
        BackgroundImageUrl: data,
        Name: this.mapName.value,
      });

      window.setTimeout(() => this.loadHeatmap(), 100);
    };

    reader.readAsDataURL(imageFile);
  }

  addGroup() {
    const counter = this.config.Groups.length + 1;
    const newGroup = new HeatmapGroup({
      Name: `Group ${counter}`,
    });
    this.showGroupDialog(newGroup);
  }

  editGroup(group: HeatmapGroup) {
    const editGroup = new HeatmapGroup(group);
    this.showGroupDialog(editGroup);
  }

  deleteGroup(group: HeatmapGroup) {
    this.groupsToDelete.push(group.Id);
    this.unsavedChanges = true;
    this.config.Groups = [...this.config.Groups.filter(exist => exist.Id !== group.Id)];
    this.drawHeatmap();
  }

  addSensor(group: HeatmapGroup) {
    this.showSensorDialog(group);
  }

  editSensor(group: HeatmapGroup, sensor: ISensorDetail) {
    const existSensor = group.Sensors.find(s => s.Id === sensor.id);
    this.editingSensor = new HeatmapSensor(existSensor);
    this.noDrawSensorId = existSensor.Id;
    this.realTime = false;
    this.drawHeatmap();
  }

  deleteSensor(group: HeatmapGroup, sensor: ISensorDetail) {
    const existSensor = group.Sensors.find(s => s.Id === sensor.id);
    this.sensorsToDelete.push(sensor.id);
    group.Sensors = [...group.Sensors.filter(exist => exist.Id !== existSensor.Id)];
    this.unsavedChanges = true;
    this.updateSensorDetails();
    this.drawHeatmap();
  }

  addDevice(group: HeatmapGroup) {
    this.showDeviceDialog(group);
  }

  editDevice(group: HeatmapGroup, dev: IDeviceDetail) {
    const existDevice = group.Devices.find(d => d.Id === dev.id);
    this.editingDevice = new HeatmapDevice(existDevice);
    this.editingDevice.loadImage(() => {
      this.drawHeatmap();
    });

    this.realTime = false;
    this.noDrawDeviceId = existDevice.Id;
  }

  deleteDevice(group: HeatmapGroup, dev: IDeviceDetail) {
    const existDevice = group.Devices.find(d => d.Id === dev.id);
    this.devicesToDelete.push(dev.id);
    group.Devices = [...group.Devices.filter(exist => exist.Id !== existDevice.Id)];
    this.updateDeviceDetails();
    this.drawHeatmap();
  }

  renameHeatmap() {
    this.config.Name = this.mapName.value;
    this.unsavedChanges = true;
    this.rename = false;
  }

  checkUploaded(item: FileItem) {
    if (item.isUploaded) {
      this.progressBarService.SetLoading(false);
      this.showSavedNotification();
      this.router.navigate(['org', 'heatmap-config', this.config.Id]);
    } else {
      window.setTimeout(() => this.checkUploaded(item), 100);
    }
  }

  saveHeatmap() {
    this.heatmaps.saveHeatmap(this.config).subscribe(
      result => {
        if (!this.config.Id) {
          this.config.Id = result.Id;
          this.uploader.setOptions({
            url: `${environment.api}/api/HeatmapBackgroundImages/${result.Id}`,
          });
          this.progressBarService.SetLoading(true);
          const item = this.uploader.queue[0];
          item.upload();
        }

        this.sensorsToDelete.forEach(sensorId => {
          this.heatmaps
            .deleteHeatmapSensor(sensorId)
            .subscribe(() => { }, error => this.handleError(error));
        });
        this.devicesToDelete.forEach(deviceId => {
          this.heatmaps
            .deleteHeatmapDevice(deviceId)
            .subscribe(() => { }, error => this.handleError(error));
        });
        this.groupsToDelete.forEach(groupId => {
          this.heatmaps
            .deleteHeatmapGroup(groupId)
            .subscribe(() => { }, error => this.handleError(error));
        });

        const groupCalls = new Array<Observable<HeatmapGroup>>();
        const sensorCalls = new Array<Observable<HeatmapSensor>>();
        const deviceCalls = new Array<Observable<HeatmapDevice>>();

        this.config.Groups.forEach(group => {
          if (!isNaN(Number(group.Id))) {
            group.Id = null;
            group.HeatmapId = result.Id;
          }
          const apiCall = this.heatmaps.saveHeatmapGroup(group).pipe(
            tap(groupResult => {
              group.Id = groupResult.Id;
            })
          );
          groupCalls.push(apiCall);
        });

        forkJoin(groupCalls).subscribe(
          () => {
            this.config.Groups.forEach(group => {
              if (!group.Sensors) {
                return;
              }

              group.Sensors.forEach(sensor => {
                if (!isNaN(Number(sensor.Id))) {
                  sensor.Id = null;
                  sensor.HeatmapGroupId = group.Id;
                }
                sensorCalls.push(this.heatmaps.saveHeatmapSensor(sensor));
              });
              group.Devices.forEach(device => {
                if (!isNaN(Number(device.Id))) {
                  device.Id = null;
                  device.HeatmapGroupId = group.Id;
                }
                deviceCalls.push(this.heatmaps.saveHeatmapDevice(device));
              });
            });

            forkJoin([...sensorCalls, ...deviceCalls]).subscribe(
              () => {
                if (this.uploader.queue.length) {
                  const item = this.uploader.queue[0];
                  this.checkUploaded(item);
                } else {
                  this.showSavedNotification();
                }
              },
              error => this.handleError(error)
            );
          },
          error => this.handleError(error)
        );
      },
      error => this.handleError(error)
    );
  }

  public get buttonsDisabled(): boolean {
    return (
      !!this.newSensor ||
      !!this.editingSensor ||
      !!this.newDevice ||
      !!this.editingDevice ||
      this.loading
    );
  }

  private showSavedNotification() {
    this.unsavedChanges = false;
    this.showMessage(`Successfully saved heatmap '${this.config.Name}'`);
  }

  private sensorRect(ev: MouseEvent): ClientRect {
    const targetSensor = this.editingSensor || this.newSensor;

    const boundingRect = (ev.target as HTMLCanvasElement).getBoundingClientRect();
    const x = ev.clientX - boundingRect.left;
    const y = ev.clientY - boundingRect.top;
    const width = targetSensor.width;
    const height = targetSensor.height;
    const aspectRatio = this.canvas.width / boundingRect.width;
    const scaledX = x * aspectRatio;
    const scaledY = y * aspectRatio;

    return {
      top: Math.round(scaledY - height / 2),
      bottom: Math.round(scaledY + height / 2),
      left: Math.round(scaledX - width / 2),
      right: Math.round(scaledX + width / 2),
      width,
      height,
    };
  }

  private deviceRect(ev: MouseEvent): ClientRect {
    const targetDevice = this.editingDevice || this.newDevice;

    const boundingRect = (ev.target as HTMLCanvasElement).getBoundingClientRect();
    const x = ev.clientX - boundingRect.left;
    const y = ev.clientY - boundingRect.top;
    const size = targetDevice.Size;
    const aspectRatio = this.canvas.width / boundingRect.width;
    const scaledX = x * aspectRatio;
    const scaledY = y * aspectRatio;

    return {
      top: Math.round(scaledY - size / 2),
      bottom: Math.round(scaledY + size / 2),
      left: Math.round(scaledX - size / 2),
      right: Math.round(scaledX + size / 2),
      width: size,
      height: size,
    };
  }

  canvasClick(ev: MouseEvent) {
    const targetSensor = this.editingSensor || this.newSensor;
    if (targetSensor) {
      const sensorLocation = this.sensorRect(ev);
      const targetGroup = targetSensor.parent;
      const theSensor = this.newSensor
        ? new HeatmapSensor(targetSensor)
        : this.config.Groups.find(grp => grp.Id === this.editingSensor.HeatmapGroupId).Sensors.find(
          exist => exist.Id === this.editingSensor.Id
        );

      theSensor.LocationX0 = sensorLocation.left;
      theSensor.LocationX1 = sensorLocation.right;
      theSensor.LocationY0 = sensorLocation.top;
      theSensor.LocationY1 = sensorLocation.bottom;

      if (this.newSensor) {
        targetGroup.Sensors = [...targetGroup.Sensors, theSensor];
      }
      this.newSensor = null;
      this.editingSensor = null;
      this.noDrawSensorId = null;

      this.updateSensorDetails();
      this.realTime = true;
      this.unsavedChanges = true;
      this.drawHeatmap();
    }

    const targetDevice = this.editingDevice || this.newDevice;
    if (targetDevice) {
      const deviceLocation = this.deviceRect(ev);
      const targetGroup = targetDevice.parent;
      const theDevice = this.newDevice
        ? new HeatmapDevice(targetDevice)
        : this.config.Groups.find(grp => grp.Id === this.editingDevice.HeatmapGroupId).Devices.find(
          exist => exist.Id === this.editingDevice.Id
        );

      theDevice.LocationX = deviceLocation.left;
      theDevice.LocationY = deviceLocation.top;

      if (this.newDevice) {
        targetGroup.Devices = [...targetGroup.Devices, theDevice];
        theDevice.loadImage(() => {
          this.drawHeatmap();
        });
      } else {
        theDevice.Size = this.editingDevice.Size;
      }

      this.newDevice = null;
      this.editingDevice = null;
      this.noDrawDeviceId = null;

      this.realTime = true;
      this.updateDeviceDetails();
      this.unsavedChanges = true;
      this.drawHeatmap();
    }
  }

  canvasMove(ev: MouseEvent) {
    const targetSensor = this.editingSensor || this.newSensor;
    const targetDevice = this.editingDevice || this.newDevice;

    if (!targetSensor && !targetDevice) {
      return;
    }

    if (targetSensor) {
      const sensorLocation = this.sensorRect(ev);
      targetSensor.LocationX0 = sensorLocation.left;
      targetSensor.LocationX1 = sensorLocation.right;
      targetSensor.LocationY0 = sensorLocation.top;
      targetSensor.LocationY1 = sensorLocation.bottom;
    }
    if (targetDevice) {
      const deviceLocation = this.deviceRect(ev);
      targetDevice.LocationX = deviceLocation.left;
      targetDevice.LocationY = deviceLocation.top;
    }

    this.drawHeatmap();
  }

  private resizeElement(
    targetSensor: HeatmapSensor,
    targetDevice: HeatmapDevice,
    direction: 'grow' | 'shrink',
    axis: 'x' | 'y'
  ) {
    if (axis === 'y') {
      if (direction === 'shrink') {
        if (targetSensor && targetSensor.height > 10 * this.aspect) {
          targetSensor.LocationY0 += this.aspect;
          targetSensor.LocationY1 -= this.aspect;
        }
      } else if (direction === 'grow') {
        if (targetSensor) {
          targetSensor.LocationY0 -= this.aspect;
          targetSensor.LocationY1 += this.aspect;
        }
      }
    } else {
      if (direction === 'shrink') {
        if (targetSensor && targetSensor.width > 10 * this.aspect) {
          targetSensor.LocationX0 += this.aspect;
          targetSensor.LocationX1 -= this.aspect;
        }
        if (targetDevice && targetDevice.Size > 64 * this.aspect) {
          targetDevice.Size -= this.aspect;
        }
      } else if (direction === 'grow') {
        if (targetSensor) {
          targetSensor.LocationX0 -= this.aspect;
          targetSensor.LocationX1 += this.aspect;
        }
        if (targetDevice) {
          targetDevice.Size += this.aspect;
        }
      }
    }

    this.defaultWidth = targetSensor ? targetSensor.width : targetDevice.Size;
    this.defaultHeight = targetSensor ? targetSensor.height : targetDevice.Size;

    this.drawHeatmap();
  }

  canvasScroll(event: WheelEvent) {
    const targetSensor = this.editingSensor || this.newSensor;
    const targetDevice = this.editingDevice || this.newDevice;

    if (!targetSensor && !targetDevice) {
      return;
    }

    event.preventDefault();

    this.resizeElement(
      targetSensor,
      targetDevice,
      event.deltaY > 0 ? 'grow' : 'shrink',
      event.shiftKey ? 'y' : 'x'
    );
  }

  @HostListener('window:keydown', ['$event'])
  canvasKey(event: KeyboardEvent) {
    const targetSensor = this.editingSensor || this.newSensor;
    const targetDevice = this.editingDevice || this.newDevice;

    if (!targetSensor && !targetDevice) {
      return;
    }

    switch (event.key) {
      case 'Escape':
        this.newSensor = null;
        this.editingSensor = null;
        this.noDrawSensorId = null;
        this.newDevice = null;
        this.editingDevice = null;
        this.noDrawDeviceId = null;
        this.realTime = true;

        this.drawHeatmap();
        return;
    }

    if (event.key !== '+' && event.key !== '-') {
      return;
    }

    this.resizeElement(
      targetSensor,
      targetDevice,
      event.key === '+' ? 'grow' : 'shrink',
      event.shiftKey ? 'y' : 'x'
    );
  }

  drawHeatmap() {
    if (!this.canRedraw) {
      return;
    }

    super.drawHeatmap();

    const targetSensor = this.editingSensor || this.newSensor;
    const targetDevice = this.editingDevice || this.newDevice;
    if (targetSensor) {
      this.NaNGradient(targetSensor);
      this.ctx.strokeStyle = 'black';
      this.ctx.fillRect(
        targetSensor.LocationX0,
        targetSensor.LocationY0,
        targetSensor.width,
        targetSensor.height
      );
      this.ctx.strokeRect(
        targetSensor.LocationX0,
        targetSensor.LocationY0,
        targetSensor.width,
        targetSensor.height
      );
    }
    if (targetDevice) {
      this.ctx.fillStyle = '#FFFFFFCC';
      this.ctx.fillRect(
        targetDevice.LocationX - 2,
        targetDevice.LocationY - 2,
        targetDevice.width + 4,
        targetDevice.height + 30 * this.aspect + 6
      );

      this.ctx.strokeStyle = 'black';
      this.ctx.drawImage(
        targetDevice.image,
        targetDevice.LocationX,
        targetDevice.LocationY,
        targetDevice.Size,
        targetDevice.Size
      );
      this.ctx.strokeRect(
        targetDevice.LocationX - 2,
        targetDevice.LocationY - 2,
        targetDevice.width + 4,
        targetDevice.height + 30 * this.aspect + 6
      );
    }

    this.canRedraw = false;
  }

  private showGroupDialog(group: HeatmapGroup) {
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { group: group, sensors: this.sensorList },
    };

    const dialogRef = this.dialog.open(HeatmapGroupDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: { group: HeatmapGroup }) => {
      if (!result) {
        return;
      }

      if (!result.group.Id) {
        result.group.Id = this.nextGroupId.toString();
        this.nextGroupId++;
        this.config.Groups.push(result.group);
      } else {
        const targetGroup = this.config.Groups.find(exist => exist.Id === result.group.Id);
        targetGroup.Name = result.group.Name;
        targetGroup.MinReading = result.group.MinReading;
        targetGroup.MaxReading = result.group.MaxReading;
        targetGroup.ParticleSensor = result.group.ParticleSensor;
      }

      this.unsavedChanges = true;
      this.drawHeatmap();
    });
  }
  private showSensorDialog(group: HeatmapGroup) {
    const existSensors = this.config.Groups.reduce(
      (all, grp) => all.concat(grp.Sensors),
      new Array<HeatmapSensor>()
    );
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: {
        sensors: this.sensorList
          .filter(sensor => !existSensors.find(exist => exist.SensorId === sensor.Guid))
          .filter(sensor => {
            if (sensor.ParticleSensor === group.ParticleSensor) {
              return true;
            }

            switch (sensor.ParticleSensor) {
              case ParticleSensor.BacnetInput1:
              case ParticleSensor.BacnetInput2:
              case ParticleSensor.BacnetInput3:
              case ParticleSensor.BacnetInput4:
              case ParticleSensor.CurrentLoopInput1:
              case ParticleSensor.CurrentLoopInput2:
              case ParticleSensor.CurrentLoopInput3:
              case ParticleSensor.CurrentLoopInput4:
              case ParticleSensor.CurrentLoopInput5:
                if (
                  (group.ParticleSensor === ParticleSensor.AmbientTemperature &&
                    sensor.CalibrationDataPointMetric === DataPointMetric.Temperature) ||
                  (group.ParticleSensor === ParticleSensor.AmbientTemperature2 &&
                    sensor.CalibrationDataPointMetric === DataPointMetric.Temperature) ||
                  (group.ParticleSensor === ParticleSensor.OutsideAtmosphericPressure &&
                    sensor.CalibrationDataPointMetric === DataPointMetric.AtmosphericPressure)
                ) {
                  return true;
                }
                break;
            }

            return false;
          })
          .map<ISensorListing>(sensor => ({
            id: sensor.Guid,
            name: sensor.Name,
            controllerName: sensor.Controller.Name,
            moduleName: sensor.Module.Name,
          })),
      },
    };

    const dialogRef = this.dialog.open(HeatmapSensorDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: ISensorListing) => {
      if (!result) {
        return;
      }

      this.newSensor = new HeatmapSensor({
        Id: this.nextSensorId.toString(),
        HeatmapGroupId: group.Id,
        SensorId: result.id,
        LocationX0: 0,
        LocationY0: 0,
        LocationX1: this.defaultWidth,
        LocationY1: this.defaultHeight,
        parent: group,
      });
      this.nextSensorId++;

      this.realTime = false;
      this.unsavedChanges = true;
      this.drawHeatmap();
      this.updateReadings();
    });
  }

  private showDeviceDialog(group: HeatmapGroup) {
    const existDevices = this.config.Groups.reduce(
      (all, grp) => all.concat(grp.Devices),
      new Array<HeatmapDevice>()
    );
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: {
        devices: this.deviceList
          .filter(device => !existDevices.find(exist => exist.DeviceId === device.Guid))
          .map<IDeviceListing>(device => ({
            id: device.Guid,
            devType: device.DeviceType,
            name: device.Name,
            controllerName: device.Controller.Name,
            moduleName: device.Module.Name,
          })),
      },
    };

    const dialogRef = this.dialog.open(HeatmapDeviceDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: IDeviceListing) => {
      if (!result) {
        return;
      }

      this.newDevice = new HeatmapDevice({
        Id: this.nextDeviceId.toString(),
        HeatmapGroupId: group.Id,
        DeviceId: result.id,
        DeviceType: result.devType,
        LocationX: 0,
        LocationY: 0,
        Size: this.defaultWidth,
        parent: group,
      });
      this.newDevice.loadImage(() => {
        this.drawHeatmap();
      });
      this.nextDeviceId++;

      this.realTime = false;
      this.unsavedChanges = true;
      this.drawHeatmap();
      this.updateReadings();
    });
  }
}

interface ISensorDetail {
  id: string;
  name: string;
  currentValue: number;
}

interface IDeviceDetail {
  id: string;
  name: string;
  currentState: boolean;
  autoManual: boolean;
  throttle: number;
}

export interface ISensorListing {
  id: string;
  name: string;
  moduleName: string;
  controllerName: string;
}

export interface IDeviceListing {
  id: string;
  devType: DeviceTypes;
  name: string;
  moduleName: string;
  controllerName: string;
}
