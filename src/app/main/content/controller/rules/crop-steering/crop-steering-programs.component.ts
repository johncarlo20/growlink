import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { CropSteeringProgram, CropSteeringProgramRequest, CropSteeringProgramResponse, RuleDialogOptions } from '@models';
import { GenericDataSource } from '@util';
import { ParticleSensorsService, ProgressBarService, ControllerService, ProductTypesService } from '@services';
import { RulesTableBaseComponent, SortOrders } from '../rules-table.base';
import { EditProgramDialogComponent, EditProgramDialogOptions, EditProgramDialogResult } from './edit-program-dialog.component';
import * as moment from 'moment';

@Component({
  selector: 'fuse-crop-steering-programs',
  templateUrl: './crop-steering-programs.component.html',
  styleUrls: ['./crop-steering-programs.component.scss']
})
export class CropSteeringProgramsComponent extends RulesTableBaseComponent implements OnInit {
  @Input()
  set Programs(value: CropSteeringProgramResponse[]) {
    this._programs = value;

    const programs = this._programs.map(trigger =>
      CropSteeringProgram.GetProgram(
        this.particleSensorService,
        this.sensorOptions,
        this.deviceOptions,
        trigger
      )
    );

    this.sortCropSteeringPrograms(programs);
    this.dataSource.update(programs);
  }
  get Programs() {
    return this._programs;
  }

  private _programs: CropSteeringProgramResponse[] = [];
  dataSource = new GenericDataSource<CropSteeringProgram>([]);
  programColumns = ['name', 'sensor', 'actions'];
  selectedProgram: CropSteeringProgram = null;

  constructor(
    public particleSensorService: ParticleSensorsService,
    private controllerService: ControllerService,
    private productTypesService: ProductTypesService,
    dialog: MatDialog,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(dialog, progressBarService, snackbar);

    this.sortColumn = 'name';
    this.sortOrder = 'asc';
  }

  ngOnInit() {
    super.ngOnInit();
  }

  selectProgram(row: CropSteeringProgram) {
    this.selectedProgram = row;
  }
  editProgram(row: CropSteeringProgram) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const editProgram = Object.assign<CropSteeringProgram, Partial<CropSteeringProgram>>(
      new CropSteeringProgram(),
      { ...row }
    );

    this.showProgramDialog(editProgram);
  }

  deleteProgram(program: CropSteeringProgram) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    if (window.confirm('Delete this crop steering program?')) {
      this.controllerService.deleteCropSteeringProgram(program.Id).subscribe(
        () => {
          this.deleteCropSteeringProgram(program);
          this.showMessage(`Successfully removed Crop Steering Program`);
          const requiresUpdate = program.IsActive && this.ruleGroup && this.ruleGroup.IsActive;
          if (requiresUpdate) {
            this.ruleChanged.emit(true);
          }
          this.ruleGroupChanged.emit(true);
        },
        error => this.handleError(error)
      );
    }
  }

  setProgramActive(_event: MatSlideToggleChange, trigger: CropSteeringProgram) {
    const existTrigger = trigger.getProgramResponse();
    const activeRuleGroup = this.ruleGroup.IsActive;
    const updatedTrigger: CropSteeringProgramResponse = {
      ...existTrigger,
      IsActive: !trigger.IsActive,
    };
    const request: CropSteeringProgramRequest = {
      ...trigger.getProgramRequest(),
      isActive: !trigger.IsActive
    };
    this.controllerService.updateCropSteeringProgram(trigger.Id, request).subscribe(
      () => {
        this.replaceOrAddCropSteeringProgram(updatedTrigger);
        this.showMessage(
          `Set Crop Steering Program to ${updatedTrigger.IsActive ? 'Active' : 'Inactive'}`
        );
        if (activeRuleGroup) {
          this.pushUpdate.emit(true);
        }
        this.ruleGroupChanged.emit(true);
      },
      error => this.handleError(error)
    );
  }

  addProgram() {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const newProgram = new CropSteeringProgram();
    newProgram.RuleGroupId = this.ruleGroup.Id;
    newProgram.MaintenanceDryBack = 1.5;
    newProgram.LightsOnTime = moment(this.controller.DayStartTime, 'HH:mm:ss').format('HH:mm:ss');
    newProgram.IrrigationEndTime = moment(this.controller.DayEndTime, 'HH:mm:ss').subtract(1, 'hour').format('HH:mm:ss');

    this.showProgramDialog(newProgram);
  }

  private showProgramDialog(
    program: CropSteeringProgram
  ) {
    const dialogOptions: RuleDialogOptions = {
      deviceOptions: this.deviceOptions,
      sharedDeviceOptions: this.sharedDevices,
      sensorOptions: this.sensorOptions,
      deviceThrottles: [],
      controller: this.controller,
    };

    const config: MatDialogConfig<EditProgramDialogOptions> = {
      panelClass: 'edit-module-panel',
      maxWidth: '50vw',
      data: { program: program, dialogOptions },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(EditProgramDialogComponent, config);
    const wasActive = program.IsActive;

    dialogRef.afterClosed().subscribe((result: EditProgramDialogResult) => {
      if (!result) {
        return;
      }

      const resProgram = result.program;
      this.replaceOrAddCropSteeringProgram(resProgram);
      const requiresUpdate =
        (resProgram.IsActive !== wasActive || resProgram.IsActive) && this.ruleGroup.IsActive;
      if (requiresUpdate && result.needsUpdate) {
        this.ruleChanged.emit(true);
      }
      this.ruleGroupChanged.emit(true);
    });
  }

  private replaceOrAddCropSteeringProgram(newProgramResponse: CropSteeringProgramResponse) {
    const existPrograms = [...this.dataSource.Current];
    const newProgram = CropSteeringProgram.GetProgram(
      this.particleSensorService,
      this.sensorOptions,
      this.deviceOptions,
      newProgramResponse
    );
    const existIdx = existPrograms.findIndex(exist => exist.Id === newProgramResponse.Id);
    const existRulegroupIdx = this.ruleGroup.CropSteeringPrograms.findIndex(exist => exist.Id === newProgramResponse.Id);
    // const existControllerIdx = this.controller.SensorTriggers.findIndex(
    //   exist => exist.Id === newTriggerResponse.Id
    // );
    if (existIdx >= 0) {
      existPrograms.splice(existIdx, 1, newProgram);
    } else {
      existPrograms.push(newProgram);
    }
    if (existRulegroupIdx >= 0) {
      this.ruleGroup.CropSteeringPrograms.splice(existRulegroupIdx, 1, newProgramResponse);
    } else {
      this.ruleGroup.CropSteeringPrograms.push(newProgramResponse);
    }
    // if (existControllerIdx >= 0) {
    //   this.controller.SensorTriggers.splice(existControllerIdx, 1, newTriggerResponse);
    // } else {
    //   this.controller.SensorTriggers.push(newTriggerResponse);
    // }
    this.sortCropSteeringPrograms(existPrograms);
    this.dataSource.update(existPrograms);
  }

  private deleteCropSteeringProgram(program: CropSteeringProgram) {
    const existPrograms = [...this.dataSource.Current];
    const existIdx = existPrograms.findIndex(exist => exist.Id === program.Id);
    const existRulegroupIdx = this.ruleGroup.CropSteeringPrograms.findIndex(exist => exist.Id === program.Id);
    // const existControllerIdx = this.controller.SensorTriggers.findIndex(
    //   exist => exist.Id === trigger.Id
    // );
    if (existIdx >= 0) {
      existPrograms.splice(existIdx, 1);
    }
    if (existRulegroupIdx >= 0) {
      this.ruleGroup.CropSteeringPrograms.splice(existRulegroupIdx, 1);
    }
    // if (existControllerIdx >= 0) {
    //   this.controller.SensorTriggers.splice(existControllerIdx, 1);
    // }
    this.sortCropSteeringPrograms(existPrograms);
    this.dataSource.update(existPrograms);
  }

  private sortCropSteeringPrograms(triggers: CropSteeringProgram[]) {
    triggers.sort((a, b) => {
      switch (this.sortColumn) {
        case 'sensor':
          const aSensor = a.SensorName || '';
          const bSensor = b.SensorName || '';
          return this.sortOrder === 'asc' ? aSensor.localeCompare(bSensor) : bSensor.localeCompare(aSensor);
        default:
          const aName = a.Name || '';
          const bName = b.Name || '';
          return this.sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
      }
    });
  }

  sortOrderChange(ev: {active: string; direction: SortOrders}) {
    const existTriggers = [...this.dataSource.Current];
    if (ev.direction === '') {
      this.sortColumn = 'name';
      this.sortOrder = 'asc';
    } else {
      this.sortColumn = ev.active;
      this.sortOrder = ev.direction;
    }
    this.sortCropSteeringPrograms(existTriggers);
    this.dataSource.update(existTriggers);
  }
}
