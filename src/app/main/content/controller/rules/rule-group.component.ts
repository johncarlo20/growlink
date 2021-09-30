import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  Controller,
  RuleGroup,
  DeviceResponse,
  DosingRecipeResponse,
  DeviceAllowThrottle,
  SensorResponse,
} from '@models';
import { ControllerService } from '@services';
import { PanelStates } from './rules.component';

@Component({
  selector: 'fuse-rule-group',
  templateUrl: './rule-group.component.html',
  styleUrls: ['./rule-group.component.scss'],
})
export class RuleGroupComponent {
  @Input() controller: Controller;
  @Input() deviceOptions: DeviceResponse[] = [];
  @Input() sharedDevices: DeviceResponse[] = [];
  @Input() sensorOptions: SensorResponse[] = [];
  @Input() dosingRecipes: DosingRecipeResponse[] = [];
  @Input() deviceAllowsThrottles: DeviceAllowThrottle[] = [];
  @Input()
  set ruleGroup(rg: RuleGroup) {
    this._ruleGroup = rg;
    this.loadCropSteeringPrograms();
  }
  get ruleGroup(): RuleGroup {
    return this._ruleGroup;
  }

  @Input()
  set panelStates(states: PanelStates) {
    if (!states) {
      return;
    }
    this._panelStates = states;
  }
  get panelStates(): PanelStates {
    return this._panelStates;
  }

  @Output() ruleChanged = new EventEmitter<boolean>();
  @Output() ruleGroupChanged = new EventEmitter<boolean>();
  @Output() pushUpdate = new EventEmitter<boolean>();
  @Output() controllerUpdate = new EventEmitter<string>();

  private _ruleGroup: RuleGroup;
  private _panelStates: PanelStates = {
    alerts: false,
    triggers: false,
    schedules: false,
    timers: false,
    tasks: false,
    programs: false,
    expanded: false,
  };

  constructor(private controllerService: ControllerService)
  { }

  private loadCropSteeringPrograms() {
    if (this._ruleGroup && this.controller && this.controller.SupportsCropSteering) {
      this.controllerService.getCropSteeringPrograms(this._ruleGroup.Id).subscribe(programs => {
        this._ruleGroup.CropSteeringPrograms = programs;
      });
    }
  }

  get isReadOnly() {
    return !this.controller || this.controller.isReadOnly;
  }

  ruleWasChanged() {
    this.ruleChanged.emit(true);
  }
  ruleGroupWasChanged() {
    this.ruleGroupChanged.emit(true);
  }
  pushUpdateCalled() {
    this.pushUpdate.emit(true);
  }
  controllerUpdateCalled(deviceId: string) {
    this.controllerUpdate.emit(deviceId);
  }
}
