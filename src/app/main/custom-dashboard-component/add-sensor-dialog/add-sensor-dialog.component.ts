import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import {
  ProgressBarService,
  DashboardService,
  ProductTypesService,
  ParticleSensorsService,
} from '@services';
import {
  Controller,
  Dashboard,
  DashboardItem,
  SelectItem,
  DashboardItemResponse,
  ProductTypeResponse,
  DashboardItemRequest,
  GenerationStatus,
  DashboardItemType,
} from '@models';
import { SensorOption, ModuleOption } from '../custom-dashboard.component';
import { AddWidgetDialog } from '../add-dialog-base';

@Component({
  selector: 'fuse-add-sensor-dialog',
  templateUrl: './add-sensor-dialog.component.html',
  styleUrls: ['./add-sensor-dialog.component.scss'],
})
export class AddSensorDialogComponent extends AddWidgetDialog implements OnInit {
  addSensorForm: FormGroup;
  controllerOptions: Controller[] = [];
  moduleOptions: ModuleOption[] = [];
  filteredModuleOptions: ModuleOption[] = [];
  sensorOptions: SensorOption[] = [];
  filteredSensorOptions: SensorOption[] = [];
  dashboardTypeOptions: SelectItem[] = [];
  dashboard: Dashboard;
  selectedController: Controller;
  changes = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { dashboard: Dashboard; sensorOptions: SensorOption[]; curPos: GenerationStatus },
    public dialogRef: MatDialogRef<AddSensorDialogComponent, boolean>,
    private productsService: ProductTypesService,
    private particleSensorService: ParticleSensorsService,
    private dashboardService: DashboardService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(data.dashboard, progressBarService, snackbar);

    this.curPos = data.curPos;
    this.sensorOptions = data.sensorOptions;
    this.initCollections();

    this.dashboardTypeOptions.push({ value: 'gauge', caption: 'Gauge' });
    this.dashboardTypeOptions.push({ value: 'chart', caption: 'Chart' });
    this.dashboardTypeOptions.push({ value: 'sensor', caption: 'Compact' });
    this.dashboardTypeOptions.push({ value: 'sensor-min', caption: 'Minimum' });
    this.dashboardTypeOptions.push({ value: 'sensor-value', caption: 'Value Only' });
  }

  private initCollections() {
    this.controllerOptions = this.sensorOptions.reduce((all, dev) => {
      if (!all.find((exist) => exist.Guid === dev.controller.Guid)) {
        all.push(dev.controller);
      }

      return all;
    }, new Array<Controller>());
    this.moduleOptions = this.sensorOptions.reduce((all, sens) => {
      if (!all.find((exist) => exist.module.Guid === sens.module.Guid)) {
        all.push({
          module: sens.module,
          controller: sens.controller,
          productType: sens.productType,
        });
      }

      return all;
    }, new Array<ModuleOption>());

    this.controllerOptions.sort((a, b) => a.Name.localeCompare(b.Name));
    this.moduleOptions.sort((a, b) => a.module.Name.localeCompare(b.module.Name));

    if (this.controllerOptions.length === 1) {
      this.filteredModuleOptions = this.moduleOptions;
      this.selectedController = this.controllerOptions[0];
    }
    if (this.moduleOptions.length === 1) {
      this.filteredSensorOptions = this.sensorOptions;
    }
  }

  ngOnInit() {
    this.addSensorForm = new FormGroup({
      controller: new FormControl(
        null,
        this.controllerOptions.length > 1 ? [Validators.required] : []
      ),
      module: new FormControl(null, this.moduleOptions.length > 1 ? [Validators.required] : []),
      sensor: new FormControl(null, [Validators.required]),
      dashboardType: new FormControl(null, [Validators.required]),
    });

    this.controller.valueChanges.subscribe((selected: Controller) => {
      this.selectedController = selected;
      this.filteredModuleOptions = this.moduleOptions.filter(
        (opt) => opt.controller.Guid === selected.Guid
      );
      this.module.setValue(
        this.filteredModuleOptions.length ? this.filteredModuleOptions[0] : null
      );
    });
    this.module.valueChanges.subscribe((selected: ModuleOption) => {
      this.filteredSensorOptions = this.sensorOptions.filter(
        (opt) => opt.module.Guid === selected.module.Guid
      );
      this.sensor.setValue(
        this.filteredSensorOptions.length ? this.filteredSensorOptions[0] : null
      );
    });

    this.controller.setValue(this.controllerOptions.length ? this.controllerOptions[0] : null);
  }

  submit() {
    const sensorType: DashboardItemType = this.dashboardType.value;
    const position =
      sensorType === 'chart'
        ? this.getDashboardAvailableSpot(4, 4)
        : this.getDashboardAvailableSpot(3, 6);
    const selected = this.sensor.value as SensorOption;
    const productType = this.productsService.FindProductType(selected.productType);
    const sensorRequest: DashboardItemRequest = {
      DashboardId: this.dashboard.Id,
      Type: sensorType,
      X: position.xPos,
      Y: position.yPos,
      Layer: 5,
      SensorId: selected.sensor.Guid,
    };

    if (this.dashboard.Id === 'generated') {
      const usedIds = this.dashboard.Items.map((dbItem) => parseInt(dbItem.id, 10));
      const newId = Math.max(...usedIds) + 1;
      sensorRequest.Id = newId.toString();

      const itemResponse = new DashboardItemResponse(sensorRequest);
      this.addSensorToDashboard(itemResponse, productType, selected);

      return;
    }

    this.dashboardService.addDashboardItem(sensorRequest).subscribe((result) => {
      this.addSensorToDashboard(result, productType, selected);
    });
  }

  private addSensorToDashboard(
    dashboardItem: DashboardItemResponse,
    productType: ProductTypeResponse,
    sensor: SensorOption
  ) {
    const newSensor = new DashboardItem(dashboardItem);
    newSensor.createSensorModel(
      this.particleSensorService,
      this.selectedController,
      productType,
      sensor.sensor
    );

    this.dashboard.Items.push(newSensor);
    const sensorIdx = this.sensorOptions.findIndex(
      (sens) => sens.sensor.Guid === sensor.sensor.Guid
    );
    const filteredSensorIdx = this.filteredSensorOptions.findIndex(
      (sens) => sens.sensor.Guid === sensor.sensor.Guid
    );
    if (sensorIdx > -1) {
      this.sensorOptions.splice(sensorIdx, 1);
    }
    if (filteredSensorIdx > -1) {
      this.filteredSensorOptions.splice(filteredSensorIdx, 1);
      const nextIndex =
        filteredSensorIdx < this.filteredSensorOptions.length
          ? filteredSensorIdx
          : this.filteredSensorOptions.length - 1;

      if (nextIndex >= 0) {
        this.sensor.setValue(this.filteredSensorOptions[nextIndex]);
      }
    }
    this.changes = true;
  }

  get controller() {
    return this.addSensorForm.get('controller') as FormControl;
  }
  get module() {
    return this.addSensorForm.get('module') as FormControl;
  }
  get sensor() {
    return this.addSensorForm.get('sensor') as FormControl;
  }
  get dashboardType() {
    return this.addSensorForm.get('dashboardType') as FormControl;
  }
}
