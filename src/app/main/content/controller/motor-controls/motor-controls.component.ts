import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ControllerService, ProgressBarService, MotorModuleService } from '@services';
import {
  Controller, ModuleResponse, MotorControl, DeviceResponse
} from '@models';
import { UploadConfirmDialogComponent } from '../upload-confirm/upload-confirm-dialog.component';
import { ConfirmDeleteDialogOptions, ConfirmDeleteDialogComponent } from '../../../dialogs/confirm-delete-dialog.component';
import { BaseAPIComponent } from '@util';
import { EntityUpdatesComponent } from '../../../entity-updates/entity-updates.component';
import { EditMotorControlDialogComponent, MotorControlDialogOptions } from './edit-motor-control-dialog.component';

@Component({
  selector: 'fuse-motor-controls',
  templateUrl: './motor-controls.component.html',
  styleUrls: ['./motor-controls.component.scss']
})
export class MotorControlsComponent extends BaseAPIComponent implements OnInit {
  controller: Controller = new Controller();
  motorControls = new MotorControlsDataSource();
  allDevices = new Array<DeviceResponse>();
  availableDevices = new Array<DeviceResponse>();
  isReadOnly = true;
  changes = false;

  motorControlColumns = ['name', 'actions'];

  constructor(
    private controllerService: ControllerService,
    private motorModuleService: MotorModuleService,
    public dialog: MatDialog,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);
  }

  ngOnInit() {
    super.ngOnInit();

    this.subs.add(
      this.controllerService.currentContainer.subscribe(c => {
        this.updateController(c);
      })
    );
  }

  canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (!this.changes) {
      return true;
    }

    const config: MatDialogConfig = {
      data: { msg: 'There are changes that have been made to the motor controls which have not been uploaded to the controller.' },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(UploadConfirmDialogComponent, config);

    return dialogRef.afterClosed().pipe(
      tap((result: boolean) => {
        if (!result) {
          this.progressBarService.SetLoading(false);
        }
      })
    );
  }

  addMotorControl() {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const newMotorControl = new MotorControl();
    newMotorControl.ControllerId = this.controller.Guid;

    this.showEditMotorControlDialog(newMotorControl);
  }

  editMotorControl(motorControl: ModuleResponse) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const editMotorControl = MotorControl.GetMotorControl(this.controller, motorControl);

    this.showEditMotorControlDialog(editMotorControl, motorControl.Guid);
  }

  deleteMotorControl(motorControl: ModuleResponse) {
    const data: ConfirmDeleteDialogOptions = {
      message: `Are you sure you want to delete motor control module ${motorControl.Name}?`,
      heading: `Delete Motor Control '${motorControl.Name}`,
    };

    const config: MatDialogConfig = { data };
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        return;
      }

      this.motorModuleService.deleteMotorControl(motorControl.Guid).subscribe(
        () => {
          this.reloadController();
          this.showMessage(`Deleted Motor Control ${motorControl.Name}`);

          this.changes = true;
        },
        error => this.handleError(error)
      );
    });
  }

  viewHistory(entityId: string, entityName: string) {
    const config: MatDialogConfig = {
      panelClass: 'entity-updates-panel',
      data: { entityId, entityName, controller: this.controller },
    };

    const dialogRef = this.dialog.open(EntityUpdatesComponent, config);

    dialogRef.afterClosed().subscribe(() => { });
  }

  pushControllerUpdate(): void {
    this.controllerService.updateConfig().subscribe(
      r => {
        this.showMessage(`Controller update pushed`);
        this.changes = false;
      },
      error => this.handleError(error)
    );
  }

  reloadController() {
    this.controllerService
      .setCurrentController(this.controller.Guid, true)
      .subscribe(
        result => this.controllerService.updateController(result),
        error => this.handleError(error)
      );
  }

  private updateController(controller: Controller): void {
    this.progressBarService.SetCurrentPage([
      {
        icon: 'business',
        caption: controller.Name,
        url: ['controller', controller.Guid, 'dashboard'],
      },
      { icon: 'call_merge', caption: 'Motor Controls' },
    ]);

    if (!controller || !controller.Guid) {
      return;
    }

    this.controller = controller;
    this.isReadOnly = controller.isReadOnly;

    const motorModules = this.controller.Modules
      .filter(mod => mod.MotorControl)
      .sort((a, b) => a.Name.localeCompare(b.Name));

    const usedDevices = motorModules
      .reduce((all, motor) =>
        all.concat(motor.MotorControl.OpenDeviceId, motor.MotorControl.CloseDeviceId), new Array<string>()
      );

    this.availableDevices = [];
    this.controller.Modules
      .filter(mod => !mod.MotorControl)
      .forEach(mod => {
        this.availableDevices = this.availableDevices.concat(
          // TODO: Confirm logic for which devices qualify
          mod.Devices.filter(dev => !usedDevices.some(usedDevId => usedDevId === dev.Guid))
        );
        this.allDevices = this.allDevices.concat(mod.Devices);
      });

    this.motorControls.update(motorModules);
  }

  private showEditMotorControlDialog(motorControl: MotorControl, moduleId?: string) {
    const usedHereDevices = this.allDevices
      .filter(dev => dev.Guid === motorControl.OpenDeviceId || dev.Guid === motorControl.CloseDeviceId);
    const availDevices = [...this.availableDevices]
      .concat(usedHereDevices)
      .sort((a, b) => a.Name.localeCompare(b.Name));
    const dialogOptions: MotorControlDialogOptions = {
      deviceOptions: availDevices,
      controller: this.controller,
      moduleId
    };

    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { motorControl: motorControl, dialogOptions },
    };

    const dialogRef = this.dialog.open(EditMotorControlDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: { motorControl: MotorControl }) => {
      if (!result) {
        return;
      }

      this.reloadController();
      this.changes = true;
    });
  }
}

class MotorControlsDataSource implements DataSource<ModuleResponse> {
  private data: BehaviorSubject<ModuleResponse[]>;

  constructor(initialData?: ModuleResponse[]) {
    this.data = new BehaviorSubject<ModuleResponse[]>(initialData);
  }

  get Data(): Observable<ModuleResponse[]> {
    return this.data.asObservable();
  }
  connect(): Observable<ModuleResponse[]> {
    return this.data.asObservable();
  }

  update(newData?: ModuleResponse[]): void {
    this.data.next(newData);
  }

  disconnect(): void {
    this.data.complete();
  }
}
