import { Component, OnInit, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ManualTask, ManualTaskResponse, DeviceWithThrottle, RuleDialogOptions } from '@models';
import { GenericDataSource } from '@util';
import { ProgressBarService, ControllerService } from '@services';
import { RulesTableBaseComponent, SortOrders } from '../rules-table.base';
import { EditManualTaskDialogComponent, EditManualTaskDialogOptions, EditManualTaskDialogResult } from './edit-manual-task-dialog.component';
import * as moment from 'moment';

@Component({
  selector: 'fuse-task-rules',
  templateUrl: './manual-task-rules.component.html',
  styleUrls: ['./manual-task-rules.component.scss'],
})
export class ManualTaskRulesComponent extends RulesTableBaseComponent implements OnInit {
  @Input()
  set Tasks(value: ManualTaskResponse[]) {
    this._tasks = value;

    const tasks = this._tasks.map(task =>
      ManualTask.GetManualTask(
        this.deviceOptions,
        this.dosingRecipes,
        task
      )
    );

    this.sortTasks(tasks);
    this.dataSource.update(tasks);
  }
  get Tasks() {
    return this._tasks;
  }

  private _tasks: ManualTaskResponse[] = [];
  dataSource = new GenericDataSource<ManualTask>([]);
  taskColumns = ['device', 'duration', 'actions'];
  selectedTask: ManualTask = null;

  constructor(
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

  selectTask(row: ManualTask) {
    this.selectedTask = row;
  }

  editTask(row: ManualTask) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const editTask = Object.assign<ManualTask, Partial<ManualTask>>(
      new ManualTask(),
      { ...row }
    );
    const throttles = row.getDeviceThrottles(this.deviceAllowsThrottles);

    this.showTaskDialog(editTask, throttles);
  }
  deleteTask(task: ManualTask) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    if (window.confirm('Delete this task?')) {
      this.controllerService.deleteManualTask(task.Id).subscribe(
        () => {
          this.deleteTaskRule(task);
          this.showMessage(`Successfully removed Task`);
          const requiresUpdate = task.IsActive && this.ruleGroup && this.ruleGroup.IsActive;
          if (requiresUpdate) {
            this.ruleChanged.emit(true);
          }
          this.ruleGroupChanged.emit(true);
        },
        error => this.handleError(error)
      );
    }
  }
  setTaskActive(_event: MatSlideToggleChange, task: ManualTask) {
    const existTask = this.controller.ManualTasks.find(t => t.Id === task.Id);
    const activeRuleGroup = this.ruleGroup.IsActive;
    const updatedTask: ManualTaskResponse = { ...existTask, IsActive: !existTask.IsActive };
    this.controllerService.updateManualTask(updatedTask).subscribe(
      () => {
        this.replaceOrAddTaskRule(updatedTask);
        this.showMessage(
          `Set Task to ${updatedTask.IsActive ? 'Active' : 'Inactive'}`
        );
        this.checkDosingRecipeNeedUpdate(updatedTask.DosingRecipeId);
        if (activeRuleGroup) {
          this.pushUpdate.emit(true);
        }
        this.ruleGroupChanged.emit(true);
      },
      error => this.handleError(error)
    );
  }

  addTask() {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const newTask = new ManualTask();
    newTask.RuleGroupId = this.ruleGroup.Id;

    this.showTaskDialog(newTask, this.getDeviceThrottles());
  }

  private showTaskDialog(
    task: ManualTask,
    deviceThrottles: DeviceWithThrottle[]
  ) {
    const dialogOptions: RuleDialogOptions = {
      deviceOptions: this.deviceOptions,
      sharedDeviceOptions: this.sharedDevices,
      sensorOptions: this.sensorOptions,
      deviceThrottles: deviceThrottles,
      controller: this.controller,
    };

    const config: MatDialogConfig<EditManualTaskDialogOptions> = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { task: task, dialogOptions },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(EditManualTaskDialogComponent, config);
    const wasActive = task.IsActive;

    dialogRef.afterClosed().subscribe((result: EditManualTaskDialogResult) => {
      if (!result) {
        return;
      }

      const resTask = result.task;
      this.replaceOrAddTaskRule(resTask);
      const requiresUpdate =
        (resTask.IsActive !== wasActive || resTask.IsActive) && this.ruleGroup.IsActive;
      if (requiresUpdate && result.needsUpdate) {
        this.ruleChanged.emit(true);
        this.checkDosingRecipeNeedUpdate(resTask.DosingRecipeId);
      }
      this.ruleGroupChanged.emit(true);
    });
  }

  private replaceOrAddTaskRule(newTaskResponse: ManualTaskResponse) {
    const existTasks = [...this.dataSource.Current];
    const newTask = ManualTask.GetManualTask(
      this.deviceOptions,
      this.dosingRecipes,
      newTaskResponse
    );
    const existIdx = existTasks.findIndex(exist => exist.Id === newTaskResponse.Id);
    const existRulegroupIdx = this.ruleGroup.ManualTasks.findIndex(exist => exist.Id === newTaskResponse.Id);
    const existControllerIdx = this.controller.ManualTasks.findIndex(
      exist => exist.Id === newTaskResponse.Id
    );
    if (existIdx >= 0) {
      existTasks.splice(existIdx, 1, newTask);
    } else {
      existTasks.push(newTask);
    }
    if (existRulegroupIdx >= 0) {
      this.ruleGroup.ManualTasks.splice(existRulegroupIdx, 1, newTaskResponse);
    } else {
      this.ruleGroup.ManualTasks.push(newTaskResponse);
    }
    if (existControllerIdx >= 0) {
      this.controller.ManualTasks.splice(existControllerIdx, 1, newTaskResponse);
    } else {
      this.controller.ManualTasks.push(newTaskResponse);
    }
    this.sortTasks(existTasks);
    this.dataSource.update(existTasks);
  }

  private deleteTaskRule(task: ManualTask) {
    const existTasks = [...this.dataSource.Current];
    const existIdx = existTasks.findIndex(exist => exist.Id === task.Id);
    const existControllerIdx = this.controller.ManualTasks.findIndex(
      exist => exist.Id === task.Id
    );
    const existRulegroupIdx = this.ruleGroup.ManualTasks.findIndex(exist => exist.Id === task.Id);
    if (existIdx >= 0) {
      existTasks.splice(existIdx, 1);
    }
    if (existRulegroupIdx >= 0) {
      this.ruleGroup.ManualTasks.splice(existRulegroupIdx, 1);
    }
    if (existControllerIdx >= 0) {
      this.controller.ManualTasks.splice(existControllerIdx, 1);
    }
    this.sortTasks(existTasks);
    this.dataSource.update(existTasks);
  }

  private sortTasks(tasks: ManualTask[]) {
    tasks.sort((a, b) => {
      switch (this.sortColumn) {
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
    const existTasks = [...this.dataSource.Current];
    if (ev.direction === '') {
      this.sortColumn = 'device';
      this.sortOrder = 'asc';
    } else {
      this.sortColumn = ev.active;
      this.sortOrder = ev.direction;
    }
    this.sortTasks(existTasks);
    this.dataSource.update(existTasks);
  }
}
