import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SensorResponse, Controller, ParticleSensorResponse, ParticleSensor, ModuleResponse, ProductTypeResponse } from '@models';
import { ProgressBarService, ControllerService, ParticleSensorsService, ActiveControllerService, ProductTypesService } from '@services';
import { BaseAPIComponent } from '@util';
import { take, takeWhile } from 'rxjs/operators';
import * as moment from 'moment';

export interface EditSensorDialogModel {
  sensor: SensorResponse;
  module: ModuleResponse;
  controller: Controller;
  particleSensor: ParticleSensorResponse;
}

@Component({
  selector: 'fuse-edit-sensor-dialog',
  templateUrl: './edit-sensor-dialog.component.html',
})
export class EditSensorDialogComponent extends BaseAPIComponent implements OnInit {
  editSensorForm: FormGroup;
  sensor: SensorResponse;
  module: ModuleResponse;
  controller: Controller;
  productType: ProductTypeResponse;
  particleSensor: ParticleSensorResponse;
  originalIntercept: number;
  originalSlope: number;
  unscaledCurrent = 0.0;
  calcField: 'cur' | 'max' = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditSensorDialogModel,
    public dialogRef: MatDialogRef<EditSensorDialogComponent>,
    private controllerService: ControllerService,
    private productService: ProductTypesService,
    private activeControllerService: ActiveControllerService,
    private particleSensorsService: ParticleSensorsService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);

    this.sensor = { ...data.sensor };
    this.module = data.module;
    this.controller = data.controller;
    this.particleSensor = data.particleSensor;
    this.productType = this.productService.FindProductType(this.module.ProductType);
    this.originalIntercept = this.sensor.CalibrationIntercept;
    this.originalSlope = this.sensor.CalibrationSlope;
  }

  ngOnInit() {
    super.ngOnInit();

    this.editSensorForm = new FormGroup({
      name: new FormControl(this.sensor.Name, [Validators.required]),
      adjust: new FormControl(
        this.sensor.CalibrationIntercept ? this.sensor.CalibrationIntercept : 0
      ),
      minRangeValue: new FormControl(+((this.sensor.CalibrationSlope * 4) + this.sensor.CalibrationIntercept).toFixed(2)),
      curRangeValue: new FormControl(+((this.sensor.CalibrationSlope * 0) + this.sensor.CalibrationIntercept).toFixed(2)),
      maxRangeValue: new FormControl(+((this.sensor.CalibrationSlope * 20) + this.sensor.CalibrationIntercept).toFixed(2)),
    });

    this.subs.add(
      this.editSensorForm.valueChanges.subscribe(() => {
        this.sensor.Name = this.name.value;
        if (this.particleSensor.AllowManualAdjustment) {
          this.sensor.CalibrationIntercept = this.adjust.value;
        }
      })
    );

    if (this.particleSensor.Id === ParticleSensor.AmbientCo2) {
      this.activeControllerService.SensorReadings.pipe(take(1)).subscribe((readings) => {
        const moduleSn = this.module.SerialNumber;
        const moduleReading = readings.find(r => r.sn === moduleSn);
        if (moduleReading && !!moduleReading.ct) {
          this.particleSensorsService.LoadControllerParticleSensors(this.controller, moduleReading.ct).subscribe((ps) => {
            this.particleSensor = ps.find(p => p.Id === ParticleSensor.AmbientCo2);
            if (this.particleSensor.AllowCalibrateToValue) {
              this.adjust.setValue(this.sensor.CalibrationValue);
            }
          });
        }
      });
    }

    if (this.SupportsCurrentCalibration) {
      this.subs.add(
        this.activeControllerService.SensorReadings.subscribe((readings) => {
          if (this.calcField !== null) {
            return;
          }

          const moduleSn = this.module.SerialNumber;
          const moduleReading = readings.find(r => r.sn === moduleSn);
          if (moduleReading) {
            let curValue = 0;
            switch (this.particleSensor.Id) {
              case ParticleSensor.CurrentLoopInput1:
                curValue = parseFloat(moduleReading.cl1);
                break;
              case ParticleSensor.CurrentLoopInput2:
                curValue = parseFloat(moduleReading.cl2);
                break;
              case ParticleSensor.CurrentLoopInput3:
                curValue = parseFloat(moduleReading.cl3);
                break;
              case ParticleSensor.CurrentLoopInput4:
                curValue = parseFloat(moduleReading.cl4);
                break;
              case ParticleSensor.CurrentLoopInput5:
                curValue = parseFloat(moduleReading.cl5);
                break;
            }

            this.unscaledCurrent = (curValue - this.originalIntercept) / this.originalSlope;
            this.curRangeValue.setValue(
              +((this.sensor.CalibrationSlope * this.unscaledCurrent) + this.sensor.CalibrationIntercept).toFixed(2),
              {emitEvent: false}
            );
          }
        })
      );

      this.subs.add(this.minRangeValue.valueChanges.subscribe((newValue) => {
        const y1 = parseFloat(newValue);
        const y2 = parseFloat(this.maxRangeValue.value);

        this.recalculateSlopeIntercept(4.0, 20.0, y1, y2);
      }));
      this.subs.add(this.maxRangeValue.valueChanges.subscribe((newValue) => {
        const y1 = parseFloat(this.minRangeValue.value);
        const y2 = parseFloat(newValue);

        this.recalculateSlopeIntercept(4.0, 20.0, y1, y2);
      }));
      this.subs.add(this.curRangeValue.valueChanges.subscribe((newValue) => {
        const y1 = parseFloat(this.minRangeValue.value);
        const y2 = parseFloat(newValue);

        this.recalculateSlopeIntercept(4.0, this.unscaledCurrent, y1, y2);
      }));
    }
  }

  private recalculateSlopeIntercept(x1: number, x2: number, y1: number, y2: number) {
    if (isNaN(y1) || isNaN(y2)) {
      return;
    }

    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - (m * x1);

    // console.log(x1, x2, y1, y2, m, b);

    this.sensor.CalibrationSlope = m;
    this.sensor.CalibrationIntercept = b;
    this.minRangeValue.setValue(
      +((this.sensor.CalibrationSlope * 4.0) + this.sensor.CalibrationIntercept).toFixed(2),
      {emitEvent: false}
    );
    this.curRangeValue.setValue(
      +((this.sensor.CalibrationSlope * this.unscaledCurrent) + this.sensor.CalibrationIntercept).toFixed(2),
      {emitEvent: false}
    );
    this.maxRangeValue.setValue(
      +((this.sensor.CalibrationSlope * 20.0) + this.sensor.CalibrationIntercept).toFixed(2),
      {emitEvent: false}
    );
  }

  public focusChanged(ev: Event) {
    console.log('focusChanged', ev);
    const srcInput = ev.target as HTMLInputElement;
    const minRangeInput = document.getElementById('minRange').parentElement.parentElement;
    const curRangeInput = document.getElementById('curRange').parentElement.parentElement;
    const maxRangeInput = document.getElementById('maxRange').parentElement.parentElement;
    if (!srcInput) {
      return;
    }

    switch (srcInput.id)
    {
      case 'minRange':
      case 'maxRange':
        minRangeInput.classList.remove('calc-range-element');
        maxRangeInput.classList.remove('calc-range-element');
        curRangeInput.classList.remove('input-range-element');
        minRangeInput.classList.add('input-range-element');
        maxRangeInput.classList.add('input-range-element');
        curRangeInput.classList.add('calc-range-element');
        this.calcField = 'cur';
        break;
      case 'curRange':
        minRangeInput.classList.remove('calc-range-element');
        curRangeInput.classList.remove('calc-range-element');
        maxRangeInput.classList.remove('input-range-element');
        minRangeInput.classList.add('input-range-element');
        curRangeInput.classList.add('input-range-element');
        maxRangeInput.classList.add('calc-range-element');
        this.calcField = 'max';
        break;
    }
  }

  public lostFocus() {
    const minRangeInput = document.getElementById('minRange').parentElement.parentElement;
    const curRangeInput = document.getElementById('curRange').parentElement.parentElement;
    const maxRangeInput = document.getElementById('maxRange').parentElement.parentElement;

    minRangeInput.classList.remove('input-range-element');
    minRangeInput.classList.remove('calc-range-element');
    curRangeInput.classList.remove('input-range-element');
    curRangeInput.classList.remove('calc-range-element');
    maxRangeInput.classList.remove('input-range-element');
    maxRangeInput.classList.remove('calc-range-element');

    this.calcField = null;
  }

  get name() {
    return this.editSensorForm.get('name');
  }
  get adjust() {
    return this.editSensorForm.get('adjust');
  }
  get minRangeValue() {
    return this.editSensorForm.get('minRangeValue');
  }
  get curRangeValue() {
    return this.editSensorForm.get('curRangeValue');
  }
  get maxRangeValue() {
    return this.editSensorForm.get('maxRangeValue');
  }

  get curRangeLabel() {
    return `Current Value (${this.unscaledCurrent.toFixed(2)}mA)`;
  }

  get adjustmentValue() {
    let value = this.adjust.value.toFixed(1);
    if (value[value.length - 1] === '0') { value = this.adjust.value.toFixed(0); }

    return `${value}${this.sensor.ReadingSuffix}`;
  }

  get SupportsCurrentCalibration() {
    if (!this.module || !this.particleSensor) {
      return false;
    }

    return this.productType.SupportsCurrentCalibration && this.particleSensor.IsCurrentLoop;
  }

  public update() {
    if (this.particleSensor.AllowCalibrateToValue) {
      this.sendCalibrationToController();
      return;
    }

    this.updateSensor();
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  private updateSensor() {
    this.controllerService.updateSensor(this.sensor).subscribe(
      r => {
        this.showMessage(`Successfully updated sensor ${this.sensor.Name}`);
        this.dialogRef.close(this.sensor);
      },
      error => this.handleError(error)
    );
  }

  private sendCalibrationToController() {
    const calibrateTo = this.adjust.value;
    let newTs = moment().diff(moment().startOf('day'), 'seconds');
    if (newTs >= 65535) {
      newTs -= 65535;
    }
    if (newTs === 0 || newTs === 55535) {
      newTs = 1;
    }

    this.controllerService
      .updateSensorCalibration(
        this.module.SerialNumber,
        this.sensor.ParticleSensor,
        calibrateTo,
        newTs)
      .subscribe((success) => {
        if (!success) {
          this.showError('Failed to send calibration value to controller');
          return;
        }

        this.pollForNewTs(calibrateTo, newTs);
      },
      error => this.handleError(error)
    );
  }

  pollForNewTs(calibrateTo: number, newTs: number) {
    let timeout = 0;
    let polling = true;
    this.progressBarService.SetLoading(true);

    const timeoutTimer = window.setInterval(() => {
      timeout++;
      if (timeout > 15) {
        polling = false;
        window.clearInterval(timeoutTimer);
        this.progressBarService.SetLoading(false);
        this.showError('Calibration failed');
      }
    }, 1000);

    this.activeControllerService.SensorReadings.pipe(takeWhile(() => polling)).subscribe((readings) => {
      const moduleSn = this.module.SerialNumber;
      const moduleReading = readings.find(r => r.sn === moduleSn);
      if (moduleReading && moduleReading.ct === newTs) {
        polling = false;
        window.clearInterval(timeoutTimer);
        this.progressBarService.SetLoading(false);
        this.sensor.CalibrationSlope = 1;
        this.sensor.CalibrationIntercept = 0;
        this.sensor.CalibrationValue = calibrateTo;

        this.updateSensor();
      }
    });
}

  protected showModelError(message: string, key: string, errors: string[]) {
    switch (key) {
      case 'Name':
        this.showServerErrors(this.name, errors);
        break;
      default:
        super.showModelError(message, key, errors);
        break;
    }
  }
}
