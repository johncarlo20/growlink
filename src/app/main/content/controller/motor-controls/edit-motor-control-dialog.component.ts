import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as moment from 'moment';

import { DeviceResponse, Controller, MotorControl, SelectItem } from '@models';
import { ProgressBarService, MotorModuleService, DeviceTypesService } from '@services';
import { BaseAPIComponent } from '@util';

export interface MotorControlDialogOptions {
  deviceOptions: DeviceResponse[];
  controller: Controller;
  moduleId?: string;
}

@Component({
  selector: 'fuse-edit-motor-control-dialog',
  templateUrl: './edit-motor-control-dialog.component.html',
})
export class EditMotorControlDialogComponent extends BaseAPIComponent implements OnInit {
  editMotorForm: FormGroup;
  motorControl: MotorControl;
  moduleId: string;
  dialogOptions: MotorControlDialogOptions;
  deviceOptions: DeviceResponse[] = [];
  deviceTypes: SelectItem[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { motorControl: MotorControl; dialogOptions: MotorControlDialogOptions },
    // private userPrefsService: UserPreferencesService,
    public dialogRef: MatDialogRef<EditMotorControlDialogComponent>,
    private motorModuleService: MotorModuleService,
    private deviceTypesService: DeviceTypesService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);

    this.moduleId = data.dialogOptions.moduleId;
    this.motorControl = data.motorControl;
    this.dialogOptions = data.dialogOptions;
    this.deviceOptions = this.dialogOptions.deviceOptions;

    this.subs.add(this.deviceTypesService.DeviceTypes.subscribe((result) => {
      if (!result || !result.length) {
        return;
      }

      this.deviceTypes = this.deviceTypesService.forMotorControlSelectList();
    }));
  }

  ngOnInit() {
    super.ngOnInit();

    this.editMotorForm = new FormGroup({
      name: new FormControl(this.motorControl.Name, [Validators.required]),
      deviceType: new FormControl(this.motorControl.DeviceType, [Validators.required]),
      openDevice: new FormControl(this.motorControl.OpenDeviceId, [Validators.required, devicesValidator]),
      openDuration: new FormControl(this.motorControl.OpenDuration, [Validators.required]),
      closeDevice: new FormControl(this.motorControl.CloseDeviceId, [Validators.required, devicesValidator]),
      closeDuration: new FormControl(this.motorControl.CloseDuration, [Validators.required]),
    });

    this.subs.add(
      this.editMotorForm.valueChanges.subscribe(() => {
        const openDurationMoment = moment(this.openDuration.value, 'HH:mm:ss');
        const closeDurationMoment = moment(this.closeDuration.value, 'HH:mm:ss');

        this.motorControl.Name = this.name.value;
        this.motorControl.DeviceType = this.deviceType.value;
        this.motorControl.OpenDeviceId = this.openDevice.value;
        this.motorControl.OpenDuration = openDurationMoment.isValid() ? openDurationMoment.format('HH:mm:ss') : null;
        this.motorControl.CloseDeviceId = this.closeDevice.value;
        this.motorControl.CloseDuration = closeDurationMoment.isValid() ? closeDurationMoment.format('HH:mm:ss') : null;
      })
    );
  }

  get name() {
    return this.editMotorForm.get('name');
  }
  get deviceType() {
    return this.editMotorForm.get('deviceType');
  }
  get openDevice() {
    return this.editMotorForm.get('openDevice');
  }
  get openDuration() {
    return this.editMotorForm.get('openDuration');
  }
  get closeDevice() {
    return this.editMotorForm.get('closeDevice');
  }
  get closeDuration() {
    return this.editMotorForm.get('closeDuration');
  }

  public update() {
    if (!this.moduleId) {
      this.motorModuleService.addMotorControl(this.motorControl).subscribe(
        () => {
          this.showMessage(`Added new Motor Control`);
          this.dialogRef.close(true);
        },
        error => this.handleError(error)
      );
    } else {
      this.motorModuleService.updateMotorControl(this.moduleId, this.motorControl).subscribe(
        () => {
          this.showMessage(`Saved changes to Motor Control`);
          this.dialogRef.close(true);
        },
        error => this.handleError(error)
      );
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  protected showModelError(message: string, key: string, errors: string[]) {
    switch (key) {
      case 'Name':
        this.showServerErrors(this.name, errors);
        break;
      case 'DeviceType':
        this.showServerErrors(this.deviceType, errors);
        break;
      case 'OpenDeviceId':
        this.showServerErrors(this.openDevice, errors);
        break;
      case 'OpenDuration':
        this.showServerErrors(this.openDuration, errors);
        break;
      case 'CloseDeviceId':
        this.showServerErrors(this.closeDevice, errors);
        break;
      case 'CloseDuration':
        this.showServerErrors(this.closeDuration, errors);
        break;
      default:
        super.showModelError(message, key, errors);
        break;
    }
  }
}

let openDevValidated = false;
let closeDevValidated = false;

const devicesValidator: ValidatorFn = (control: FormControl): ValidationErrors | null => {
  const formGroup = control.parent;
  let result: ValidationErrors = null;
  if (!formGroup) {
    return null;
  }

  if (openDevValidated && closeDevValidated) {
    openDevValidated = closeDevValidated = false;
  }

  const openDeviceField = formGroup.get('openDevice');
  const closeDeviceField = formGroup.get('closeDevice');
  const openDeviceId = openDeviceField.value;
  const closeDeviceId = closeDeviceField.value;
  if (openDeviceId === closeDeviceId) {
    result = { valid: ['Open and Close device can not be the same device'] };
  }

  if (control === openDeviceField) {
    openDevValidated = true;
  }
  if (control === closeDeviceField) {
    closeDevValidated = true;
  }

  if (control !== openDeviceField && !openDevValidated) {
    openDeviceField.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }
  if (control !== closeDeviceField && !closeDevValidated) {
    closeDeviceField.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }

  return result;
};
