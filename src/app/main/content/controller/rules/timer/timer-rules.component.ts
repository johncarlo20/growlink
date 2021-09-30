import { Component, OnInit, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DeviceTimer, DeviceTimerResponse, DeviceWithThrottle, RuleDialogOptions, UserPrefs } from '@models';
import { GenericDataSource } from '@util';
import { ProgressBarService, ControllerService, UserPreferencesService } from '@services';
import { RulesTableBaseComponent, SortOrders } from '../rules-table.base';
import { EditTimerDialogComponent, EditTimerDialogOptions, EditTimerDialogResult } from './edit-timer-dialog.component';
import * as moment from 'moment';

@Component({
  selector: 'fuse-timer-rules',
  templateUrl: './timer-rules.component.html',
  styleUrls: ['./timer-rules.component.scss'],
})
export class TimerRulesComponent extends RulesTableBaseComponent implements OnInit {
  @Input()
  set Timers(value: DeviceTimerResponse[]) {
    this._timers = value;

    const timers = this._timers.map(timer =>
      DeviceTimer.GetTimer(
        this.controller,
        this.deviceOptions,
        this.dosingRecipes,
        timer,
        this.userPrefs.prefer24Hour
      )
    );

    this.sortTimers(timers);
    this.dataSource.update(timers);
  }
  get Timers() {
    return this._timers;
  }

  private _timers: DeviceTimerResponse[] = [];
  private userPrefs: UserPrefs;
  dataSource = new GenericDataSource<DeviceTimer>([]);
  timerColumns = ['device', 'timeOfDay', 'startTime', 'frequency', 'duration', 'actions'];
  selectedTimer: DeviceTimer = null;

  constructor(
    private controllerService: ControllerService,
    private userPrefService: UserPreferencesService,
    dialog: MatDialog,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(dialog, progressBarService, snackbar);

    this.sortColumn = 'device';
    this.sortOrder = 'asc';

    this.subs.add(this.userPrefService.userPrefs.subscribe(prefs => {
      this.userPrefs = prefs;
      this.Timers = this._timers;
    }));
  }

  ngOnInit() {
    super.ngOnInit();
  }

  selectTimer(row: DeviceTimer) {
    this.selectedTimer = row;
  }

  editTimer(row: DeviceTimer) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const editTimer = Object.assign<DeviceTimer, Partial<DeviceTimer>>(
      new DeviceTimer(),
      { ...row }
    );
    const throttles = row.getDeviceThrottles(this.deviceAllowsThrottles);

    this.showTimerDialog(editTimer, throttles);
  }
  deleteTimer(timer: DeviceTimer) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    if (window.confirm('Delete this timer?')) {
      this.controllerService.deleteDeviceTimer(timer.Id).subscribe(
        () => {
          this.deleteTimerRule(timer);
          this.showMessage(`Successfully removed Timer`);
          const requiresUpdate = timer.IsActive && this.ruleGroup && this.ruleGroup.IsActive;
          if (requiresUpdate) {
            this.ruleChanged.emit(true);
          }
          this.ruleGroupChanged.emit(true);
        },
        error => this.handleError(error)
      );
    }
  }
  setTimerActive(_event: MatSlideToggleChange, timer: DeviceTimer) {
    const existTimer = this.controller.Timers.find(t => t.Id === timer.Id);
    const activeRuleGroup = this.ruleGroup.IsActive;
    const updatedTimer: DeviceTimerResponse = { ...existTimer, IsActive: !existTimer.IsActive };
    this.controllerService.updateDeviceTimer(updatedTimer).subscribe(
      () => {
        this.replaceOrAddTimerRule(updatedTimer);
        this.showMessage(
          `Set Timer to ${updatedTimer.IsActive ? 'Active' : 'Inactive'}`
        );
        this.checkDosingRecipeNeedUpdate(updatedTimer.DosingRecipeId);
        if (activeRuleGroup) {
          this.pushUpdate.emit(true);
        }
        this.ruleGroupChanged.emit(true);
      },
      error => this.handleError(error)
    );
  }

  addTimer() {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const newTimer = new DeviceTimer();
    newTimer.RuleGroupId = this.ruleGroup.Id;
    newTimer.StartTimestamp = moment
      .tz(this.controller.TimeZoneId)
      .startOf('day')
      .utc()
      .format('HH:mm:ss');

    this.showTimerDialog(newTimer, this.getDeviceThrottles());
  }

  private showTimerDialog(
    timer: DeviceTimer,
    deviceThrottles: DeviceWithThrottle[]
  ) {
    const dialogOptions: RuleDialogOptions = {
      deviceOptions: this.deviceOptions,
      sharedDeviceOptions: this.sharedDevices,
      sensorOptions: this.sensorOptions,
      deviceThrottles: deviceThrottles,
      controller: this.controller,
    };

    const config: MatDialogConfig<EditTimerDialogOptions> = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { timer: timer, dialogOptions },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(EditTimerDialogComponent, config);
    const wasActive = timer.IsActive;

    dialogRef.afterClosed().subscribe((result: EditTimerDialogResult) => {
      if (!result) {
        return;
      }

      const resTimer = result.timer;
      this.replaceOrAddTimerRule(resTimer);
      const requiresUpdate =
        (resTimer.IsActive !== wasActive || resTimer.IsActive) && this.ruleGroup.IsActive;
      if (requiresUpdate && result.needsUpdate) {
        this.ruleChanged.emit(true);
        this.checkDosingRecipeNeedUpdate(resTimer.DosingRecipeId);
      }
      this.ruleGroupChanged.emit(true);
    });
  }

  private replaceOrAddTimerRule(newTimerResponse: DeviceTimerResponse) {
    const existTimers = [...this.dataSource.Current];
    const newTimer = DeviceTimer.GetTimer(
      this.controller,
      this.deviceOptions,
      this.dosingRecipes,
      newTimerResponse,
      this.userPrefs.prefer24Hour
    );
    const existIdx = existTimers.findIndex(exist => exist.Id === newTimerResponse.Id);
    const existRulegroupIdx = this.ruleGroup.Timers.findIndex(exist => exist.Id === newTimerResponse.Id);
    const existControllerIdx = this.controller.Timers.findIndex(
      exist => exist.Id === newTimerResponse.Id
    );
    if (existIdx >= 0) {
      existTimers.splice(existIdx, 1, newTimer);
    } else {
      existTimers.push(newTimer);
    }
    if (existRulegroupIdx >= 0) {
      this.ruleGroup.Timers.splice(existRulegroupIdx, 1, newTimerResponse);
    } else {
      this.ruleGroup.Timers.push(newTimerResponse);
    }
    if (existControllerIdx >= 0) {
      this.controller.Timers.splice(existControllerIdx, 1, newTimerResponse);
    } else {
      this.controller.Timers.push(newTimerResponse);
    }
    this.sortTimers(existTimers);
    this.dataSource.update(existTimers);
  }

  private deleteTimerRule(timer: DeviceTimer) {
    const existTimers = [...this.dataSource.Current];
    const existIdx = existTimers.findIndex(exist => exist.Id === timer.Id);
    const existRulegroupIdx = this.ruleGroup.Timers.findIndex(exist => exist.Id === timer.Id);
    const existControllerIdx = this.controller.Timers.findIndex(
      exist => exist.Id === timer.Id
    );
    if (existIdx >= 0) {
      existTimers.splice(existIdx, 1);
    }
    if (existRulegroupIdx >= 0) {
      this.ruleGroup.Timers.splice(existRulegroupIdx, 1);
    }
    if (existControllerIdx >= 0) {
      this.controller.Timers.splice(existControllerIdx, 1);
    }
    this.sortTimers(existTimers);
    this.dataSource.update(existTimers);
  }

  private sortTimers(timers: DeviceTimer[]) {
    timers.sort((a, b) => {
      switch (this.sortColumn) {
        case 'timeOfDay':
          const aTimeOfDay = a.DayNightOption;
          const bTimeOfDay = b.DayNightOption;
          return this.sortOrder === 'asc' ? aTimeOfDay - bTimeOfDay : bTimeOfDay - aTimeOfDay;
        case 'startTime':
          const aSync = moment(a.StartTimestamp, 'HH:mm:ss').valueOf();
          const bSync = moment(b.StartTimestamp, 'HH:mm:ss').valueOf();
          return this.sortOrder === 'asc' ? aSync - bSync : bSync - aSync;
        case 'frequency':
          const aFreq = moment(a.Frequency, 'HH:mm:ss').valueOf();
          const bFreq = moment(b.Frequency, 'HH:mm:ss').valueOf();
          return this.sortOrder === 'asc' ? aFreq - bFreq : bFreq - aFreq;
        case 'duration':
          const aDuration = moment(a.Duration, 'HH:mm:ss').valueOf();
          const bDuration = moment(b.Duration, 'HH:mm:ss').valueOf();
          return this.sortOrder === 'asc' ? aDuration - bDuration : bDuration - aDuration;
        default:
          const aName = a.DisplayName || a.DeviceNames;
          const bName = b.DisplayName || b.DeviceNames;
          return this.sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
      }
    });
  }

  sortOrderChange(ev: {active: string; direction: SortOrders}) {
    const existTimers = [...this.dataSource.Current];
    if (ev.direction === '') {
      this.sortColumn = 'device';
      this.sortOrder = 'asc';
    } else {
      this.sortColumn = ev.active;
      this.sortOrder = ev.direction;
    }
    this.sortTimers(existTimers);
    this.dataSource.update(existTimers);
  }
}
