import {
  Component,
  Input,
  ViewEncapsulation,
  OnInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SensorRealTimeModel, SensorAlert } from '@models';
import { ParticleSensorsService } from '@services';

@Component({
  selector: 'fuse-sensor-gauge',
  templateUrl: './sensor-gauge.component.html',
  styleUrls: ['./sensor-gauge.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SensorGaugeComponent implements OnInit, OnChanges {
  @Input() sensor: SensorRealTimeModel;
  @Input() isLoading = true;
  @Input() custom = false;
  @Input() customName: string;
  @Input() sensorHistoricMin: number;
  @Input() sensorHistoricMax: number;
  @Input() euMin: number;
  @Input() euMax: number;

  get activeAlerts(): Observable<SensorAlert[]> {
    return this.sensor.activeAlerts;
  }

  get hasActiveAlerts(): Observable<boolean> {
    return this.activeAlerts.pipe(map((alerts) => alerts.length > 0));
  }

  public canvasWidth = 250;
  public get euRange() {
    return this.euMax - this.euMin;
  }
  public get euPrecision() {
    return this.euRange <= 10.0 ? 1 : 0;
  }
  public get digital() {
    if (!this.sensor) {
      return false;
    }

    return this.sensor.particleSensor.IsBinary;
  }
  public gaugeOptions: any;

  constructor(private router: Router) {}

  ngOnInit() {
    if (this.custom) {
      this.canvasWidth = 300;
    }

    const delimiters = this.digital ? [] : [25, 75];
    const delimiterLabels = this.digital
      ? []
      : [
          this.sensorHistoricMin.toFixed(this.euPrecision),
          this.sensorHistoricMax.toFixed(this.euPrecision),
        ];
    const rangeLabels = this.digital
      ? []
      : [this.euMin.toFixed(this.euPrecision), this.euMax.toFixed(this.euPrecision)];

    this.gaugeOptions = {
      hasNeedle: true,
      needleColor: 'gray',
      needleUpdateSpeed: 1000,
      arcColors: ['lightgray', 'rgb(44, 151, 222)', 'lightgray'],
      arcDelimiters: delimiters,
      arcLabelFontSize: 15,
      arcLabels: delimiterLabels,
      rangeLabel: rangeLabels,
      needleStartValue: 50,
    };

    this.setScaledHistoryMin(this.sensorHistoricMin);
    this.setScaledHistoryMax(this.sensorHistoricMax);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.gaugeOptions) {
      const rangeLabels = this.digital
        ? []
        : [this.euMin.toFixed(this.euPrecision), this.euMax.toFixed(this.euPrecision)];
      this.gaugeOptions.rangeLabel = rangeLabels;
    }

    if (!this.digital && changes.sensorHistoricMin) {
      const newMin = changes.sensorHistoricMin.currentValue as number;
      this.setScaledHistoryMin(newMin);
      this.setScaledHistoryMax(this.sensorHistoricMax);
    }
    if (!this.digital && changes.sensorHistoricMax) {
      const newMax = changes.sensorHistoricMax.currentValue as number;
      this.setScaledHistoryMin(this.sensorHistoricMin);
      this.setScaledHistoryMax(newMax);
    }
    if (!this.digital && changes.euMin) {
      this.setScaledHistoryMin(this.sensorHistoricMin);
      this.setScaledHistoryMax(this.sensorHistoricMax);
    }
    if (!this.digital && changes.euMax) {
      this.setScaledHistoryMax(this.sensorHistoricMax);
      this.setScaledHistoryMax(this.sensorHistoricMax);
    }
  }

  private setScaledHistoryMax(newMax: number) {
    if (newMax === Number.MIN_VALUE || newMax === undefined) {
      this.gaugeOptions.arcDelimiters[1] = 0.2;
      this.gaugeOptions.arcLabels[1] = '';
      return;
    }

    if (this.gaugeOptions) {
      let newMaxScaled = ((newMax - this.euMin) / this.euRange) * 100.0;
      const curMinScaled = this.gaugeOptions.arcDelimiters[0] as number;
      if (Math.abs(newMaxScaled - curMinScaled) < 1 || newMaxScaled < curMinScaled) {
        newMaxScaled = curMinScaled + 1;
      }
      if (newMaxScaled >= 99) {
        newMaxScaled = 99;
      }
      this.gaugeOptions.arcDelimiters[1] = newMaxScaled;
      this.gaugeOptions.arcLabels[1] = newMax.toFixed(this.euPrecision);
    }
  }

  private setScaledHistoryMin(newMin: number) {
    if (newMin === Number.MAX_VALUE || newMin === undefined) {
      this.gaugeOptions.arcDelimiters[0] = 0.1;
      this.gaugeOptions.arcLabels[0] = '';
      return;
    }

    if (this.gaugeOptions) {
      let newMinScaled = ((newMin - this.euMin) / this.euRange) * 100.0;
      const curMaxScaled = this.gaugeOptions.arcDelimiters[1];
      if (Math.abs(curMaxScaled - newMinScaled) < 1 || newMinScaled > curMaxScaled) {
        newMinScaled = curMaxScaled - 1;
      }
      if (newMinScaled <= 1) {
        newMinScaled = 1;
      }
      this.gaugeOptions.arcDelimiters[0] = newMinScaled;
      this.gaugeOptions.arcLabels[0] = newMin.toFixed(this.euPrecision);
    }
  }

  showChart() {
    this.router.navigate([
      'controller',
      this.sensor.controllerId,
      'journal',
      { id: this.sensor.deviceId },
    ]);
  }
}
