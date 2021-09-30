import { Component, OnInit, OnChanges, DoCheck, ViewChild, Input, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as GaugeChart from 'gauge-chart';
import { SensorAlert } from '@models';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'rg-gauge-chart',
  templateUrl: './gauge-chart.component.html',
  styleUrls: ['./gauge-chart.component.scss']
})
export class GaugeChartComponent implements OnInit, OnChanges, DoCheck, AfterViewInit {
  @ViewChild('gaugeArea') gaugeArea;

  @Input() canvasWidth: number;
  @Input() needleValue: number;
  @Input() centralLabel: string;
  @Input() readingSuffix: string;
  @Input() options;
  @Input() wrapOptions?;
  @Input() name?: string;
  @Input() nameFont?: string;
  @Input() bottomLabel?: string;
  @Input() bottomLabelFont?: string;
  @Input() activeAlerts: Observable<SensorAlert[]>;

  public nameMargin: string;
  public bottomLabelMargin: string;

  private element;
  private gaugeChart: any;
  private oldOptions;

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

  ngOnInit() {
    // calculate styles for name and bottomLabel
    if (this.name) {
      if (!this.nameFont) {
        this.nameFont = '' + Math.round(this.canvasWidth / 15);
      }
      this.nameMargin = '' + Math.round(+this.nameFont / 4);
    }

    if (this.bottomLabel) {
      if (!this.bottomLabelFont) {
        this.bottomLabelFont = '' + Math.round(this.canvasWidth / 10);
      }
      this.bottomLabelMargin = '-' + this.bottomLabelFont;
    }

    this.oldOptions = JSON.parse(JSON.stringify(this.options));
  }

  ngAfterViewInit(): void {
    if (this.gaugeArea && this.optionsCheck()) {
      this.element = this.gaugeArea.nativeElement;
      this.drawChart();
    }
  }

  optionsCheck() {
    if (this.canvasWidth == null) {
      console.warn('gauge-chart warning: canvasWidth is not specified!');
      return false;
    } else if (this.needleValue == null) {
      console.warn('gauge-chart warning: needleValue is not specified!');
      return false;
    }
    if (this.centralLabel == null) {
      this.centralLabel = '';
    }
    return true;
  }

  ngDoCheck() {
    if (!this.areEqual(this.options, this.oldOptions)) {
      this.drawChart(true);
      this.oldOptions = JSON.parse(JSON.stringify(this.options));
    }
  }

  areEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  drawChart(redraw = false) {
    if (redraw) {
      this.gaugeChart.removeGauge();
    }
    this.options.centralLabel = this.centralLabel;
    this.gaugeChart = GaugeChart.gaugeChart(
      this.element,
      this.canvasWidth,
      this.options
    );
    this.gaugeChart.updateNeedle(this.needleValue);
  }

  ngOnChanges(changes) {
    if (changes.needleValue && !changes.needleValue.firstChange) {
      this.needleValue = changes.needleValue.currentValue;
      this.gaugeChart.updateNeedle(this.needleValue);
    }
    if (changes.centralLabel && !changes.centralLabel.firstChange) {
      this.centralLabel = changes.centralLabel.currentValue;
      this.drawChart(true);
    }
  }
}
