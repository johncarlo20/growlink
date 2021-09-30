import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, Observable } from 'rxjs';
import { BaseAPIComponent } from '@util';
import { ControllerService, ProgressBarService, ProductTypesService } from '@services';
import { ProductRegistration, Controller } from '@models';

@Component({
  selector: 'fuse-add-modules-dialog',
  templateUrl: './add-modules-dialog.component.html',
  styleUrls: ['./add-modules-dialog.component.scss']
})
export class AddModulesDialogComponent extends BaseAPIComponent implements OnInit {
  controller: Controller = new Controller();
  availableModules = new AvailableModulesDataSource([]);
  displayedRegColumns: string[] = ['name', 'type', 'serial', 'actions'];
  changes = false;
  showManualEntry = false;
  manualEntry: string = null;

  @ViewChild('manualSerial') manualSerial: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public editModel: {
      controller: Controller
    },
    public dialogRef: MatDialogRef<AddModulesDialogComponent>,
    private controllerService: ControllerService,
    private productService: ProductTypesService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);

    this.controller = editModel.controller;
  }

  ngOnInit() {
    super.ngOnInit();

    this.loadAvailableModules();
  }

  getTypeName(module: ProductRegistration): string {
    if (!module || !module.ProductType) {
      return 'Unknown';
    }

    return this.productService.FindProductType(module.ProductType).Description;
  }

  registerModule(mod: ProductRegistration) {
    this.controllerService.registerModule(mod).subscribe(result => {
      if (result) {
        this.availableModules.remove(mod);
        this.controller.Modules.push(result);
        this.showMessage(`Successfully registered module ${mod.Name}`);
        this.changes = true;
      }
    }, error => this.handleRegistrationError(mod, error));
  }

  showSerialField() {
    this.showManualEntry = true;
    setTimeout(() => this.manualSerial.nativeElement.focus());
  }

  manualSerialKey(ev: KeyboardEvent) {
    if (ev.key === 'Enter') {
      this.checkSerialField();
    }
  }

  checkSerialField() {
    this.controllerService.getUnregisteredModules([this.manualEntry]).subscribe(availManualSerials => {
      if (!availManualSerials || !availManualSerials.length) {
        this.showError(`Could not find module with serial number '${this.manualEntry}'`);
        return;
      }

      this.controllerService.getProductInventory(this.manualEntry).subscribe(productDetails => {
        const reg: ProductRegistration = {
          ContainerId: this.controller.Guid,
          ModuleGroupId: null,
          Name: productDetails.Product.Description,
          ProductType: productDetails.Product.ProductType,
          SerialNumber: productDetails.SerialNumber
        };

        this.availableModules.add(reg);
        this.manualEntry = null;

      }, error => this.handleError(error));
    }, error => this.handleError(error));
  }

  refreshModules() {
    this.availableModules.update([]);
    this.loadAvailableModules();
  }

  onClose() {
    this.dialogRef.close(this.changes);
  }

  private loadAvailableModules() {
    this.controllerService.getNewModules(this.controller.DeviceId).subscribe(newModules => {
      this.controllerService.getUnregisteredModules(newModules.map(nm => nm.sn)).subscribe(availSerials => {
        availSerials.forEach(serial => {
          this.controllerService.getProductInventory(serial).subscribe(productDetails => {
            if (!productDetails) {
              return;
            }

            const reg: ProductRegistration = {
              ContainerId: this.controller.Guid,
              ModuleGroupId: null,
              Name: productDetails.Product.Description,
              ProductType: productDetails.Product.ProductType,
              SerialNumber: productDetails.SerialNumber
            };

            this.availableModules.add(reg);
          }, error => this.handleError(error));
        });
      }, error => this.handleError(error));
    }, error => this.handleError(error));
  }

  private handleRegistrationError(mod: ProductRegistration, err: string[] | HttpErrorResponse): void {
    if (err instanceof HttpErrorResponse && err.status === 400) {
      if (err.error && err.error.ModelState) {
        if (err.error.ModelState.hasOwnProperty('SerialNumber')) {
          const errors = err.error.ModelState['SerialNumber'] as string[];
          mod.CantRegister = true;
          mod.RegistrationError = errors.join(', ');
          return;
        }
      }
    }

    this.handleError(err);
  }
}

class AvailableModulesDataSource implements DataSource<ProductRegistration> {
  private data: BehaviorSubject<ProductRegistration[]>;

  constructor(initialData?: ProductRegistration[]) {
    this.data = new BehaviorSubject<ProductRegistration[]>(initialData);
  }

  get Data(): Observable<ProductRegistration[]> {
    return this.data.asObservable();
  }
  connect(): Observable<ProductRegistration[]> {
    return this.data.asObservable();
  }

  update(newData?: ProductRegistration[]): void {
    this.data.next(newData);
  }

  disconnect(): void {
    this.data.complete();
  }

  any(): boolean {
    return this.data.value.length > 0;
  }

  add(mod: ProductRegistration) {
    const curList = [...this.data.value];
    curList.push(mod);
    this.data.next(curList);
  }

  remove(mod: ProductRegistration) {
    const curList = [...this.data.value];
    const modIdx = curList.findIndex(exist => exist.SerialNumber.toLowerCase() === mod.SerialNumber.toLowerCase());
    if (modIdx > -1) {
      curList.splice(modIdx, 1);
      this.data.next(curList);
    }
  }
}
