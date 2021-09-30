import { Component, OnInit, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DeviceSchedule, DeviceScheduleResponse, DeviceWithThrottle, UserPrefs, DayOfWeek, RuleDialogOptions } from '@models';
import { GenericDataSource } from '@util';
import { ProgressBarService, ControllerService, UserPreferencesService } from '@services';
import { RulesTableBaseComponent, SortOrders } from '../rules-table.base';
import { EditScheduleDialogComponent, EditScheduleDialogOptions, EditScheduleDialogResult } from './edit-schedule-dialog.component';
import * as moment from 'moment';

@Component({
  selector: 'fuse-schedule-rules',
  templateUrl: './schedule-rules.component.html',
  styleUrls: ['./schedule-rules.component.scss'],
})
export class ScheduleRulesComponent extends RulesTableBaseComponent implements OnInit {
  @Input()
  set Schedules(value: DeviceScheduleResponse[]) {
    this._schedules = value;

    const schedules = this._schedules.map(schedule =>
      DeviceSchedule.GetSchedule(
        this.controller,
        this.deviceOptions,
        this.dosingRecipes,
        schedule,
        this.userPrefs.prefer24Hour
      )
    );

    this.sortSchedules(schedules);
    this.dataSource.update(schedules);
  }
  get Schedules() {
    return this._schedules;
  }

  private _schedules: DeviceScheduleResponse[] = [];
  private userPrefs: UserPrefs;
  dataSource = new GenericDataSource<DeviceSchedule>([]);
  scheduleColumns = ['device', 'daysOfWeek', 'startTime', 'endTime', 'actions'];
  selectedSchedule: DeviceSchedule = null;

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
      this.Schedules = this._schedules;
    }));
  }

  ngOnInit() {
    super.ngOnInit();
  }

  selectSchedule(row: DeviceSchedule) {
    this.selectedSchedule = row;
  }

  editSchedule(row: DeviceSchedule) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const editSchedule = Object.assign<DeviceSchedule, Partial<DeviceSchedule>>(
      new DeviceSchedule(),
      { ...row }
    );
    const throttles = row.getDeviceThrottles(this.deviceAllowsThrottles);

    this.showScheduleDialog(editSchedule, throttles);
  }
  deleteSchedule(schedule: DeviceSchedule) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    if (window.confirm('Delete this schedule?')) {
      this.controllerService.deleteDeviceSchedule(schedule.Id).subscribe(
        () => {
          this.deleteScheduleRule(schedule);
          this.showMessage(`Successfully removed Schedule`);
          const requiresUpdate = schedule.IsActive && this.ruleGroup && this.ruleGroup.IsActive;
          if (requiresUpdate) {
            this.ruleChanged.emit(true);
          }
          this.ruleGroupChanged.emit(true);
        },
        error => this.handleError(error)
      );
    }
  }
  setScheduleActive(_event: MatSlideToggleChange, schedule: DeviceSchedule) {
    const existSchedule = this.controller.Schedules.find(t => t.Id === schedule.Id);
    const activeRuleGroup = this.ruleGroup.IsActive;
    const updatedSchedule: DeviceScheduleResponse = { ...existSchedule, IsActive: !existSchedule.IsActive };
    this.controllerService.updateDeviceSchedule(updatedSchedule).subscribe(
      () => {
        this.replaceOrAddScheduleRule(updatedSchedule);
        this.showMessage(
          `Set Schedule to ${updatedSchedule.IsActive ? 'Active' : 'Inactive'}`
        );
        this.checkDosingRecipeNeedUpdate(updatedSchedule.DosingRecipeId);
        if (activeRuleGroup) {
          this.pushUpdate.emit(true);
        }
        this.ruleGroupChanged.emit(true);
      },
      error => this.handleError(error)
    );
  }

  addSchedule() {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const newSchedule = new DeviceSchedule();
    newSchedule.RuleGroupId = this.ruleGroup.Id;

    this.showScheduleDialog(newSchedule, this.getDeviceThrottles());
  }

  private showScheduleDialog(
    schedule: DeviceSchedule,
    deviceThrottles: DeviceWithThrottle[]
  ) {
    const dialogOptions: RuleDialogOptions = {
      deviceOptions: this.deviceOptions,
      sharedDeviceOptions: this.sharedDevices,
      sensorOptions: this.sensorOptions,
      deviceThrottles: deviceThrottles,
      controller: this.controller,
    };

    const config: MatDialogConfig<EditScheduleDialogOptions> = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { schedule: schedule, dialogOptions },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(EditScheduleDialogComponent, config);
    const wasActive = schedule.IsActive;

    dialogRef.afterClosed().subscribe((result: EditScheduleDialogResult) => {
      if (!result) {
        return;
      }

      const resSchedule = result.schedule;
      this.replaceOrAddScheduleRule(resSchedule);
      const requiresUpdate =
        (resSchedule.IsActive !== wasActive || resSchedule.IsActive) && this.ruleGroup.IsActive;
      if (requiresUpdate && result.needsUpdate) {
        this.ruleChanged.emit(true);
        this.checkDosingRecipeNeedUpdate(resSchedule.DosingRecipeId);
      }
      this.ruleGroupChanged.emit(true);
    });
  }

  private replaceOrAddScheduleRule(newScheduleResponse: DeviceScheduleResponse) {
    const existSchedules = [...this.dataSource.Current];
    const newSchedule = DeviceSchedule.GetSchedule(
      this.controller,
      this.deviceOptions,
      this.dosingRecipes,
      newScheduleResponse,
      this.userPrefs.prefer24Hour
    );
    const existIdx = existSchedules.findIndex(exist => exist.Id === newScheduleResponse.Id);
    const existRulegroupIdx = this.ruleGroup.Schedules.findIndex(exist => exist.Id === newScheduleResponse.Id);
    const existControllerIdx = this.controller.Schedules.findIndex(
      exist => exist.Id === newScheduleResponse.Id
    );
    if (existIdx >= 0) {
      existSchedules.splice(existIdx, 1, newSchedule);
    } else {
      existSchedules.push(newSchedule);
    }
    if (existRulegroupIdx >= 0) {
      this.ruleGroup.Schedules.splice(existRulegroupIdx, 1, newScheduleResponse);
    } else {
      this.ruleGroup.Schedules.push(newScheduleResponse);
    }
    if (existControllerIdx >= 0) {
      this.controller.Schedules.splice(existControllerIdx, 1, newScheduleResponse);
    } else {
      this.controller.Schedules.push(newScheduleResponse);
    }
    this.sortSchedules(existSchedules);
    this.dataSource.update(existSchedules);
  }

  private deleteScheduleRule(schedule: DeviceSchedule) {
    const existSchedules = [...this.dataSource.Current];
    const existIdx = existSchedules.findIndex(exist => exist.Id === schedule.Id);
    const existRulegroupIdx = this.ruleGroup.Schedules.findIndex(exist => exist.Id === schedule.Id);
    const existControllerIdx = this.controller.Schedules.findIndex(
      exist => exist.Id === schedule.Id
    );
    if (existIdx >= 0) {
      existSchedules.splice(existIdx, 1);
    }
    if (existRulegroupIdx >= 0) {
      this.ruleGroup.Schedules.splice(existRulegroupIdx, 1);
    }
    if (existControllerIdx >= 0) {
      this.controller.Schedules.splice(existControllerIdx, 1);
    }
    this.sortSchedules(existSchedules);
    this.dataSource.update(existSchedules);
  }

  private sortSchedules(schedules: DeviceSchedule[]) {
    schedules.sort((a, b) => {
      switch (this.sortColumn) {
        case 'daysOfWeek':
          const aDOW = DayOfWeek.getDaysOfWeekSortNumber(a.DaysOfWeek);
          const bDOW = DayOfWeek.getDaysOfWeekSortNumber(b.DaysOfWeek);
          return this.sortOrder === 'asc' ? aDOW - bDOW : bDOW - aDOW;
        case 'startTime':
          const aStart = moment(a.StartTime, 'HH:mm:ss').valueOf();
          const bStart = moment(b.StartTime, 'HH:mm:ss').valueOf();
          return this.sortOrder === 'asc' ? aStart - bStart : bStart - aStart;
        case 'endTime':
          const aEnd = moment(a.EndTime, 'HH:mm:ss').valueOf();
          const bEnd = moment(b.EndTime, 'HH:mm:ss').valueOf();
          return this.sortOrder === 'asc' ? aEnd - bEnd : bEnd - aEnd;
        default:
          const aName = a.DisplayName || a.DeviceNames;
          const bName = b.DisplayName || b.DeviceNames;
          return this.sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
      }
    });
  }

  sortOrderChange(ev: {active: string; direction: SortOrders}) {
    const existSchedules = [...this.dataSource.Current];
    if (ev.direction === '') {
      this.sortColumn = 'device';
      this.sortOrder = 'asc';
    } else {
      this.sortColumn = ev.active;
      this.sortOrder = ev.direction;
    }
    this.sortSchedules(existSchedules);
    this.dataSource.update(existSchedules);
  }
}
