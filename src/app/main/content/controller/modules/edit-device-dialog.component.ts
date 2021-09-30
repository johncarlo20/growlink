import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { DeviceResponse, DeviceTypes, SelectItem } from '@models';
import { ControllerService, ProgressBarService } from '@services';
import { BaseAPIComponent } from '@util';

@Component({
  selector: 'fuse-edit-device-dialog',
  templateUrl: './edit-device-dialog.component.html',
})
export class EditDeviceDialogComponent extends BaseAPIComponent implements OnInit {
  editDeviceForm: FormGroup;
  device: DeviceResponse;
  deviceTypes: SelectItem[] = [];
  isFixedDevice = true;
  isSharedController = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public editModel: {
      device: DeviceResponse;
      moduleId: string;
      deviceTypes: SelectItem[];
      isFixedDevice: boolean;
      sharedController: boolean;
    },
    public dialogRef: MatDialogRef<EditDeviceDialogComponent>,
    private controllerService: ControllerService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);
  }

  ngOnInit() {
    super.ngOnInit();

    this.device = { ...this.editModel.device };
    this.deviceTypes = this.editModel.deviceTypes;
    this.isFixedDevice = this.editModel.isFixedDevice;
    this.isSharedController = this.editModel.sharedController;

    this.editDeviceForm = new FormGroup({
      name: new FormControl(this.device.Name, [Validators.required]),
      devType: new FormControl(
        {
          value: this.device.DeviceType,
          disabled: this.isFixedDevice,
        },
        [Validators.required]
      ),
      maxFlow: new FormControl(this.device.MaxGallonsPerHour ? this.device.MaxGallonsPerHour : 0, [
        Validators.required,
      ]),
      isShared: new FormControl(this.device.IsShared, [Validators.required]),
    });

    this.subs.add(
      this.editDeviceForm.valueChanges.subscribe(() => {
        this.device.Name = this.name.value;
        this.device.DeviceType = this.devType.value;
        this.device.MaxGallonsPerHour = this.dosingPump ? this.maxFlow.value : null;
        this.device.IsShared = this.isShared.value;
      })
    );
  }

  get name() {
    return this.editDeviceForm.get('name');
  }
  get devType() {
    return this.editDeviceForm.get('devType');
  }
  get maxFlow() {
    return this.editDeviceForm.get('maxFlow');
  }
  get isShared() {
    return this.editDeviceForm.get('isShared');
  }
  get dosingPump() {
    return this.devType.value === DeviceTypes.DosingPumpInline;
  }

  public update() {
    this.device.ModuleId = this.editModel.moduleId;
    this.controllerService.updateDevice(this.device).subscribe(
      r => {
        this.showMessage(`Successfully updated device ${this.device.Name}`);
        this.dialogRef.close(this.device);
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
      case 'DeviceType':
        this.showServerErrors(this.devType, errors);
        break;
      case 'MaxGallonsPerHour':
        this.showServerErrors(this.maxFlow, errors);
        break;
      default:
        super.showModelError(message, key, errors);
        break;
    }
  }
}
