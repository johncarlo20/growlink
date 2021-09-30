import {
  Component,
  Input,
  ViewEncapsulation,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostListener,
  ContentChild,
  TemplateRef
} from '@angular/core';
import {
  trigger,
  style,
  animate,
  transition
} from '@angular/animations';
import * as moment from 'moment';

import {
  BaseChartComponent, calculateViewDimensions, ViewDimensions, ColorHelper, ScaleType, TimelineScaleType, StringOrNumberOrDate, AreaChartSeries
} from '@swimlane/ngx-charts';
import { CurveFactory, curveStepAfter } from 'd3-shape';
import { ScaleLinear, scaleLinear, ScaleTime, scaleTime } from 'd3-scale';
import { id } from '@swimlane/ngx-charts';
import { DataPointMetric, UserPrefs } from '@models';
import { TimeUtil } from '@util';
import { TrendChartSensorSeries, TrendDataPoint } from './trend-chart.component';

@Component({
  selector: 'fuse-sensor-chart',
  templateUrl: './sensor-chart.component.html',
  styleUrls: ['./sensor-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('animationState', [
      transition(':leave', [
        style({
          opacity: 1,
        }),
        animate(500, style({
          opacity: 0
        }))
      ])
    ])
  ]
})
export class SensorChartComponent extends BaseChartComponent {
  curve: CurveFactory = curveStepAfter;
  activeEntries: TrendDataPoint[] = [];
  shadingSeries: AreaChartSeries;

  @ContentChild('tooltipTemplate') tooltipTemplate: TemplateRef<any>;
  @ContentChild('seriesTooltipTemplate') seriesTooltipTemplate: TemplateRef<any>;

  @Input() isHourly = false;
  @Input() userPrefs: UserPrefs;

  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() deactivate: EventEmitter<any> = new EventEmitter();

  dims: ViewDimensions;
  xSet: Date[];
  xDomain: Date[];
  yDomain: number[];
  yDomain2: number[];
  xScale: ScaleTime<number, number>;
  yScale: ScaleLinear<number, number>;
  yScale2: ScaleLinear<number, number>;
  colorsShading: ColorHelper;
  colors: ColorHelper;
  scaleType = ScaleType.Time;
  hasRange: boolean;
  transform: string;
  clipPath: string;
  clipPathId: string;
  margin = [10, 40, 10, 20];
  hoveredVertical: Date; // the value of the x axis that is hovered over
  xAxisHeight = 0;
  yAxisWidth = 15;
  filteredDomain: Date[];
  timelineWidth: number;
  timelineHeight = 50;
  timelineXScale: ScaleTime<number, number>;
  timelineYScale: ScaleLinear<number, number>;
  timelineXDomain: Date[];
  timelineTransform: string;
  timelinePadding = 10;
  timelineScaleType = TimelineScaleType.Time;

  xFormat = (val: Date) => {
    const timeFormat = TimeUtil.preferredTimeFormat(this.userPrefs.prefer24Hour, false);
    const timeSecondsFormat = TimeUtil.preferredTimeFormat(this.userPrefs.prefer24Hour, true);

    if (val.getSeconds() !== 0) {
      return moment(val).format(timeSecondsFormat);
    }
    if (val.getMinutes() !== 0) {
      return moment(val).format(timeFormat);
    }
    if (val.getHours() !== 0) {
      return moment(val).format(timeFormat);
    }

    return val.getDay() === 0 ? moment(val).format('MMM D') : moment(val).format('ddd D');
  }

  update(): void {
    // console.log('update() called ');
    super.update();

    this.dims = calculateViewDimensions({
      width: this.width,
      height: this.height,
      margins: this.margin,
      showXAxis: true,
      showYAxis: true,
      xAxisHeight: this.xAxisHeight,
      yAxisWidth: this.yAxisWidth,
      showXLabel: false,
      showYLabel: false,
      showLegend: false,
      legendType: this.schemeType,
    });

    this.dims.height -= (this.timelineHeight + this.margin[2] + this.timelinePadding);

    this.xDomain = this.getXDomain();
    if (this.filteredDomain && this.filteredDomain[0] > this.xDomain[0 && this.filteredDomain[1] < this.xDomain[1]]) {
      this.xDomain = this.filteredDomain;
    } else if (this.filteredDomain) {
      this.filteredDomain = null;
    }

    this.yDomain = this.getYDomain();
    this.yDomain2 = [0, 100];

    this.shadingSeries = this.getShadingSeries();

    this.xScale = this.getXScale(this.xDomain, this.dims.width);
    this.yScale = this.getYScale(this.yDomain, this.dims.height);
    this.yScale2 = this.getYScale(this.yDomain2, this.dims.height);

    this.updateTimeline();
    this.setColors();

    this.transform = `translate(${this.dims.xOffset} , ${this.margin[0]})`;

    this.clipPathId = 'clip' + id().toString();
    this.clipPath = `url(#${this.clipPathId})`;
    // this.updated.emit();
  }

  getXDomain(): Date[] {
    const valueSet = new Set<Date>();
    for (const result of this.results || []) {
      for (const d of result.series) {
        valueSet.add(d.name);
      }
    }

    const values = Array.from(valueSet);
    const min = Math.min(...values.map(d => d.getTime()));
    const max = Math.max(...values.map(d => d.getTime()));

    const domain = [new Date(min), new Date(max)];
    this.xSet = [...values].sort((a, b) => {
      const aDate = new Date(a).getTime();
      const bDate = new Date(b).getTime();
      if (aDate > bDate) { return 1; }
      if (bDate > aDate) { return -1; }
      return 0;
    });

    return domain;
  }
  getYDomain(): number[] {
    const domain = new Array<number>();
    for (const result of this.results || []) {
      for (const d of result.series) {
        if (domain.indexOf(d.value) < 0) {
          domain.push(d.value);
        }
        if (d.min !== undefined) {
          this.hasRange = true;
          if (domain.indexOf(d.min) < 0) {
            domain.push(d.min);
          }
        }
        if (d.max !== undefined) {
          this.hasRange = true;
          if (domain.indexOf(d.max) < 0) {
            domain.push(d.max);
          }
        }
      }
    }

    const values = [...domain];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    return [min, max + (range * 0.1)];
  }
  getXScale(domain: Date[], width: number): ScaleTime<number, number> {
    return scaleTime().range([0, width]).domain(domain);
  }
  getYScale(domain: number[], height: number): ScaleLinear<number, number> {
    return scaleLinear().range([height, 0]).domain(domain);
  }
  getShadingSeries(): AreaChartSeries {
    const shading: AreaChartSeries = {
      name: 'Day Night Shading',
      series: [],
    };

    for (const series of this.results || []) {
      for (const dataPoint of series.series) {
        shading.series.push({name: dataPoint.name, value: dataPoint.timeOfDay === 1 ? 0 : 100, d0: 0, d1: 0});
      }
    }

    return shading;
  }
  updateTimeline(): void {
    this.timelineWidth = this.dims.width;
    this.timelineXDomain = this.getXDomain();
    this.timelineXScale = this.getXScale(this.timelineXDomain, this.timelineWidth);
    this.timelineYScale = this.getYScale(this.yDomain, this.timelineHeight);
    this.timelineTransform = `translate(${this.dims.xOffset}, ${-this.margin[2]})`;
  }
  setColors(): void {
    this.colors = new ColorHelper({domain: ['#42BFF7']}, this.schemeType, this.yDomain, this.customColors);
    this.colorsShading = new ColorHelper({domain: ['#0000000D']}, this.schemeType, this.yDomain2, this.customColors);
  }
  updateXAxisHeight({ height }): void {
    this.xAxisHeight = height;
    this.update();
  }
  updateYAxisWidth({ width }): void {
    this.yAxisWidth = width;
    this.update();
  }
  updateDomain(domain: Date[]): void {
    this.filteredDomain = domain;
    this.xDomain = this.filteredDomain;
    this.xScale = this.getXScale(this.xDomain, this.dims.width);
  }

  updateHoveredVertical(item: {value: Date}): void {
    this.hoveredVertical = item.value;
    this.deactivateAll();
  }

  @HostListener('mouseleave')
  hideCircles(): void {
    this.hoveredVertical = null;
    this.deactivateAll();
  }

  onClick(data, series?): void {
    if (series) {
      data.series = series.name;
    }

    this.select.emit(data);
  }

  onActivate(item: {name: StringOrNumberOrDate}) {
    this.deactivateAll();

    const idx = this.activeEntries.findIndex(d => {
      return d.name === item.name;
    });
    if (idx > -1) {
      return;
    }

    // this.activeEntries = [item];
    this.activate.emit({ value: item, entries: this.activeEntries });
  }

  onDeactivate(item: {name: StringOrNumberOrDate}) {
    const idx = this.activeEntries.findIndex(d => {
      return d.name === item.name;
    });

    this.activeEntries.splice(idx, 1);
    this.activeEntries = [...this.activeEntries];

    this.deactivate.emit({ value: item, entries: this.activeEntries });
  }

  deactivateAll() {
    this.activeEntries = [...this.activeEntries];
    for (const entry of this.activeEntries) {
      this.deactivate.emit({ value: entry, entries: [] });
    }
    this.activeEntries = [];
  }

  toTimestamp(data: string): string {
    const mom = moment(data);
    const timeFormat = TimeUtil.preferredTimeFormat(this.userPrefs.prefer24Hour, false);

    return mom.format(this.isHourly ? `D MMM YYYY ${timeFormat}` : 'D MMM YYYY');
  }
  toTimestamp2(data: string): string {
    const mom = moment(data);
    const timeFormat = TimeUtil.preferredTimeFormat(this.userPrefs.prefer24Hour, false);

    return mom.format(`D MMM YYYY ${timeFormat}`);
  }

  toTimePlusOne(data: string): string {
    const mom = moment(data).add(1, this.isHourly ? 'hour' : 'day');
    const timeFormat = TimeUtil.preferredTimeFormat(this.userPrefs.prefer24Hour, false);

    return mom.format(this.isHourly ? timeFormat : 'D MMM YYYY');
  }
}
