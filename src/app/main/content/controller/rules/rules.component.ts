import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Observable, BehaviorSubject, forkJoin, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import {
  ControllerService,
  ProgressBarService,
  AuthenticationService,
  UserPreferencesService,
  ProductTypesService,
  DeviceTypesService,
  ActiveControllerService,
} from '@services';
import {
  Controller,
  RuleGroup,
  ModuleResponse,
  DeviceTypes,
  SensorResponse,
  DeviceResponse,
  SensorAlertResponse,
  CustomerResponse,
  DeviceAllowThrottle,
  InterfaceType,
} from '@models';
import { CanComponentDeactivate } from '../../../guards/can-deactivate.guard';
import { UploadConfirmDialogComponent } from '../upload-confirm/upload-confirm-dialog.component';
import { EntityUpdatesComponent } from '../../../entity-updates/entity-updates.component';
import { RuleGroupDialogComponent } from './rulegroup/rule-group-dialog.component';
import { BaseAPIComponent } from '@util';
import {
  ConfirmRulegroupActivationDialogComponent,
  ConfirmRulegroupActivationDialogOptions
} from './confirm-rulegroup-activation-dialog/confirm-rulegroup-activation-dialog.component';

export interface PanelStates {
  triggers: boolean;
  timers: boolean;
  schedules: boolean;
  tasks: boolean;
  alerts: boolean;
  programs: boolean;
  expanded: boolean;
}

@Component({
  selector: 'fuse-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss'],
})
export class RulesComponent extends BaseAPIComponent implements OnInit, CanComponentDeactivate {
  controller: Controller = new Controller();
  currentUser: CustomerResponse;
  ruleGroups: BehaviorSubject<RuleGroup[]> = new BehaviorSubject<RuleGroup[]>([]);
  motorDevices: string[] = [];
  deviceOptions: DeviceResponse[] = [];
  sharedDevices: DeviceResponse[] = [];
  sensorOptions: SensorResponse[] = [];
  deviceAllowsThrottles: DeviceAllowThrottle[] = [];
  isReadOnly = true;
  changes = false;
  additionalControllerUpdates: string[] = [];

  ruleGroupStates: { [index: string]: PanelStates } = {};

  constructor(
    private authenticationService: AuthenticationService,
    private controllerService: ControllerService,
    private activeControllerService: ActiveControllerService,
    private productService: ProductTypesService,
    private deviceTypesService: DeviceTypesService,
    private userPrefsService: UserPreferencesService,
    public dialog: MatDialog,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);
  }

  ngOnInit() {
    super.ngOnInit();

    this.subs.add(
      this.controllerService.currentContainer.subscribe((r) => {
        this.updateController(r);
      })
    );
    this.subs.add(
      this.authenticationService.User.subscribe((user) => {
        this.currentUser = user;
      })
    );
  }

  canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (!this.changes) {
      return true;
    }

    const config: MatDialogConfig = {
      data: {
        msg:
          'There are changes that have been made to the active rule group which have not been uploaded to the controller.',
      },
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

  ruleWasChanged() {
    this.changes = true;
  }

  ruleGroupWasChanged() {
    const ruleGroups = this.ruleGroups.getValue();
    this.ruleGroups.next(ruleGroups);
  }

  updatePushed() {
    this.pushControllerUpdate();
  }

  addRuleGroup() {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const newRuleGroup = new RuleGroup(null, this.controller.Guid);

    this.showRuleGroupDialog(newRuleGroup);
  }
  editRuleGroup(rg: RuleGroup, ev: MouseEvent) {
    this.ignoreClick(ev);
    const editRG = new RuleGroup(rg, rg.ContainerId);
    this.showRuleGroupDialog(editRG);
  }
  duplicateRuleGroup(rg: RuleGroup, ev: MouseEvent) {
    this.ignoreClick(ev);
    if (window.confirm(`Duplicate rule group '${rg.Name}'?`)) {
      this.controllerService.duplicateRuleGroup(rg).subscribe(
        (result) => {
          const newGroup = new RuleGroup(result, this.controller.Guid);
          this.controllerService.setCurrentController(this.controller.Guid).subscribe(
            (updated) => {
              newGroup.SensorTriggers = updated.SensorTriggers.filter(
                (trigger) => trigger.RuleGroupId === newGroup.Id
              );
              newGroup.Timers = updated.Timers.filter((timer) => timer.RuleGroupId === newGroup.Id);
              newGroup.Schedules = updated.Schedules.filter(
                (schedule) => schedule.RuleGroupId === newGroup.Id
              );
              newGroup.ManualTasks = updated.ManualTasks.filter(
                (task) => task.RuleGroupId === newGroup.Id
              );
              newGroup.Alerts = updated.Modules.reduce(
                (sensors, mod) => sensors.concat(mod.Sensors),
                new Array<SensorResponse>()
              )
                .reduce(
                  (alerts, sensor) => alerts.concat(sensor.Alerts),
                  new Array<SensorAlertResponse>()
                )
                .filter((alert) => alert.RuleGroupId === newGroup.Id);

              this.replaceOrAddRuleGroupEntry(newGroup);
              this.sortRuleGroups();

              this.showMessage(`Duplicated Rule Group ${rg.Name} to ${result.Name}`);
            },
            (error) => this.handleError(error)
          );
        },
        (error) => this.handleError(error)
      );
    }
  }
  deleteRuleGroup(rg: RuleGroup, ev: MouseEvent) {
    this.ignoreClick(ev);
    if (window.confirm(`Delete rule group '${rg.Name}'?`)) {
      this.controllerService.deleteRuleGroup(rg).subscribe(
        () => {
          this.deleteRuleGroupEntry(rg);
          this.showMessage(`Deleted Rule Group ${rg.Name}`);
          const requiresUpdate = rg.IsActive;
          this.changes = requiresUpdate;

          this.activeControllerService.updateActiveRuleGroup();
        },
        (error) => this.handleError(error)
      );
    }
  }

  setActiveGroup(event: MatSlideToggleChange, ruleGroup: RuleGroup) {
    const message = !ruleGroup.IsActive
      ? `Are you sure you want to activate the '${ruleGroup.Name}' rule group?`
      : `Are you sure you want to deactivate the current rule group?`;

    const currentRuleGroups = this.ruleGroups.getValue();
    const currentActiveRG = currentRuleGroups.find(rg => rg.IsActive && rg.Id !== ruleGroup.Id);
    const lights = this.deviceOptions.filter(dev => {
      const devType = this.deviceTypesService.FindDeviceType(dev.DeviceType);
      return devType.IsLight;
    });
    const currentLightingSchedules = currentActiveRG && currentActiveRG.Schedules.filter(sch => lights.some(d => d.Guid === sch.DeviceId));
    const newLightingSchedules = ruleGroup.Schedules.filter(sch => lights.some(d => d.Guid === sch.DeviceId));
    const hasLightingSchedules = currentLightingSchedules && (currentLightingSchedules.length > 0 || newLightingSchedules.length > 0);

    const currentScheduleDescs = currentLightingSchedules && currentLightingSchedules.map(sch => this.controllerService.getScheduleDescription(sch));
    const newScheduleDescs = newLightingSchedules.map(sch => this.controllerService.getScheduleDescription(sch));

    const dialogOptions: ConfirmRulegroupActivationDialogOptions = {
      message: message,
      hasLights: hasLightingSchedules,
      currentDescs: currentScheduleDescs,
      newDescs: newScheduleDescs,
    };

    const config: MatDialogConfig<ConfirmRulegroupActivationDialogOptions> = {
      maxWidth: '50vw',
      data: dialogOptions,
      disableClose: true,
    };

    const dialogRef = this.dialog.open(ConfirmRulegroupActivationDialogComponent, config);
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        event.source.writeValue(ruleGroup.IsActive);
        return;
      }

      if (!ruleGroup.IsActive) {
        const updates: Observable<boolean>[] = [];
        const updatedRuleGroups: RuleGroup[] = [];
        currentRuleGroups.forEach((rg) => {
          if (rg.IsActive && rg.Id !== ruleGroup.Id) {
            rg.IsActive = false;
            this.checkDosingRecipeNeedUpdate(rg);
            updates.push(this.controllerService.updateRuleGroup(rg));
          } else if (rg.Id === ruleGroup.Id) {
            rg.IsActive = true;
            this.checkDosingRecipeNeedUpdate(rg);
            updates.push(this.controllerService.updateRuleGroup(rg));
          }
          updatedRuleGroups.push(rg);
        });

        forkJoin(updates).subscribe(
          () => {
            this.ruleGroups.next(updatedRuleGroups);
            this.showMessage(`Activated Rule Group ${ruleGroup.Name}`);
            this.pushControllerUpdate();
          },
          (error) => this.handleError(error)
        );
      } else {
        ruleGroup.IsActive = false;
        this.checkDosingRecipeNeedUpdate(ruleGroup);
        this.controllerService.updateRuleGroup(ruleGroup).subscribe(
          () => {
            this.replaceOrAddRuleGroupEntry(ruleGroup);
            this.showMessage(`Deactivated Rule Group ${ruleGroup.Name}`);
            this.pushControllerUpdate();
          },
          (error) => this.handleError(error)
        );
      }

      currentRuleGroups.forEach((rg) => {
        const controllerRg = this.controller.RuleGroups.find((crg) => crg.Id === rg.Id);
        if (controllerRg) {
          controllerRg.IsActive = rg.IsActive;
        }
      });

      event.source.writeValue(ruleGroup.IsActive);

      this.activeControllerService.updateActiveRuleGroup();
    });
  }

  checkDosingRecipeNeedUpdate(rg: RuleGroup) {
    for (const trigger of rg.SensorTriggers) { this.checkRuleRecipeNeedUpdate(trigger.DosingRecipeId); }
    for (const schedule of rg.Schedules) { this.checkRuleRecipeNeedUpdate(schedule.DosingRecipeId); }
    for (const timer of rg.Timers) { this.checkRuleRecipeNeedUpdate(timer.DosingRecipeId); }
    for (const task of rg.ManualTasks) { this.checkRuleRecipeNeedUpdate(task.DosingRecipeId); }
  }

  private checkRuleRecipeNeedUpdate(recipeId: string) {
    if (!recipeId) { return; }

    const recipe = this.dosingRecipes.find(dr => dr.Id === recipeId);
    if (recipe && recipe.ControllerDeviceId !== this.controller.DeviceId &&
      !this.additionalControllerUpdates.find(u => u === recipe.ControllerDeviceId)) {
      this.additionalControllerUpdates.push(recipe.ControllerDeviceId);
    }
  }

  ignoreClick(ev: MouseEvent) {
    ev.cancelBubble = true;
  }

  get dosingRecipes() {
    return [...this.controller.DosingRecipes, ...this.controller.SharedDosingRecipes];
  }

  pushControllerUpdate(): void {
    this.controllerService.updateConfig().subscribe(
      (r) => {
        this.showMessage(`Controller update pushed`);
        this.changes = false;
        this.pushAdditionalControllerUpdates();
      },
      (error) => this.handleError(error)
    );
  }

  pushAdditionalControllerUpdates(): void {
    if (this.additionalControllerUpdates.length < 1) {
      return;
    }

    const requestedUpdates: Observable<boolean>[] = [];
    this.additionalControllerUpdates.forEach((deviceId) => {
      requestedUpdates.push(
        this.controllerService.updateAdditionalConfig(deviceId).pipe(catchError(() => of(false)))
      );
    });

    forkJoin(requestedUpdates).subscribe(
      (r) => {
        if (r.some((success) => !success)) {
          this.showError(`Additional Controllers failed to update`);
        } else {
          this.showMessage(`Additional Controllers updates pushed`);
          this.additionalControllerUpdates = [];
        }
      },
      (error) => this.handleError(error)
    );
  }

  controllerUpdateRequested(deviceId: string) {
    if (this.additionalControllerUpdates.some((exist) => exist === deviceId)) {
      return;
    }

    this.additionalControllerUpdates.push(deviceId);
  }

  viewHistory(entityId: string, entityName: string) {
    const config: MatDialogConfig = {
      panelClass: 'entity-updates-panel',
      data: { entityId, entityName, controller: this.controller },
    };

    const dialogRef = this.dialog.open(EntityUpdatesComponent, config);

    dialogRef.afterClosed().subscribe(() => {});
  }

  private updateController(controller: Controller): void {
    this.progressBarService.SetCurrentPage([
      {
        icon: 'business',
        caption: controller.Name,
        url: ['controller', controller.Guid, 'dashboard'],
      },
      { icon: 'device_hub', caption: 'Rules' },
    ]);

    if (controller.Guid === undefined) {
      return;
    }

    let newRuleGroups: RuleGroup[] = [];
    if (this.controller && controller.DeviceId !== this.controller.DeviceId) {
      newRuleGroups = controller.RuleGroups.map((rgr) => new RuleGroup(rgr, controller.Guid));
      this.resetData();
    } else {
      newRuleGroups = this.ruleGroups.value.filter((exist) =>
        controller.RuleGroups.find((rg) => rg.Id === exist.Id)
      );
      controller.RuleGroups.forEach((rg) => {
        const target = newRuleGroups.find((exist) => exist.Id === rg.Id);
        if (!target) {
          newRuleGroups.push(new RuleGroup(rg, controller.Guid));
        } else {
          target.Name = rg.Name;
        }
      });
      newRuleGroups.forEach((rg) => {
        rg.Alerts = [];
        rg.Schedules = [];
        rg.SensorTriggers = [];
        rg.Timers = [];
        rg.ManualTasks = [];
        rg.CropSteeringPrograms = [];
      });
    }

    newRuleGroups.forEach((rg) => {
      this.newRuleGroupState(rg);
    });
    this.ruleGroups.next(newRuleGroups);
    this.sortRuleGroups();

    this.controller = controller;

    this.sharedDevices = controller.SharedModules.reduce(
      (all, mod) => all.concat(mod.Devices),
      new Array<DeviceResponse>()
    );

    this.motorDevices = [];

    // First, identify all the motor control devices, so we can ignore them all
    for (const mod of this.controller.Modules) {
      if (!mod.MotorControl) {
        continue;
      }

      if (!this.motorDevices.find((devId) => devId === mod.MotorControl.OpenDeviceId)) {
        this.motorDevices.push(mod.MotorControl.OpenDeviceId);
      }
      if (!this.motorDevices.find((devId) => devId === mod.MotorControl.CloseDeviceId)) {
        this.motorDevices.push(mod.MotorControl.CloseDeviceId);
      }
    }

    controller.Modules.filter((m) => m.Sensors.length).forEach((m) => {
      this.loadSensorAlerts(m.Sensors);
    });

    this.subs.add(this.deviceTypesService.DeviceTypes.subscribe((result) => {
      if (!result || !result.length) {
        return;
      }

      controller.SharedModules.filter((m) => m.Devices.length).forEach((m) => {
        this.loadDeviceThrottles(m);
      });

      controller.Modules.filter((m) => m.Devices.length).forEach((m) => {
        this.loadDeviceThrottles(m);
      });
    }));

    this.loadDeviceRules(controller);

    this.isReadOnly = controller.isReadOnly;
  }

  private loadDeviceRules(controller: Controller) {
    const newRuleGroups = this.ruleGroups.getValue();

    if (controller.Schedules.length) {
      newRuleGroups.forEach(
        (rg) =>
          (rg.Schedules = rg.Schedules.concat(
            controller.Schedules.filter((s) => s.RuleGroupId === rg.Id && !rg.Schedules.some(exist => exist.Id === s.Id))
          ))
      );
    }
    if (controller.SensorTriggers.length) {
      newRuleGroups.forEach(
        (rg) =>
          (rg.SensorTriggers = rg.SensorTriggers.concat(
            controller.SensorTriggers.filter((s) => s.RuleGroupId === rg.Id && !rg.SensorTriggers.some(exist => exist.Id === s.Id))
          ))
      );
    }
    if (controller.Timers.length) {
      newRuleGroups.forEach(
        (rg) =>
          (rg.Timers = rg.Timers.concat(controller.Timers.filter((s) => s.RuleGroupId === rg.Id && !rg.Timers.some(exist => exist.Id === s.Id))))
      );
    }
    if (controller.ManualTasks && controller.ManualTasks.length) {
      newRuleGroups.forEach(
        (rg) =>
          (rg.ManualTasks = rg.ManualTasks.concat(
            controller.ManualTasks.filter((s) => s.RuleGroupId === rg.Id && !rg.ManualTasks.some(exist => exist.Id === s.Id))
          ))
      );
    }

    this.ruleGroups.next(newRuleGroups);
  }

  private resetData(): void {
    this.sensorOptions = [];
    this.deviceOptions = [];
    this.sharedDevices = [];
    this.deviceAllowsThrottles = [];
    this.ruleGroupStates = {};
    this.changes = false;
    this.additionalControllerUpdates = [];
  }

  private loadSensorAlerts(sensors: SensorResponse[]): void {
    const currentRuleGroups = this.ruleGroups.getValue();
    sensors.forEach((s) => {
      if (s.IsEligibleForRules || s.Alerts.length) {
        const existOption = this.sensorOptions.find((exist) => s.Guid === exist.Guid);
        if (!existOption) {
          this.sensorOptions.push(s);
        } else {
          existOption.ReadingSuffix = s.ReadingSuffix;
          existOption.MinRange = s.MinRange;
          existOption.MaxRange = s.MaxRange;
        }
      }
      if (s.Alerts.length) {
        s.Alerts.forEach((a) => {
          const sa = Object.assign(new SensorAlertResponse(), a);
          sa.SensorId = s.Guid;
          const grp = currentRuleGroups.find((rg) => rg.Id === sa.RuleGroupId);
          if (grp && !grp.Alerts.some(exist => exist.Id === a.Id)) {
            grp.Alerts.push(sa);
          }
        });
      }
    });
  }

  private loadDeviceThrottles(module: ModuleResponse): void {
    const productType = this.productService.FindProductType(module.ProductType);
    const allowsThrottle = productType && productType.AllowsRuleThrottling;
    const allowsFade = productType && productType.IsLightingController;
    const isBACNet = productType && (productType.Name === 'BacnetGateway' || productType.Name === 'BacnetMstp');

    const devices = [...module.Devices];

    devices.forEach((d) => {
      const deviceType = this.deviceTypesService.FindDeviceType(d.DeviceType);
      if (this.motorDevices.find((devId) => d.Guid === devId)) {
        return;
      }
      if (!this.deviceOptions.find((exist) => d.Guid === exist.Guid)) {
        this.deviceOptions.push({ ...d, ModuleId: d.ModuleId || module.Guid });
      }

      let deviceAllowsThrottle = allowsThrottle;
      if (!deviceAllowsThrottle && productType.Name === 'LightingControllerIluminar') {
        deviceAllowsThrottle = d.DeviceType === DeviceTypes.LightAnalog ||
          d.DeviceType === DeviceTypes.LightAnalogCmh ||
          d.DeviceType === DeviceTypes.LightAnalogHps ||
          d.DeviceType === DeviceTypes.LightAnalogLed;
      }
      if (!deviceAllowsThrottle && this.controller.EnableInlineDosing) {
        deviceAllowsThrottle =
          (productType.Name === 'SixteenChannelOutputExpansionModule' ||
            productType.Name === 'Ec3' ||
            productType.Name === 'Ec6') &&
          (d.DeviceType === DeviceTypes.DosingPump ||
            d.DeviceType === DeviceTypes.DosingPumpInline);
      }
      let deviceAllowsFade = allowsFade;
      if (!deviceAllowsFade && productType.Name === 'EightChannelAnalogExpansionModule') {
        deviceAllowsFade = deviceType.IsLight;
      }
      this.deviceAllowsThrottles.push({
        Guid: d.Guid,
        Name: d.Name,
        DeviceType: d.DeviceType,
        InterfaceType: d.InterfaceType,
        AllowsFade: deviceAllowsFade,
        AllowsThrottle: deviceAllowsThrottle,
        IsBACNet: isBACNet,
        BACNetSuffix: d.BacnetValueSuffix,
      });
    });
  }

  private showRuleGroupDialog(rg: RuleGroup) {
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: rg,
      disableClose: true,
    };

    const dialogRef = this.dialog.open(RuleGroupDialogComponent, config);
    const wasActive = rg.IsActive;

    dialogRef.afterClosed().subscribe((result: RuleGroup) => {
      if (!result) {
        return;
      }

      this.replaceOrAddRuleGroupEntry(result);
      const requiresUpdate = result.IsActive !== wasActive;
      this.changes = requiresUpdate;

      this.activeControllerService.updateActiveRuleGroup();
    });
  }

  private replaceOrAddRuleGroupEntry(newRG: RuleGroup) {
    const newRuleGroups = [...this.ruleGroups.getValue()];
    const existIdx = newRuleGroups.findIndex((exist) => exist.Id === newRG.Id);
    const existControllerIdx = this.controller.RuleGroups.findIndex(
      (exist) => exist.Id === newRG.Id
    );
    if (existIdx >= 0) {
      newRuleGroups.splice(existIdx, 1, newRG);
    } else {
      const newGroup = new RuleGroup(newRG, this.controller.Guid);
      newRuleGroups.push(newGroup);
    }
    if (existControllerIdx >= 0) {
      this.controller.RuleGroups.splice(existControllerIdx, 1, newRG);
    } else {
      this.controller.RuleGroups.push(newRG);
    }
    this.ruleGroups.next(newRuleGroups);

    const existRGState = this.ruleGroupStates[newRG.Id];
    if (!existRGState) {
      this.newRuleGroupState(newRG);
    }
  }

  private newRuleGroupState(ruleGroup: RuleGroup) {
    if (!!this.ruleGroupStates[ruleGroup.Id]) {
      return;
    }

    this.ruleGroupStates[ruleGroup.Id] = {
      alerts: false,
      triggers: false,
      tasks: false,
      schedules: false,
      timers: false,
      programs: false,
      expanded: ruleGroup.IsActive,
    };
  }

  private deleteRuleGroupEntry(ruleGroup: RuleGroup) {
    const newRuleGroups = [...this.ruleGroups.getValue()];
    const existIdx = newRuleGroups.findIndex((exist) => exist.Id === ruleGroup.Id);
    const existControllerIdx = this.controller.RuleGroups.findIndex(
      (exist) => exist.Id === ruleGroup.Id
    );
    if (existIdx >= 0) {
      newRuleGroups.splice(existIdx, 1);
    }
    if (existControllerIdx >= 0) {
      this.controller.RuleGroups.splice(existControllerIdx, 1);
    }
    this.ruleGroups.next(newRuleGroups);

    this.ruleGroupStates[ruleGroup.Id] = undefined;
  }

  private sortRuleGroups() {
    const newRuleGroups = [...this.ruleGroups.getValue()];
    newRuleGroups.sort((a, b) => a.Name.localeCompare(b.Name));

    this.ruleGroups.next(newRuleGroups);
  }
}
