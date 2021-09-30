import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ProgressBarService, DashboardService, ProductTypesService } from '@services';
import {
  Controller,
  Dashboard,
  DashboardItem,
  DashboardItemRequest,
  DashboardItemResponse,
  ProductTypeResponse,
  GenerationStatus,
} from '@models';
import { DeviceOption, ModuleOption } from '../custom-dashboard.component';
import { AddWidgetDialog } from '../add-dialog-base';

@Component({
  selector: 'fuse-add-device-dialog',
  templateUrl: './add-device-dialog.component.html',
  styleUrls: ['./add-device-dialog.component.scss'],
})
export class AddDeviceDialogComponent extends AddWidgetDialog implements OnInit {
  addDeviceForm: FormGroup;
  controllerOptions: Controller[] = [];
  moduleOptions: ModuleOption[] = [];
  filteredModuleOptions: ModuleOption[] = [];
  deviceOptions: DeviceOption[] = [];
  filteredDeviceOptions: DeviceOption[] = [];
  dashboard: Dashboard;
  selectedController: Controller;
  changes = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { dashboard: Dashboard; deviceOptions: DeviceOption[]; curPos: GenerationStatus },
    public dialogRef: MatDialogRef<AddDeviceDialogComponent, boolean>,
    private productsService: ProductTypesService,
    private dashboardService: DashboardService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(data.dashboard, progressBarService, snackbar);

    this.curPos = data.curPos;
    this.deviceOptions = data.deviceOptions;
    this.controllerOptions = this.deviceOptions.reduce((all, dev) => {
      if (!all.find((exist) => exist.Guid === dev.controller.Guid)) {
        all.push(dev.controller);
      }

      return all;
    }, new Array<Controller>());
    this.moduleOptions = this.deviceOptions.reduce((all, dev) => {
      if (!all.find((exist) => exist.module.Guid === dev.module.Guid)) {
        all.push({ module: dev.module, controller: dev.controller, productType: dev.productType });
      }

      return all;
    }, new Array<ModuleOption>());

    this.controllerOptions.sort((a, b) => a.Name.localeCompare(b.Name));
    this.moduleOptions.sort((a, b) => a.module.Name.localeCompare(b.module.Name));

    if (this.controllerOptions.length === 1) {
      this.filteredModuleOptions = this.moduleOptions;
      this.selectedController = this.controllerOptions[0];
    }
    if (this.filteredModuleOptions.length === 1) {
      this.filteredDeviceOptions = this.deviceOptions;
    }
  }

  ngOnInit() {
    this.addDeviceForm = new FormGroup({
      controller: new FormControl(
        null,
        this.controllerOptions.length > 1 ? [Validators.required] : []
      ),
      module: new FormControl(null, this.moduleOptions.length > 1 ? [Validators.required] : []),
      device: new FormControl(null, [Validators.required]),
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
      this.filteredDeviceOptions = this.deviceOptions.filter(
        (opt) => opt.module.Guid === selected.module.Guid
      );
      this.device.setValue(
        this.filteredDeviceOptions.length ? this.filteredDeviceOptions[0] : null
      );
    });

    this.controller.setValue(this.controllerOptions.length ? this.controllerOptions[0] : null);
  }

  submit() {
    const position = this.getDashboardAvailableSpot(3, 3);
    const selected = this.device.value as DeviceOption;
    const productType = this.productsService.FindProductType(selected.productType);
    const deviceRequest: DashboardItemRequest = {
      DashboardId: this.dashboard.Id,
      Type: 'device',
      X: position.xPos,
      Y: position.yPos,
      Layer: 5,
      DeviceId: selected.device.Guid,
    };

    if (this.dashboard.Id === 'generated') {
      const usedIds = this.dashboard.Items.map((dbItem) => parseInt(dbItem.id, 10));
      const newId = Math.max(...usedIds) + 1;
      deviceRequest.Id = newId.toString();

      const itemResponse = new DashboardItemResponse(deviceRequest);
      this.addDeviceToDashboard(itemResponse, productType, selected);

      return;
    }

    this.dashboardService.addDashboardItem(deviceRequest).subscribe((result) => {
      this.addDeviceToDashboard(result, productType, selected);
    });
  }

  private addDeviceToDashboard(
    dashboardItem: DashboardItemResponse,
    productType: ProductTypeResponse,
    device: DeviceOption
  ) {
    const newDevice = new DashboardItem(dashboardItem);
    newDevice.createDeviceModel(
      this.selectedController,
      productType,
      device.device,
      device.module
    );

    this.dashboard.Items.push(newDevice);
    const deviceIdx = this.deviceOptions.findIndex(dev => dev.device.Guid === device.device.Guid);
    const filteredDeviceIdx = this.filteredDeviceOptions.findIndex(dev => dev.device.Guid === device.device.Guid);
    if (deviceIdx > -1) {
      this.deviceOptions.splice(deviceIdx, 1);
    }
    if (filteredDeviceIdx > -1) {
      this.filteredDeviceOptions.splice(filteredDeviceIdx, 1);
      const nextIndex =
      filteredDeviceIdx < this.filteredDeviceOptions.length
          ? filteredDeviceIdx
          : this.filteredDeviceOptions.length - 1;

      if (nextIndex >= 0) {
        this.device.setValue(this.filteredDeviceOptions[nextIndex]);
      }
    }
    this.changes = true;
  }

  get controller() {
    return this.addDeviceForm.get('controller') as FormControl;
  }
  get module() {
    return this.addDeviceForm.get('module') as FormControl;
  }
  get device() {
    return this.addDeviceForm.get('device') as FormControl;
  }
}
