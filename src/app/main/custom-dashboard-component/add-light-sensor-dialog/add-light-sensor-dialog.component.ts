import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import {
  Controller,
  SelectItem,
  Dashboard,
  GenerationStatus,
  DashboardItemType,
  DashboardItemRequest,
  DashboardItemResponse,
  ProductTypeResponse,
  DashboardItem,
  WidgetSize,
  UnitOfMeasure,
} from 'app/main/models';
import {
  ProductTypesService,
  ParticleSensorsService,
  DashboardService,
  ProgressBarService,
} from 'app/main/services';
import { AddWidgetDialog } from '../add-dialog-base';
import { ModuleOption, SensorOption } from '../custom-dashboard.component';

@Component({
  selector: 'fuse-add-light-sensor-dialog',
  templateUrl: './add-light-sensor-dialog.component.html',
  styleUrls: ['./add-light-sensor-dialog.component.scss'],
})
export class AddLightSensorDialogComponent extends AddWidgetDialog implements OnInit {
  alignOptions = [
    { value: 'left', caption: 'Left' },
    { value: 'center', caption: 'Center' },
    { value: 'right', caption: 'Right' },
  ];

  addLightSensorForm: FormGroup;
  controllerOptions: Controller[] = [];
  moduleOptions: ModuleOption[] = [];
  filteredModuleOptions: ModuleOption[] = [];
  sensorOptions: SensorOption[] = [];
  selectedSensor: SensorOption;
  widgetSizeOptions: SelectItem[] = [];
  dashboard: Dashboard;
  selectedController: Controller;
  changes = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { dashboard: Dashboard; sensorOptions: SensorOption[]; curPos: GenerationStatus },
    public dialogRef: MatDialogRef<AddLightSensorDialogComponent, boolean>,
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

    this.widgetSizeOptions.push({ value: 'full', caption: 'Full' });
    this.widgetSizeOptions.push({ value: 'compact', caption: 'Compact' });
    this.widgetSizeOptions.push({ value: 'minimum', caption: 'Minimum' });
    this.widgetSizeOptions.push({ value: 'value-only', caption: 'Value Only' });
    this.widgetSizeOptions.push({ value: 'icon-only', caption: 'Icon Only' });
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
      this.selectedSensor = this.sensorOptions[0];
    }
  }

  ngOnInit() {
    this.addLightSensorForm = new FormGroup({
      controller: new FormControl(
        null,
        this.controllerOptions.length > 1 ? [Validators.required] : []
      ),
      module: new FormControl(null, this.moduleOptions.length > 1 ? [Validators.required] : []),
      sensor: new FormControl(null, [Validators.required]),
      widgetSize: new FormControl('minimum', [Validators.required]),
      threshold: new FormControl(1, [Validators.required]),
      align: new FormControl('center'),
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
      this.selectedSensor = this.sensorOptions.find(
        (sens) => sens.module.Guid === selected.module.Guid
      );
      this.sensor.setValue(this.selectedSensor);
    });

    this.controller.setValue(this.controllerOptions.length ? this.controllerOptions[0] : null);
  }

  get lightLevelDisplayUnit(): string {
    if (!this.selectedController || !this.selectedController.Units) {
      return null;
    }

    switch (this.selectedController.Units.lightLevel) {
      case UnitOfMeasure.Lux:
        return 'Lux';
      case UnitOfMeasure.PPFD:
      case UnitOfMeasure.PPFD_Cmh3000K:
      case UnitOfMeasure.PPFD_HalogenLamp3000K:
      case UnitOfMeasure.PPFD_HighCriLed3000K:
      case UnitOfMeasure.PPFD_HighCriLed4000K:
      case UnitOfMeasure.PPFD_HighCriLed6500K:
      case UnitOfMeasure.PPFD_Hps2000K:
      case UnitOfMeasure.PPFD_LowCriLed3500K:
      case UnitOfMeasure.PPFD_LowCriLed6500K:
      case UnitOfMeasure.PPFD_NaturalDaylight6500K:
        return 'PPFD';
      default:
        return 'UNKNOWN';
    }
  }

  submit() {
    const widgetSize: WidgetSize = this.widgetSize.value;
    let position = { xPos: 0, yPos: 0 };
    switch (widgetSize) {
      case 'full':
        position = this.getDashboardAvailableSpot(4, 4);
        break;
      case 'compact':
        position = this.getDashboardAvailableSpot(3, 2);
        break;
      case 'minimum':
        position = this.getDashboardAvailableSpot(2, 2);
        break;
      case 'value-only':
        position = this.getDashboardAvailableSpot(2, 1);
        break;
      case 'icon-only':
        position = this.getDashboardAvailableSpot(1, 1);
        break;
      }

    const productType = this.productsService.FindProductType(this.selectedSensor.productType);
    const sensorRequest: DashboardItemRequest = {
      DashboardId: this.dashboard.Id,
      Type: 'light-sensor',
      X: position.xPos,
      Y: position.yPos,
      Layer: 5,
      SensorId: this.selectedSensor.sensor.Guid,
      Options: { WidgetSize: widgetSize, OnThreshold: this.threshold.value, Align: this.align.value },
    };

    if (this.dashboard.Id === 'generated') {
      const usedIds = this.dashboard.Items.map((dbItem) => parseInt(dbItem.id, 10));
      const newId = Math.max(...usedIds) + 1;
      sensorRequest.Id = newId.toString();

      const itemResponse = new DashboardItemResponse(sensorRequest);
      this.addSensorToDashboard(itemResponse, productType, this.selectedSensor);

      return;
    }

    this.dashboardService.addDashboardItem(sensorRequest).subscribe((result) => {
      this.addSensorToDashboard(result, productType, this.selectedSensor);
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
    if (sensorIdx > -1) {
      this.sensorOptions.splice(sensorIdx, 1);
    }

    this.changes = true;
  }

  get controller() {
    return this.addLightSensorForm.get('controller') as FormControl;
  }
  get module() {
    return this.addLightSensorForm.get('module') as FormControl;
  }
  get sensor() {
    return this.addLightSensorForm.get('sensor') as FormControl;
  }
  get widgetSize() {
    return this.addLightSensorForm.get('widgetSize') as FormControl;
  }
  get threshold() {
    return this.addLightSensorForm.get('threshold') as FormControl;
  }
  get align() {
    return this.addLightSensorForm.get('align') as FormControl;
  }
}
