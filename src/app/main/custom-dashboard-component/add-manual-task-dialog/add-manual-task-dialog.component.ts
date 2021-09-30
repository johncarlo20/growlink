import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ProgressBarService, DashboardService } from '@services';
import {
  Dashboard,
  DashboardItem,
  SelectItem,
  DashboardItemRequest,
  DashboardItemResponse,
  GenerationStatus,
  Controller,
} from '@models';
import { AddWidgetDialog } from '../add-dialog-base';
import { ManualTaskOption } from '../custom-dashboard.component';

@Component({
  selector: 'fuse-add-manual-task-dialog',
  templateUrl: './add-manual-task-dialog.component.html',
  styleUrls: ['./add-manual-task-dialog.component.scss'],
})
export class AddManualTaskDialogComponent extends AddWidgetDialog implements OnInit {
  addTaskForm: FormGroup;
  tasks: ManualTaskOption[] = [];
  taskOptions: SelectItem[] = [];
  filteredTaskOptions: SelectItem[] = [];
  controllerOptions: Controller[] = [];
  dashboard: Dashboard;
  changes = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { dashboard: Dashboard; tasks: ManualTaskOption[]; curPos: GenerationStatus },
    public dialogRef: MatDialogRef<AddManualTaskDialogComponent, boolean>,
    private dashboardService: DashboardService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(data.dashboard, progressBarService, snackbar);

    this.curPos = data.curPos;
    this.tasks = data.tasks;

    this.taskOptions = this.tasks.map((taskOpt) => ({
      value: taskOpt.task.Id,
      caption: DashboardItem.taskName(taskOpt.controller, taskOpt.task),
    }));

    this.controllerOptions = this.tasks.reduce((all, task) => {
      if (!all.find((exist) => exist.Guid === task.controller.Guid)) {
        all.push(task.controller);
      }

      return all;
    }, new Array<Controller>());
  }

  ngOnInit() {
    this.addTaskForm = new FormGroup({
      controller: new FormControl(
        null,
        this.controllerOptions.length > 1 ? [Validators.required] : []
      ),
      task: new FormControl(null, [Validators.required]),
    });

    this.controller.valueChanges.subscribe((selected: Controller) => {
      this.filteredTaskOptions = this.tasks.filter(
        (opt) => opt.controller.Guid === selected.Guid
      ).map((taskOpt) => ({
        value: taskOpt.task.Id,
        caption: DashboardItem.taskName(taskOpt.controller, taskOpt.task),
      }));

      this.task.setValue(
        this.filteredTaskOptions.length ? this.filteredTaskOptions[0] : null
      );
    });

    this.controller.setValue(this.controllerOptions.length ? this.controllerOptions[0] : null);

    this.task.setValue(this.taskOptions.length ? this.taskOptions[0] : null);
  }

  submit() {
    const position = this.getDashboardAvailableSpot(3, 2);
    const selectedId = this.task.value as string;
    const selected = this.tasks.find((t) => t.task.Id === selectedId);
    const taskRequest: DashboardItemRequest = {
      DashboardId: this.dashboard.Id,
      Type: 'task',
      X: position.xPos,
      Y: position.yPos,
      Layer: 5,
      TaskId: selected.task.Id,
    };

    if (this.dashboard.Id === 'generated') {
      const usedIds = this.dashboard.Items.map((dbItem) => parseInt(dbItem.id, 10));
      const newId = Math.max(...usedIds) + 1;
      taskRequest.Id = newId.toString();

      const itemResponse = new DashboardItemResponse(taskRequest);
      this.addTaskToDashboard(itemResponse, selected);

      return;
    }

    this.dashboardService.addDashboardItem(taskRequest).subscribe((result) => {
      this.addTaskToDashboard(result, selected);
    });
  }

  private addTaskToDashboard(dashboardItem: DashboardItemResponse, task: ManualTaskOption) {
    const newTask = new DashboardItem(dashboardItem);
    newTask.createTaskModel(task.controller, task.task);

    this.dashboard.Items.push(newTask);
    const taskIdx = this.taskOptions.findIndex(tsk => tsk.value === task.task.Id);
    if (taskIdx > -1) {
      this.taskOptions.splice(taskIdx, 1);
      const nextIndex =
      taskIdx < this.taskOptions.length
          ? taskIdx
          : this.taskOptions.length - 1;

      if (nextIndex >= 0) {
        this.task.setValue(this.taskOptions[nextIndex]);
      }
    }
    this.changes = true;
  }

  get controller() {
    return this.addTaskForm.get('controller') as FormControl;
  }
  get task() {
    return this.addTaskForm.get('task') as FormControl;
  }
}
