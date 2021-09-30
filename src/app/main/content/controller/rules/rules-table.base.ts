import { OnInit, Input, Output, EventEmitter, Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { BaseAPIComponent } from '@util';
import { ProgressBarService } from '@services';
import {
  Controller,
  RuleGroup,
  DeviceWithThrottle,
  DeviceResponse,
  SensorResponse,
  DosingRecipeResponse,
  DeviceAllowThrottle,
} from '@models';
import { EntityUpdatesComponent } from '../../../entity-updates/entity-updates.component';

export type SortOrders = '' | 'asc' | 'desc';

@Component({template: ''})
export abstract class RulesTableBaseComponent extends BaseAPIComponent implements OnInit {
  @Input() ruleGroup: RuleGroup;
  @Input() controller: Controller;
  @Input() deviceOptions: DeviceResponse[] = [];
  @Input() sharedDevices: DeviceResponse[] = [];
  @Input() sensorOptions: SensorResponse[] = [];
  @Input() dosingRecipes: DosingRecipeResponse[] = [];
  @Input() deviceAllowsThrottles: DeviceAllowThrottle[] = [];

  @Output() ruleChanged = new EventEmitter<boolean>();
  @Output() ruleGroupChanged = new EventEmitter<boolean>();
  @Output() pushUpdate = new EventEmitter<boolean>();
  @Output() controllerUpdate = new EventEmitter<string>();

  protected sortColumn: string;
  protected sortOrder: SortOrders = '';

  constructor(
    public dialog: MatDialog,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);
  }

  ngOnInit() {
    super.ngOnInit();
  }

  ignoreClick(ev: MouseEvent) {
    ev.cancelBubble = true;
  }

  viewHistory(entityId: string, entityName: string) {
    const config: MatDialogConfig = {
      panelClass: 'entity-updates-panel',
      data: { entityId, entityName, controller: this.controller },
    };

    const dialogRef = this.dialog.open(EntityUpdatesComponent, config);

    dialogRef.afterClosed().subscribe(() => {});
  }

  public get isReadOnly() {
    return !this.controller || this.controller.isReadOnly;
  }

  protected getDeviceThrottles() {
    const throttles: DeviceWithThrottle[] = [];
    this.deviceAllowsThrottles.forEach(dev => {
      const devThrottle = Object.assign<DeviceWithThrottle, Partial<DeviceWithThrottle>>(
        new DeviceWithThrottle(),
        dev
      );
      throttles.push(devThrottle);
    });

    return throttles;
  }

  protected checkDosingRecipeNeedUpdate(recipeId: string) {
    if (recipeId) {
      const recipe = this.dosingRecipes.find(dr => dr.Id === recipeId);
      if (recipe && recipe.ControllerDeviceId !== this.controller.DeviceId) {
        this.controllerUpdate.emit(recipe.ControllerDeviceId);
      }
    }
  }
}
