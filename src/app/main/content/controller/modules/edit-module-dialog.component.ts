import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ModuleResponse, Controller, ProductRegistration, SelectItem, GrowMedium, SoilECType } from '@models';
import { ProgressBarService, ControllerService, ProductTypesService, GrowMediumService, SoilECTypeService } from '@services';
import { BaseAPIComponent } from '@util';

@Component({
  selector: 'fuse-edit-module-dialog',
  templateUrl: './edit-module-dialog.component.html',
})
export class EditModuleDialogComponent extends BaseAPIComponent implements OnInit {
  editModuleForm: FormGroup;
  mod: ModuleResponse;
  growthMediums: SelectItem[] = [];
  soilECTypes: SelectItem[] = [];
  targetAggregateModules: SelectItem[] = [];
  newAggregateName = new FormControl(null, [Validators.required]);
  controller: Controller;

  @ViewChild('aggregateName') aggregateName: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public editModel: {
      mod: ModuleResponse;
      controller: Controller;
    },
    public dialogRef: MatDialogRef<EditModuleDialogComponent>,
    private productService: ProductTypesService,
    private controllerService: ControllerService,
    private growMediumService: GrowMediumService,
    private soilECTypeService: SoilECTypeService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);

    this.growthMediums = this.growMediumService.forSelectList();
    this.soilECTypes = this.soilECTypeService.forSelectList();
    this.mod = { ...editModel.mod };
  }

  ngOnInit() {
    super.ngOnInit();

    if (this.isEC5 || this.isTeros12) {
      this.mod.GrowMedium = this.mod.GrowMedium === GrowMedium.None ? GrowMedium.MineralSoil : this.mod.GrowMedium;
    }
    if (this.isTeros12) {
      this.mod.SoilECType = this.mod.SoilECType === SoilECType.None ? SoilECType.Pore : this.mod.SoilECType;
    }

    this.editModuleForm = new FormGroup({
      name: new FormControl(this.mod.Name, [Validators.required]),
      growMedium: new FormControl(this.mod.GrowMedium, [Validators.required]),
      soilECType: new FormControl(this.mod.SoilECType, [Validators.required]),
      hidden: new FormControl(this.mod.IsHidden, [Validators.required]),
      offlineAlerts: new FormControl(this.mod.EnableOfflineAlerts),
      aggregateTo: new FormControl(this.mod.AggregateModuleId),
    });

    this.subs.add(
      this.editModuleForm.valueChanges.subscribe(() => {
        this.mod.Name = this.name.value;
        this.mod.GrowMedium = this.growMedium.value;
        this.mod.SoilECType = this.soilECType.value;
        this.mod.IsHidden = this.hidden.value;
        this.mod.EnableOfflineAlerts = this.offlineAlerts.value;
        this.mod.AggregateModuleId = this.aggregateTo.value;
      })
    );

    this.subs.add(this.aggregateTo.valueChanges.subscribe(val => {
      if (val === '0000') {
        setTimeout(() => this.aggregateName.nativeElement.focus());
      }
    }));

    this.subs.add(this.controllerService.currentContainer.subscribe(val => {
      this.controller = val;
    }));

    if (this.allowsAggregation) {
      const aggProductType = this.findAggregateProductType();
      const aggModules = this.editModel.controller.Modules
        .filter(mod => mod.IsAggregate && mod.ProductType === aggProductType);

      this.targetAggregateModules = aggModules.map(mod => ({ value: mod.Guid, caption: mod.Name }));
    }
  }

  private findAggregateProductType() {
    let aggProductType = this.mod.ProductType;

    switch (this.mod.ProductType) {
      case 44:
        aggProductType = 53;
        break;
      case 75:
        aggProductType = 76;
        break;
    }

    return aggProductType;
  }

  get isEC5(): boolean {
    const productType = this.productService.FindProductType(this.mod.ProductType);
    return productType ? productType.IsIrrigationControllerWithEc5 : false;
  }

  get isTeros12(): boolean {
    const productType = this.productService.FindProductType(this.mod.ProductType);
    return productType.Name === 'IrrigationControllerTeros12' ||
      productType.Name === 'IrrigationControllerAsModuleTeros12';
  }

  get singleDeviceModule(): boolean {
    return this.mod.Devices.length === 1;
  }

  get supportOfflineAlerts(): boolean {
    const productType = this.productService.FindProductType(this.mod.ProductType);
    return productType ? productType.SupportsOfflineAlerts : false;
  }

  get allowsAggregation(): boolean {
    if (this.mod.IsAggregate) {
      return false;
    }
    const productType = this.productService.FindProductType(this.mod.ProductType);
    return productType ? productType.AllowsAggregation : false;
  }

  get unsupportedSettings(): boolean {
    if (!this.isEC5 && !this.isTeros12) {
      return false;
    }

    return ((this.mod.GrowMedium > 0 || this.mod.SoilECType > 0) &&
      (!this.controller.FirmwareVersion || this.controller.FirmwareVersion < 249));
  }

  get name() {
    return this.editModuleForm.get('name');
  }
  get growMedium() {
    return this.editModuleForm.get('growMedium');
  }
  get soilECType() {
    return this.editModuleForm.get('soilECType');
  }
  get hidden() {
    return this.editModuleForm.get('hidden');
  }
  get offlineAlerts() {
    return this.editModuleForm.get('offlineAlerts');
  }
  get aggregateTo() {
    return this.editModuleForm.get('aggregateTo');
  }

  aggregateNameKey(ev: KeyboardEvent) {
    if (ev.key === 'Enter') {
      if (this.newAggregateName.invalid) {
        return false;
      }

      return this.registerAggregate();
    }
  }

  public registerAggregate() {
    const aggProductType = this.findAggregateProductType();
    const reg: ProductRegistration = {
      ContainerId: this.editModel.controller.Guid,
      ModuleGroupId: null,
      Name: this.newAggregateName.value,
      ProductType: aggProductType,
      SerialNumber: null
    };

    this.controllerService.registerModule(reg).subscribe(result => {
      if (result) {
        this.editModel.controller.Modules.push(result);
        this.showMessage(`Successfully registered aggregate module ${result.Name}`);
        this.targetAggregateModules.push({value: result.Guid, caption: result.Name});

        setTimeout(() => this.aggregateTo.setValue(result.Guid));
        // this.changes = true;
      }
    }, error => this.handleError(error));

    return false;
  }

  public update() {
    this.controllerService.updateModule(this.mod).subscribe(
      r => {
        this.showMessage(`Successfully updated module ${this.mod.Name}`);
        this.dialogRef.close(this.mod);
      },
      error => this.handleError(error)
    );
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  protected showModelError(message: string, key: string, errors: string[]) {
    switch (key) {
      case 'Name':
        this.showServerErrors(this.name, errors);
        break;
      case 'GrowMedium':
        this.showServerErrors(this.growMedium, errors);
        break;
      case 'SoilECType':
        this.showServerErrors(this.soilECType, errors);
        break;
        default:
        super.showModelError(message, key, errors);
        break;
    }
  }
}
