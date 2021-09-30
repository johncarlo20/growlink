import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
// import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IDeviceListing } from '../heatmap-config.component';
// import { Subscription } from 'rxjs';

@Component({
  selector: 'fuse-heatmap-device-dialog',
  templateUrl: './heatmap-device-dialog.component.html',
  styleUrls: ['./heatmap-device-dialog.component.scss'],
})
export class HeatmapDeviceDialogComponent implements OnInit {
  selectedController: string;
  selectedModule: string;
  selectedDevice: IDeviceListing;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { devices: IDeviceListing[] },
    public dialogRef: MatDialogRef<HeatmapDeviceDialogComponent>
  ) {}

  ngOnInit() {}

  onCancel() {
    this.dialogRef.close(null);
  }

  get controllers(): string[] {
    return this.data.devices
      .map(device => device.controllerName)
      .reduce((all, name) => {
        if (!all.find(exist => exist === name)) {
          all.push(name);
        }

        return all;
      }, new Array<string>());
  }

  get modules(): string[] {
    if (!this.selectedController) {
      return [];
    }

    return this.data.devices
      .filter(device => device.controllerName === this.selectedController)
      .map(device => device.moduleName)
      .reduce((all, name) => {
        if (!all.find(exist => exist === name)) {
          all.push(name);
        }

        return all;
      }, new Array<string>());
  }

  get devices(): IDeviceListing[] {
    if (!this.selectedController || !this.selectedModule) {
      return [];
    }

    return this.data.devices
      .filter(device => device.controllerName === this.selectedController && device.moduleName === this.selectedModule);
  }

  add() {
    this.dialogRef.close(this.selectedDevice);
  }
}
