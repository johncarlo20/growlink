import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as shape from 'd3-shape';

import { SensorRealTimeModel, SensorAlert, LightSensorWidgetOptions } from '@models';

@Component({
  selector: 'fuse-sensor-light',
  templateUrl: './sensor-light.component.html',
  styleUrls: ['./sensor-light.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SensorLightComponent implements OnInit {
  @Input() sensor: SensorRealTimeModel;
  @Input() custom = false;
  @Input() isLoading = true;
  @Input() customName: string;
  @Input()
  set options(value: LightSensorWidgetOptions) {
    this._options = value;
    this.chart = this._options.WidgetSize === 'full';
    this.timestamp = this._options.WidgetSize === 'full' || this._options.WidgetSize === 'compact';
  }
  get options(): LightSensorWidgetOptions {
    return this._options;
  }

  private _options: LightSensorWidgetOptions;

  get activeAlerts(): Observable<SensorAlert[]> {
    return this.sensor.activeAlerts;
  }

  get firstActiveAlert(): Observable<SensorAlert> {
    return this.activeAlerts.pipe(
      map(alerts => alerts.length > 0 ? alerts[0] : null)
    );
  }

  get hasActiveAlerts(): Observable<boolean> {
    return this.activeAlerts.pipe(
      map(alerts => alerts.length > 0)
    );
  }
  get hasChartData(): Observable<boolean> {
    return this.sensor.chartData && this.sensor.chartData.length &&
      this.sensor.chartData[0].series && this.sensor.chartData[0].series.length;
  }

  get minMaxLabel(): Observable<string> {
    return combineLatest([this.sensor.chartMin, this.sensor.chartMax]).pipe(
      map(([min, max]) => {
        if (!min || !max || this.sensor.particleSensor.IsBinary || !this.hasChartData) {
          return null;
        }

        const minValue = min.toFixed(1).endsWith('.0') ? min.toFixed(0) : min.toFixed(1);
        const maxValue = max.toFixed(1).endsWith('.0') ? max.toFixed(0) : max.toFixed(1);
        if (minValue === maxValue) {
          return null;
        }

        return `${minValue} - ${maxValue}${this.sensor.readingSuffix || ''}`;
      })
    );
  }

  get lightImageStyle(): Observable<SafeStyle> {
    return this.sensor.floatValue.pipe(
      map(curValue => {
        if (this.sensor.age === -1) {
          return this.sanitizer.bypassSecurityTrustStyle('opacity: 0.5');
        }

        if (curValue >= this.options.OnThreshold) {
          return this.sanitizer.bypassSecurityTrustStyle('filter: invert(48%) sepia(97%) saturate(2448%) hue-rotate(90deg) brightness(125%) contrast(121%)');
        }

        return this.sanitizer.bypassSecurityTrustStyle('filter: invert(21%) sepia(84%) saturate(7376%) hue-rotate(357deg) brightness(100%) contrast(114%)');
      })
    );
  }

  chartOptions: any;
  chart = false;
  timestamp = false;

  constructor(private router: Router, private sanitizer: DomSanitizer) {
    this.chartOptions = {
      xAxis: true,
      yAxis: false,
      gradient: false,
      legend: false,
      showXAxisLabel: false,
      showYAxisLabel: false,
      autoScale: true,
      scheme: {
        domain: ['#42BFF7', '#C6ECFD', '#C7B42C', '#AAAAAA']
      },
      curve: shape.curveBasis
    };
  }

  ngOnInit() {
  }

  showChart() {
    this.router.navigate(['controller', this.sensor.controllerId, 'journal', { id: this.sensor.deviceId }]);
  }
}
