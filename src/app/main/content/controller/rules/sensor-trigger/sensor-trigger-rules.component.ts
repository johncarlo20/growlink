import { Component, OnInit, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DeviceSensorTriggerResponse, DeviceSensorTrigger, DeviceWithThrottle, RuleDialogOptions } from '@models';
import { GenericDataSource } from '@util';
import { ParticleSensorsService, ProgressBarService, ControllerService } from '@services';
import { EditSensorTriggerDialogComponent, EditSensorTriggerDialogOptions, EditSensorTriggerDialogResult } from '../sensor-trigger/edit-sensor-trigger-dialog.component';
import { RulesTableBaseComponent, SortOrders } from '../rules-table.base';

@Component({
  selector: 'fuse-sensor-trigger-rules',
  templateUrl: './sensor-trigger-rules.component.html',
  styleUrls: ['./sensor-trigger-rules.component.scss'],
})
export class SensorTriggerRulesComponent extends RulesTableBaseComponent implements OnInit {
  @Input()
  set SensorTriggers(value: DeviceSensorTriggerResponse[]) {
    this._triggers = value;

    const triggers = this._triggers.map(trigger =>
      DeviceSensorTrigger.GetSensorTrigger(
        this.particleSensorService,
        this.sensorOptions,
        this.deviceOptions,
        this.dosingRecipes,
        trigger
      )
    );

    this.sortTriggerRules(triggers);
    this.dataSource.update(triggers);
  }
  get SensorTriggers() {
    return this._triggers;
  }

  private _triggers: DeviceSensorTriggerResponse[] = [];
  dataSource = new GenericDataSource<DeviceSensorTrigger>([]);
  triggerColumns = ['device', 'sensor', 'condition', 'timeOfDay', 'actions'];
  selectedTrigger: DeviceSensorTrigger = null;

  constructor(
    public particleSensorService: ParticleSensorsService,
    private controllerService: ControllerService,
    dialog: MatDialog,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(dialog, progressBarService, snackbar);

    this.sortColumn = 'device';
    this.sortOrder = 'asc';
  }

  ngOnInit() {
    super.ngOnInit();
  }

  selectTrigger(row: DeviceSensorTrigger) {
    this.selectedTrigger = row;
  }

  editTrigger(row: DeviceSensorTrigger) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const editTrigger = Object.assign<DeviceSensorTrigger, Partial<DeviceSensorTrigger>>(
      new DeviceSensorTrigger(),
      { ...row }
    );
    const throttles = row.getDeviceThrottles(this.deviceAllowsThrottles);

    this.showSensorTriggerDialog(editTrigger, throttles);
  }
  deleteTrigger(trigger: DeviceSensorTrigger) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    if (window.confirm('Delete this trigger?')) {
      this.controllerService.deleteDeviceSensorTrigger(trigger.Id).subscribe(
        () => {
          this.deleteTriggerRule(trigger);
          this.showMessage(`Successfully removed Sensor Trigger`);
          const requiresUpdate = trigger.IsActive && this.ruleGroup && this.ruleGroup.IsActive;
          if (requiresUpdate) {
            this.ruleChanged.emit(true);
          }
          this.ruleGroupChanged.emit(true);
        },
        error => this.handleError(error)
      );
    }
  }
  setTriggerActive(_event: MatSlideToggleChange, trigger: DeviceSensorTrigger) {
    const existTrigger = this.controller.SensorTriggers.find(t => t.Id === trigger.Id);
    const activeRuleGroup = this.ruleGroup.IsActive;
    const updatedTrigger: DeviceSensorTriggerResponse = {
      ...existTrigger,
      IsActive: !existTrigger.IsActive,
    };
    this.controllerService.updateDeviceSensorTrigger(updatedTrigger).subscribe(
      () => {
        this.replaceOrAddTriggerRule(updatedTrigger);
        this.showMessage(
          `Set Sensor Trigger to ${updatedTrigger.IsActive ? 'Active' : 'Inactive'}`
        );
        this.checkDosingRecipeNeedUpdate(updatedTrigger.DosingRecipeId);
        if (activeRuleGroup) {
          this.pushUpdate.emit(true);
        }
        this.ruleGroupChanged.emit(true);
      },
      error => this.handleError(error)
    );
  }

  addSensorTrigger() {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const newTrigger = new DeviceSensorTrigger();
    newTrigger.RuleGroupId = this.ruleGroup.Id;

    this.showSensorTriggerDialog(newTrigger, this.getDeviceThrottles());
  }

  private showSensorTriggerDialog(
    trigger: DeviceSensorTrigger,
    deviceThrottles: DeviceWithThrottle[]
  ) {
    const dialogOptions: RuleDialogOptions = {
      deviceOptions: this.deviceOptions,
      sharedDeviceOptions: this.sharedDevices,
      sensorOptions: this.sensorOptions,
      deviceThrottles: deviceThrottles,
      controller: this.controller,
    };

    const config: MatDialogConfig<EditSensorTriggerDialogOptions> = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { trigger: trigger, dialogOptions },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(EditSensorTriggerDialogComponent, config);
    const wasActive = trigger.IsActive;

    dialogRef.afterClosed().subscribe((result: EditSensorTriggerDialogResult) => {
      if (!result) {
        return;
      }

      const resTrigger = result.trigger;
      this.replaceOrAddTriggerRule(resTrigger);
      const requiresUpdate =
        (resTrigger.IsActive !== wasActive || resTrigger.IsActive) && this.ruleGroup.IsActive;
      if (requiresUpdate && result.needsUpdate) {
        this.ruleChanged.emit(true);
        this.checkDosingRecipeNeedUpdate(resTrigger.DosingRecipeId);
      }
      this.ruleGroupChanged.emit(true);
    });
  }

  private replaceOrAddTriggerRule(newTriggerResponse: DeviceSensorTriggerResponse) {
    const existTriggers = [...this.dataSource.Current];
    const newTrigger = DeviceSensorTrigger.GetSensorTrigger(
      this.particleSensorService,
      this.sensorOptions,
      this.deviceOptions,
      this.dosingRecipes,
      newTriggerResponse
    );
    const existIdx = existTriggers.findIndex(exist => exist.Id === newTriggerResponse.Id);
    const existRulegroupIdx = this.ruleGroup.SensorTriggers.findIndex(exist => exist.Id === newTriggerResponse.Id);
    const existControllerIdx = this.controller.SensorTriggers.findIndex(
      exist => exist.Id === newTriggerResponse.Id
    );
    if (existIdx >= 0) {
      existTriggers.splice(existIdx, 1, newTrigger);
    } else {
      existTriggers.push(newTrigger);
    }
    if (existRulegroupIdx >= 0) {
      this.ruleGroup.SensorTriggers.splice(existRulegroupIdx, 1, newTriggerResponse);
    } else {
      this.ruleGroup.SensorTriggers.push(newTriggerResponse);
    }
    if (existControllerIdx >= 0) {
      this.controller.SensorTriggers.splice(existControllerIdx, 1, newTriggerResponse);
    } else {
      this.controller.SensorTriggers.push(newTriggerResponse);
    }
    this.sortTriggerRules(existTriggers);
    this.dataSource.update(existTriggers);
  }

  private deleteTriggerRule(trigger: DeviceSensorTrigger) {
    const existTriggers = [...this.dataSource.Current];
    const existIdx = existTriggers.findIndex(exist => exist.Id === trigger.Id);
    const existRulegroupIdx = this.ruleGroup.SensorTriggers.findIndex(exist => exist.Id === trigger.Id);
    const existControllerIdx = this.controller.SensorTriggers.findIndex(
      exist => exist.Id === trigger.Id
    );
    if (existIdx >= 0) {
      existTriggers.splice(existIdx, 1);
    }
    if (existRulegroupIdx >= 0) {
      this.ruleGroup.SensorTriggers.splice(existRulegroupIdx, 1);
    }
    if (existControllerIdx >= 0) {
      this.controller.SensorTriggers.splice(existControllerIdx, 1);
    }
    this.sortTriggerRules(existTriggers);
    this.dataSource.update(existTriggers);
  }

  private sortTriggerRules(triggers: DeviceSensorTrigger[]) {
    triggers.sort((a, b) => {
      switch (this.sortColumn) {
        case 'timeOfDay':
          const aTimeOfDay = a.DayNightOption;
          const bTimeOfDay = b.DayNightOption;
          return this.sortOrder === 'asc' ? aTimeOfDay - bTimeOfDay : bTimeOfDay - aTimeOfDay;
        case 'condition':
          const aCondition = a.Condition;
          const bCondition = b.Condition;
          return this.sortOrder === 'asc' ? aCondition.localeCompare(bCondition) : bCondition.localeCompare(aCondition);
        case 'sensor':
          const aSensor = a.SensorName || '';
          const bSensor = b.SensorName || '';
          return this.sortOrder === 'asc' ? aSensor.localeCompare(bSensor) : bSensor.localeCompare(aSensor);
        default:
          const aName = a.DisplayName || a.DeviceNames;
          const bName = b.DisplayName || b.DeviceNames;
          return this.sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
      }
    });
  }

  sortOrderChange(ev: {active: string; direction: SortOrders}) {
    const existTriggers = [...this.dataSource.Current];
    if (ev.direction === '') {
      this.sortColumn = 'device';
      this.sortOrder = 'asc';
    } else {
      this.sortColumn = ev.active;
      this.sortOrder = ev.direction;
    }
    this.sortTriggerRules(existTriggers);
    this.dataSource.update(existTriggers);
  }
}
