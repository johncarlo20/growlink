import { Component, Input, ViewEncapsulation, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import * as shape from 'd3-shape';

import { SensorRealTimeModel, SensorAlert } from '@models';

@Component({
  selector: 'fuse-sensor-display',
  templateUrl: './sensor-display.component.html',
  styleUrls: ['./sensor-display.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SensorDisplayComponent implements OnInit {
  @Input() sensor: SensorRealTimeModel;
  @Input() custom = false;
  @Input() isLoading = true;
  @Input() customName: string;
  @Input() chart = true;
  @Input() timestamp = true;

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

  get isBinary(): boolean {
    return this.sensor.particleSensor.IsBinary;
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

  chartOptions: any;

  constructor(private router: Router) {
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
    if (this.isBinary) {
      this.chartOptions.autoScale = false;
      this.chartOptions.yScaleMin = 0;
      this.chartOptions.yScaleMax = 1;
      this.chartOptions.curve = shape.curveStepAfter;
    }
  }

  showChart() {
    this.router.navigate(['controller', this.sensor.controllerId, 'journal', { id: this.sensor.deviceId }]);
  }
}
