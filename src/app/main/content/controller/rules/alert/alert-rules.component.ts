import { Component, OnInit, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { SensorAlertResponse, SensorAlert, SensorResponse, RuleDialogOptions } from '@models';
import { GenericDataSource } from '@util';
import { ParticleSensorsService, ProgressBarService, ControllerService } from '@services';
import { EditAlertDialogComponent } from '../alert/edit-alert-dialog.component';
import { RulesTableBaseComponent, SortOrders } from '../rules-table.base';

@Component({
  selector: 'fuse-alert-rules',
  templateUrl: './alert-rules.component.html',
  styleUrls: ['./alert-rules.component.scss'],
})
export class AlertRulesComponent extends RulesTableBaseComponent implements OnInit {
  @Input()
  set Alerts(value: SensorAlertResponse[]) {
    this._alerts = value;

    const alerts = this._alerts.map(alert =>
      SensorAlert.GetAlert(
        this.particleSensorService,
        this.sensorOptions,
        alert
      )
    );

    this.sortAlertRules(alerts);
    this.dataSource.update(alerts);
  }
  get Alerts() {
    return this._alerts;
  }

  private _alerts: SensorAlertResponse[] = [];
  dataSource = new GenericDataSource<SensorAlert>([]);
  alertColumns = ['timeOfDay', 'sensor', 'condition', 'actions'];
  selectedAlert: SensorAlert = null;

  constructor(
    public particleSensorService: ParticleSensorsService,
    private controllerService: ControllerService,
    dialog: MatDialog,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(dialog, progressBarService, snackbar);

    this.sortColumn = 'sensor';
    this.sortOrder = 'asc';
  }

  ngOnInit() {
    super.ngOnInit();
  }

  selectAlert(row: SensorAlert) {
    this.selectedAlert = row;
  }

  editAlert(row: SensorAlert) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const editAlert = Object.assign<SensorAlert, Partial<SensorAlert>>(new SensorAlert(), {
      ...row,
    });

    this.showAlertDialog(editAlert);
  }
  deleteAlert(alert: SensorAlert) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    if (window.confirm('Delete this alert?')) {
      this.controllerService.deleteSensorAlert(alert.Id).subscribe(
        () => {
          this.deleteAlertRule(alert);
          this.showMessage(`Successfully removed Sensor Alert`);
          this.ruleGroupChanged.emit(true);
        },
        error => this.handleError(error)
      );
    }
  }
  setAlertActive(_event: MatSlideToggleChange, alert: SensorAlert) {
    const existAlert = this.ruleGroup.Alerts.find(t => t.Id === alert.Id);
    const activeRuleGroup = this.ruleGroup.IsActive;
    const updatedAlert: SensorAlertResponse = { ...existAlert, IsActive: !existAlert.IsActive };
    this.controllerService.updateSensorAlert(updatedAlert).subscribe(
      () => {
        this.replaceOrAddAlertRule(updatedAlert);
        this.showMessage(`Set Sensor Alert to ${updatedAlert.IsActive ? 'Active' : 'Inactive'}`);
        if (activeRuleGroup) {
          this.pushUpdate.emit(true);
        }
        this.ruleGroupChanged.emit(true);
      },
      error => this.handleError(error)
    );
  }

  addAlert() {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const newAlert = new SensorAlert();
    newAlert.RuleGroupId = this.ruleGroup.Id;

    this.showAlertDialog(newAlert);
  }

  private showAlertDialog(alert: SensorAlert) {
    const dialogOptions: RuleDialogOptions = {
      deviceOptions: this.deviceOptions,
      sharedDeviceOptions: this.sharedDevices,
      sensorOptions: this.sensorOptions,
      deviceThrottles: [],
      controller: this.controller,
    };

    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { alert: alert, dialogOptions },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(EditAlertDialogComponent, config);
    const wasActive = alert.IsActive;

    dialogRef.afterClosed().subscribe((result: SensorAlertResponse) => {
      if (!result) {
        return;
      }

      this.replaceOrAddAlertRule(result);
      this.ruleGroupChanged.emit(true);
    });
  }

  private replaceOrAddAlertRule(newAlertResponse: SensorAlertResponse) {
    const existAlerts = [...this.dataSource.Current];
    const newAlert = SensorAlert.GetAlert(
      this.particleSensorService,
      this.sensorOptions,
      newAlertResponse
    );
    const existIdx = existAlerts.findIndex(exist => exist.Id === newAlertResponse.Id);
    const existRulegroupIdx = this.ruleGroup.Alerts.findIndex(exist => exist.Id === newAlertResponse.Id);
    if (existIdx >= 0) {
      existAlerts.splice(existIdx, 1, newAlert);
    } else {
      existAlerts.push(newAlert);
    }
    if (existRulegroupIdx >= 0) {
      this.ruleGroup.Alerts.splice(existRulegroupIdx, 1, newAlertResponse);
    } else {
      this.ruleGroup.Alerts.push(newAlertResponse);
    }

    const sensor = this.controller.Modules.reduce(
      (all, m) => all.concat(m.Sensors),
      new Array<SensorResponse>()
    ).find(sens => sens.Guid === newAlert.SensorId);
    const existSensorIdx = sensor.Alerts.findIndex(exist => exist.Id === newAlert.Id);
    if (existSensorIdx >= 0) {
      sensor.Alerts.splice(existSensorIdx, 1, newAlertResponse);
    } else {
      sensor.Alerts.push(newAlertResponse);
    }

    this.sortAlertRules(existAlerts);
    this.dataSource.update(existAlerts);
  }

  private deleteAlertRule(alert: SensorAlert) {
    const existAlerts = [...this.dataSource.Current];
    const existIdx = existAlerts.findIndex(exist => exist.Id === alert.Id);
    const existRulegroupIdx = this.ruleGroup.Alerts.findIndex(exist => exist.Id === alert.Id);
    if (existIdx >= 0) {
      existAlerts.splice(existIdx, 1);
    }
    if (existRulegroupIdx >= 0) {
      this.ruleGroup.Alerts.splice(existRulegroupIdx, 1);
    }

    const sensor = this.controller.Modules.reduce(
      (all, m) => all.concat(m.Sensors),
      new Array<SensorResponse>()
    ).find(sens => sens.Guid === alert.SensorId);
    const existSensorIdx = sensor.Alerts.findIndex(exist => exist.Id === alert.Id);
    if (existSensorIdx >= 0) {
      sensor.Alerts.splice(existSensorIdx, 1);
    }

    this.sortAlertRules(existAlerts);
    this.dataSource.update(existAlerts);
  }

  private sortAlertRules(alerts: SensorAlert[]) {
    alerts.sort((a, b) => {
      switch (this.sortColumn) {
        case 'timeOfDay':
          const aTimeOfDay = a.DayNightOption;
          const bTimeOfDay = b.DayNightOption;
          return this.sortOrder === 'asc' ? aTimeOfDay - bTimeOfDay : bTimeOfDay - aTimeOfDay;
        case 'condition':
          const aCondition = a.Condition;
          const bCondition = b.Condition;
          return this.sortOrder === 'asc' ? aCondition.localeCompare(bCondition) : bCondition.localeCompare(aCondition);
        default:
          const aName = a.DisplayName || a.SensorName || '';
          const bName = b.DisplayName || b.SensorName || '';
          return this.sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
      }
    });
  }

  sortOrderChange(ev: {active: string; direction: SortOrders}) {
    const existAlerts = [...this.dataSource.Current];
    if (ev.direction === '') {
      this.sortColumn = 'sensor';
      this.sortOrder = 'asc';
    } else {
      this.sortColumn = ev.active;
      this.sortOrder = ev.direction;
    }
    this.sortAlertRules(existAlerts);
    this.dataSource.update(existAlerts);
  }
}
