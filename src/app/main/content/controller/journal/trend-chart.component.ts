import {
  Component,
  Input,
  ViewEncapsulation,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostListener,
  ContentChild,
  TemplateRef,
  TrackByFunction
} from '@angular/core';
import {
  trigger,
  style,
  animate,
  transition
} from '@angular/animations';
import * as moment from 'moment';

import {
  BaseChartComponent, calculateViewDimensions, ViewDimensions, ColorHelper, Orientation, ScaleType, StringOrNumberOrDate, TimelineScaleType, Series, DataItem, AreaChartSeries
} from '@swimlane/ngx-charts';
import { CurveFactory, curveStepAfter } from 'd3-shape';
import { ScaleLinear, scaleLinear, ScaleTime, scaleTime } from 'd3-scale';
import { id } from '@swimlane/ngx-charts';
import { Controller, DataPointMetric, UserPrefs } from '@models';
import { TimeUtil } from '@util';

@Component({
  selector: 'fuse-trend-chart-component',
  templateUrl: 'trend-chart.component.html',
  styleUrls: ['./trend-chart.component.scss'],
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
export class TrendChartComponent extends BaseChartComponent {
  curve: CurveFactory = curveStepAfter;
  curve2: CurveFactory = curveStepAfter;
  activeEntries: TrendDataPoint[] = [];
  shadingSeries: AreaChartSeries;

  @Input()
  get sensorsSeries(): TrendChartSensorSeries[] {
    return this.results;
  }
  set sensorsSeries(value: TrendChartSensorSeries[]) {
    this.results = value;
    this.yAxes = [];
    value.forEach((series, idx) => {
      // debugger;
      const yDomain = this.getYDomain(series);
      const yScale = this.getYScale(yDomain, this.dims.height);
      const yTimelineScale = this.getYScale(yDomain, this.timelineHeight);

      const existAxes = this.yAxes.find(axis => axis.sensorType === series.sensorType
        && axis.unitOfMeasure === series.unitOfMeasure);

      if (!!existAxes) {
        if (!existAxes.seriesIndexes.find(sIdx => sIdx === idx)) {
          existAxes.seriesIndexes.push(idx);
        }
        const existDomain = existAxes.scale.domain();
        if (yDomain[0] < existDomain[0]) { existDomain[0] = yDomain[0]; }
        if (yDomain[1] > existDomain[1]) { existDomain[1] = yDomain[1]; }
        existAxes.scale = this.getYScale(existDomain, this.dims.height);
        existAxes.timelineScale = this.getYScale(existDomain, this.timelineHeight);

        return;
      }

      this.yAxes.push({
        scale: yScale,
        timelineScale: yTimelineScale,
        width: 15,
        unitOfMeasure: series.unitOfMeasure,
        seriesName: series.name,
        sensorType: series.sensorType,
        axisLabel: `${series.metric}${series.unitOfMeasure ? ' [' + series.unitOfMeasure + ']' : ''}`,
        seriesIndexes : [idx]
      });
    });

    this.update();
  }

  @Input() deviceSeries: TrendChartDeviceSeries[];
  @Input() modeSeries: TrendChartDeviceModeSeries[];
  @Input() scheme2 = 'forest';

  @Input() isHourly = false;
  @Input() userPrefs: UserPrefs;
  @Input() controller: Controller;

  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() deactivate: EventEmitter<any> = new EventEmitter();
  @Output() updated: EventEmitter<void> = new EventEmitter();

  @ContentChild('tooltipTemplate') tooltipTemplate: TemplateRef<any>;
  @ContentChild('seriesTooltipTemplate') seriesTooltipTemplate: TemplateRef<any>;

  dims: ViewDimensions;
  xSet: Date[];
  xDomain: Date[];
  yDomain: number[];
  yDomain2: number[];
  rDomain: number[];
  yScale: ScaleLinear<number, number>;
  yScale2: ScaleLinear<number, number>;
  yAxes: TrendYAxis[] = [];
  xScale: ScaleTime<number, number>;
  rScale: ScaleLinear<number, number>;
  colors: ColorHelper;
  colors2: ColorHelper;
  colorsShading: ColorHelper;
  scaleType = ScaleType.Time;
  transform: string;
  clipPath: string;
  clipPathId: string;
  series: any;
  areaPath: any;
  margin = [10, 40, 10, 20];
  hoveredVertical: Date; // the value of the x axis that is hovered over
  xAxisHeight = 0;
  yAxisSpacing = 45;
  filteredDomain: Date[];
  timelineWidth: number;
  timelineHeight = 50;
  timelineXScale: ScaleTime<number, number>;
  timelineYScale: ScaleLinear<number, number>;
  timelineYScale2: ScaleLinear<number, number>;
  timelineXDomain: Date[];
  timelineTransform: string;
  timelinePadding = 10;
  timelineScaleType = TimelineScaleType.Time;
  seriesData = false;
  deviceData = false;
  anyData = false;

  rightOrientation = Orientation.Right;

  get allSeries(): Series[] {
    return (this.sensorsSeries as Array<Series>).concat((this.deviceSeries as Array<Series>));
  }

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
  };

  update(): void {
    // console.log('update() called ');
    super.update();

    this.dims = calculateViewDimensions({
      width: this.width - (this.deviceSeries && this.deviceSeries.length ? 50 : 0),
      height: this.height,
      margins: this.margin,
      showXAxis: true,
      showYAxis: true,
      xAxisHeight: this.xAxisHeight,
      yAxisWidth: this.yAxes.reduce((total, yAxis) => total += yAxis.width + this.yAxisSpacing, 0),
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

    this.yDomain = this.getTotalYDomain();
    this.yDomain2 = this.getYDomain2();
    this.rDomain = this.getRDomain();

    this.shadingSeries = this.getShadingSeries();

    this.xScale = this.getXScale(this.xDomain, this.dims.width);
    this.yScale = this.getYScale(this.yDomain, this.dims.height);
    this.yScale2 = this.getYScale(this.yDomain2, this.dims.height);

    this.rScale = this.getRScale(this.rDomain, [5, 5]);

    this.updateTimeline();
    this.setColors();

    this.transform = `translate(${this.dims.xOffset} , ${this.margin[0]})`;

    this.clipPathId = 'clip' + id().toString();
    this.clipPath = `url(#${this.clipPathId})`;

    this.seriesData = this.sensorsSeries && this.sensorsSeries.length > 0;
    this.deviceData = this.deviceSeries && this.deviceSeries.length > 0;
    this.anyData = this.seriesData || this.deviceData;

    this.updated.emit();
  }

  updateTimeline(): void {
    this.timelineWidth = this.dims.width;
    this.timelineXDomain = this.getXDomain();
    this.timelineXScale = this.getXScale(this.timelineXDomain, this.timelineWidth);
    this.timelineYScale = this.getYScale(this.yDomain, this.timelineHeight);
    this.timelineYScale2 = this.getYScale(this.yDomain2, this.timelineHeight);
    this.timelineTransform = `translate(${this.dims.xOffset}, ${-this.margin[2]})`;
  }

  getShadingSeries(): AreaChartSeries {
    const shading: AreaChartSeries = {
      name: 'Day Night Shading',
      series: [],
    };

    for (const series of this.sensorsSeries || []) {
      for (const dataPoint of series.series) {
        shading.series.push({name: dataPoint.name, value: dataPoint.timeOfDay === 1 ? 0 : 100, d0: 0, d1: 0});
      }
    }

    return shading;
  }

  getXDomain(): Date[] {
    const valueSet = new Set<Date>();
    for (const result of this.results || []) {
      for (const d of result.series) {
        valueSet.add(d.name);
      }
    }
    for (const result of this.deviceSeries || []) {
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
  getTotalYDomain(): number[] {
    const domain = new Array<number>();
    for (const result of this.sensorsSeries) {
      for (const d of result.series) {
        if (domain.indexOf(d.value) < 0) {
          domain.push(d.value);
        }
      }
    }

    const values = [...domain];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    return [min, max + (range * 0.1)];
  }
  getYDomain(result: TrendChartSensorSeries): number[] {
    const domain = new Array<number>();
    for (const d of result.series) {
      if (domain.indexOf(d.value) < 0) {
        domain.push(d.value);
      }
    }

    const values = [...domain];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    return [min, max + (range * 0.1)];
  }
  getYDomain2(): number[] {
    return [0, 100];
  }
  getRDomain(): number[] {
    return [0, 100];
  }

  getXScale(domain: Date[], width: number): ScaleTime<number, number> {
    return scaleTime().range([0, width]).domain(domain);
  }
  getYScale(domain: number[], height: number): ScaleLinear<number, number> {
    return scaleLinear().range([height, 0]).domain(domain).nice();
  }
  getRScale(domain: number[], range: number[]): ScaleLinear<number, number> {
    return scaleLinear().range(range).domain(domain);
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

  setColors(): void {
    this.colors = new ColorHelper(this.scheme, this.schemeType, this.yDomain, this.customColors);
    this.colors2 = new ColorHelper(this.scheme2, this.schemeType, this.yDomain2, this.customColors);
    this.colorsShading = new ColorHelper({domain: ['#0000000D']}, this.schemeType, this.yDomain2, this.customColors);
  }

  getSensorColor(nodeId: string): string {
    return this.colors.getColor(nodeId);
  }
  getDeviceColor(nodeId: string): string {
    return this.colors2.getColor(nodeId);
  }

  updateYAxisWidth(idx: number, { width }): void {
    this.yAxes[idx].width = width;
    this.update();
  }
  updateYAxis2Width({ width }): void {
    this.update();
  }
  getYOffset(idx: number): number {
    if (idx < 1) { return 0; }

    let prevWidths = 0;
    for (let index = idx - 1; index >= 0; index--) {
      const element = this.yAxes[index];
      prevWidths += element.width + this.yAxisSpacing;
    }

    return prevWidths;
  }

  updateXAxisHeight({ height }): void {
    this.xAxisHeight = height;
    this.update();
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

export interface TrendChartSensorSeries extends Series {
  name: string;
  metric: string;
  unitOfMeasure: string;
  sensorType: DataPointMetric;
  series: TrendChartSensorDataPoint[];
}
export interface TrendChartDeviceSeries extends Series {
  name: string;
  series: TrendChartDeviceDataPoint[];
}
export interface TrendChartDeviceModeSeries extends Series {
  name: string;
  series: TrendChartDeviceModePoint[];
}

export interface TrendDataPoint extends DataItem {
  name: Date;
  value: number;
}

export class TrendChartSensorDataPoint implements TrendDataPoint {
  name: Date;
  value: number;
  timeOfDay: number;
}
export class TrendChartDeviceDataPoint implements TrendDataPoint {
  name: Date;
  value: number;
  auto: boolean;
}

export class TrendChartDeviceModePoint implements TrendDataPoint {
  name: Date;
  value: number;
  auto: boolean;
  x: Date;
  y: number;
  r: number;
}

export class TrendYAxis {
  scale: ScaleLinear<number, number>;
  timelineScale: ScaleLinear<number, number>;
  width: number;
  unitOfMeasure: string;
  sensorType: DataPointMetric;
  axisLabel: string;
  seriesName: string;
  seriesIndexes: number[];
}
