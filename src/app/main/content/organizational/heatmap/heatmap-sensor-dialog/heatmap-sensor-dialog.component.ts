import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
// import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ISensorListing } from '../heatmap-config.component';
// import { Subscription } from 'rxjs';

@Component({
  selector: 'fuse-heatmap-sensor-dialog',
  templateUrl: './heatmap-sensor-dialog.component.html',
  styleUrls: ['./heatmap-sensor-dialog.component.scss'],
})
export class HeatmapSensorDialogComponent implements OnInit {
  selectedController: string;
  selectedModule: string;
  selectedSensor: ISensorListing;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { sensors: ISensorListing[] },
    public dialogRef: MatDialogRef<HeatmapSensorDialogComponent>
  ) {}

  ngOnInit() {}

  onCancel() {
    this.dialogRef.close(null);
  }

  get controllers(): string[] {
    return this.data.sensors
      .map(sensor => sensor.controllerName)
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

    return this.data.sensors
      .filter(sensor => sensor.controllerName === this.selectedController)
      .map(sensor => sensor.moduleName)
      .reduce((all, name) => {
        if (!all.find(exist => exist === name)) {
          all.push(name);
        }

        return all;
      }, new Array<string>());
  }

  get sensors(): ISensorListing[] {
    if (!this.selectedController || !this.selectedModule) {
      return [];
    }

    return this.data.sensors
      .filter(sensor => sensor.controllerName === this.selectedController && sensor.moduleName === this.selectedModule);
  }

  add() {
    this.dialogRef.close(this.selectedSensor);
  }
}
