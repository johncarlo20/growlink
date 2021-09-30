import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { SignalRService } from '@services';
import { ManualTaskModel, ManualTaskState } from '@models';
import { ConfirmDeleteDialogOptions, ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

@Component({
  selector: 'fuse-manual-task-display',
  templateUrl: './manual-task-display.component.html',
  styleUrls: ['./manual-task-display.component.scss'],
})
export class ManualTaskDisplayComponent implements OnInit, OnDestroy {
  @Input() task: ManualTaskModel;
  @Input() custom = false;
  @Input() customName: string;
  @Input()
  set state(value: ManualTaskState) {
    this._state = value;
    this.task.stateImages = this.getTaskStateImages();
  }
  get state(): ManualTaskState {
    return this._state;
  }
  @Input()
  set controllerRemaining(value: number) {
    if (value === null || value === 0) {
      this.state = 'Off';
      this._remaining = 0;
      this.stop();
    } else {
      this.state = 'On';
      this._remaining = value;
      if (!this._countdown) {
        this.start();
      }
    }
  }
  get controllerRemaining(): number {
    return this._remaining;
  }
  @Output() stateChanged = new EventEmitter<ManualTaskModel>();
  @Output() error = new EventEmitter<any>();

  get offState(): boolean {
    return this.state === 'Off';
  }

  set duration(value: string) {
    this._duration = this.stringToDuration(value);
    this._remaining = this._duration;
  }
  get duration(): string {
    return this.secondsToString(this._duration);
  }

  get remaining(): string {
    return this.secondsToString(this._remaining);
  }

  get hasRecipe(): boolean {
    return !!this.task.recipe;
  }

  get verifyingDosing(): boolean {
    return this._verifyDosing;
  }

  private _state: ManualTaskState;
  private _duration: number;
  private _remaining: number;
  private _verifyDosing = false;

  private _countdown: number = null;

  constructor(private signalR: SignalRService, public dialog: MatDialog) { }

  ngOnInit() {
    this.task.stateImages = this.getTaskStateImages();
    this._duration = this.stringToDuration(this.task.duration);
    this._remaining = this._duration;
  }

  ngOnDestroy() { }

  private secondsToString(totalSecs: number) {
    const hours = Math.floor(totalSecs / 3600)
      .toString()
      .padStart(2, '0');
    const mins = Math.floor((totalSecs % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.floor((totalSecs % 3600) % 60)
      .toString()
      .padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  }

  private stringToDuration(source: string): number {
    const format = /(\d+)/g;
    const result = source.match(format);
    if (result.length !== 3) {
      return 0;
    }

    const parts = {
      hours: parseInt(result[0], 10),
      minutes: parseInt(result[1], 10),
      seconds: parseInt(result[2], 10),
    };

    return parts.hours * 3600 + parts.minutes * 60 + parts.seconds;
  }

  private start() {
    this.state = 'On';
    this._countdown = window.setInterval(() => {
      this._remaining -= 1;
      if (this._remaining <= 0) {
        this.stop();
      }
    }, 1000);
  }
  private stop() {
    this.state = 'Off';
    if (this._countdown) {
      window.clearInterval(this._countdown);
      this._countdown = null;
    }
    this._remaining = this._duration;
  }

  updateTaskState(task: ManualTaskModel, cmd: 'start' | 'stop'): void {
    if (task.isReadOnly) {
      window.alert('Read-only users cannot manually control tasks');
      return;
    }

    this.state = 'None';
    this.stateChanged.emit(this.task);

    if (cmd === 'start' && !!task.recipe && task.controller) {
      const recipes = [...task.controller.DosingRecipes, ...task.controller.SharedDosingRecipes];
      const possibleRecipe = recipes.find(r => r.Id === task.recipeId);
      if (possibleRecipe) {
        this._verifyDosing = true;
        this.signalR.GetActiveRecipes(possibleRecipe.ControllerDeviceId).done((r) => {
          const hasActiveRecipes = r && r.r && r.r.length > 0;
          if (hasActiveRecipes && (r.r.length !== 1 || r.r[0].id !== possibleRecipe.DatabaseId)) {
            const activeRecipes = r.r.map(ar => recipes.find(recipe => recipe.DatabaseId === ar.id))
              .filter(recipe => recipe !== null)
              .map(recipe => recipe.Name)
              .join(', ');

            this.confirmStartTask(task, activeRecipes);
          } else {
            this._verifyDosing = false;
            this.startStopTask(task, cmd);
          }
        })
        .fail((error) => {
          console.error('StartTask ERROR:', error);
          this._verifyDosing = false;
          this.state = cmd === 'start' ? 'Off' : 'On';
          this.stateChanged.emit(this.task);
          this.error.emit(`Could not ${cmd} task ${this.task.name}`);
        });

        return;
      }
    }

    this.startStopTask(task, cmd);
  }

  private confirmStartTask(task: ManualTaskModel, activeRecipes: string)
  {
    const data: ConfirmDeleteDialogOptions = {
      message: `Your fertigation system is currently dosing ${activeRecipes}. Proceed anyway?`,
      heading: `Warning - Dosing Recipe`,
    };

    const config: MatDialogConfig = { data };
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: boolean) => {
      this._verifyDosing = false;
      if (!result) {
        this.state = 'Off';
        this.stateChanged.emit(this.task);

        return;
      }

      this.startStopTask(task, 'start');
    });
  }

  private startStopTask(task: ManualTaskModel, cmd: 'start' | 'stop')
  {
    this.signalR.StartTask(task.controller.DeviceId, task.id, cmd === 'start' ? this._duration : 0)
      .done(() => {
          switch (cmd) {
            case 'start':
              this.start();
              break;
            case 'stop':
              this.stop();
              break;
          }
      })
      .fail(error => {
        console.error('StartTask ERROR:', error);
        this.state = cmd === 'start' ? 'Off' : 'On';
        this.stateChanged.emit(this.task);
        this.error.emit(`Could not ${cmd} task ${this.task.name}`);
      });
  }

  private getTaskStateImages(): string[] {
    const imageUrl = 'assets/images/';

    let start = 'startinactive.png';
    let stop = 'stopinactive.png';

    if (!this.task.isReadOnly && this.task.isActive) {
      switch (this.state) {
        case 'On':
          start = 'startactive.png';
          break;
        case 'Off':
          stop = 'stopactive.png';
          break;
      }
    }

    return [`${imageUrl}${start}`, `${imageUrl}${stop}`];
  }
}
