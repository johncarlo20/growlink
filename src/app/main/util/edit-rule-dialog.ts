import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { ControllerService, DeviceTypesService, ProductTypesService, ProgressBarService } from '@services';
import {
  DeviceBasedRule,
  DeviceResponse,
  DeviceTypeResponse,
  DeviceTypes,
  DeviceWithThrottle,
  RuleDialogOptions
} from '@models';
import { Component, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseComponent } from './base-component';

@Component({template: ''})
export abstract class EditRuleDialog<TDialog, TResult> extends BaseComponent implements OnInit {
  snackOptions: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
  };
  errorOptions: MatSnackBarConfig = {
    duration: 10000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
    panelClass: 'snack-panel-error',
  };

  dialogOptions: RuleDialogOptions;
  selectedDeviceThrottles: DeviceWithThrottle[] = [];
  private _loading = true;

  constructor(
    public dialogRef: MatDialogRef<TDialog, TResult>,
    protected deviceService: DeviceTypesService,
    protected controllerService: ControllerService,
    protected productService: ProductTypesService,
    protected progressBarService: ProgressBarService,
    protected snackbar: MatSnackBar
  ) {
    super();
  }

  ngOnInit() {
    this.subs.add(this.progressBarService.Loading.subscribe(l => (this._loading = l)));
  }

  public get loading(): boolean {
    return this._loading;
  }

  protected isUsedDevice(rule: DeviceBasedRule, dev: DeviceResponse): boolean {
    return !!rule.DeviceIds.find(devId => devId === dev.Guid);
  }

  protected isUsableDevice(dev: DeviceResponse, sharedDevices: DeviceResponse[]): boolean {
    const isSharedDevice = sharedDevices.find(
      (sharedDev) => dev.Guid === sharedDev.Guid
    );

    return (
      dev.DeviceType !== DeviceTypes.NotInUse &&
      !dev.sourceSensorId &&
      ((isSharedDevice && dev.IsShared) || !isSharedDevice)
    );
  }

  protected standardDeviceFiltering(
    rule: DeviceBasedRule,
    options: DeviceResponse[],
    sharedDevices: DeviceResponse[]
  ): DeviceResponse[] {
    return options.filter((dev) => {
      if (this.isUsedDevice(rule, dev)) {
        return true;
      }

      return this.isUsableDevice(dev, sharedDevices);
    });
  }

  protected buildSelectedDeviceThrottles(devices: string[]): boolean {
    let co2Selected = false;

    devices
      .filter((o) => this.selectedDeviceThrottles.map((s) => s.Guid).indexOf(o) === -1)
      .forEach((o) => {
        const throttle = this.dialogOptions.deviceThrottles.find((d) => d.Guid === o);
        const dev = this.dialogOptions.deviceOptions.find((d) => d.Guid === o);
        if (!throttle) {
          const newDwt = Object.assign(new DeviceWithThrottle(), {
            Guid: dev.Guid,
            Name: dev.Name,
            DeviceType: dev.DeviceType,
            InterfaceType: dev.InterfaceType,
            AllowsFade: true,
            AllowsThrottle: true,
            Throttle: 100,
            IsBACNet: true,
            BACNetValue: null,
            BACNetSuffix: dev.BacnetValueSuffix,
          });

          this.selectedDeviceThrottles.push(newDwt);

          return;
        }

        if (!throttle.Throttle) {
          throttle.Throttle = 100;
        }

        const dwt = Object.assign<DeviceWithThrottle, DeviceWithThrottle>(
          new DeviceWithThrottle(),
          throttle
        );
        this.selectedDeviceThrottles.push(dwt);

        if (!co2Selected) {
          const deviceType = this.getDeviceType(o);
          co2Selected = deviceType ? deviceType.IsCo2 : false;
        }
      });

      return co2Selected;
  }

  protected getDeviceType(deviceId: string): DeviceTypeResponse {
    const device = this.dialogOptions.deviceOptions.find((d) => d.Guid === deviceId);
    if (device) {
      const deviceType = this.deviceService.FindDeviceType(device.DeviceType);

      return deviceType;
    }

    return null;
  }

  protected showMessage(message: string) {
    this.snackbar.open(message, 'Dismiss', this.snackOptions);
  }
  protected showError(message: string) {
    this.snackbar.open(message, 'Dismiss', this.errorOptions);
  }

  protected handleError(err: string[] | HttpErrorResponse): void {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 404) {
        this.showError(`Controller is offline`);
        return;
      }

      const message = err.error.Message;

      if (err.status === 400) {
        if (err.error && err.error.ModelState) {
          for (const key in err.error.ModelState) {
            if (err.error.ModelState.hasOwnProperty(key)) {
              const errors = err.error.ModelState[key] as string[];
              this.showModelError(message, key, errors);
            }
          }
        } else {
          this.showError(`There is an error with the request`);
        }

        return;
      }

      this.showError(`API Error - ${message}`);
      return;
    } else {
      this.showError(`ERROR: ${err.join()}`);
    }
  }

  protected showServerErrors(control: AbstractControl, errors: string[] ) {
    const currentErrors = (control.getError('server')) as string[] || new Array<string>();
    errors.forEach(error => {
      if (currentErrors.find(err => err === error)) { return; }

      currentErrors.push(error);
    });
    control.setErrors({'server': currentErrors}, {emitEvent: true});
    control.markAsDirty();
    control.markAsTouched();
  }

  protected showModelError(message: string, key: string, errors: string[]) {
    console.error(`Model Errors`, message, key, errors);

    const defaultMessage = `${message}: ${errors.join(', ')} (${key})`;
    this.showError(defaultMessage);
  }
}
