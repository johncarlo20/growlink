import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { distinctUntilChanged, switchMap, catchError, map, tap } from 'rxjs/operators';
import * as moment from 'moment';

import {
  Controller,
  JournalData,
  DayNightOption,
  JournalSensorStatistics,
  JournalDeviceStateChange,
  JournalSensor,
  JournalDevice,
  SelectItem,
  UserPrefs,
  SensorResponse,
  DataPointMetric,
} from '@models';
import {
  ControllerService,
  ProgressBarService,
  JournalDataService,
  UserPreferencesService,
} from '@services';
import { TimeUtil, BaseAPIComponent } from '@util';
import {
  TrendChartComponent,
  TrendChartDeviceDataPoint,
  TrendChartDeviceModePoint,
  TrendChartDeviceModeSeries,
  TrendChartDeviceSeries,
  TrendChartSensorSeries
} from './trend-chart.component';

@Component({
  selector: 'fuse-journal',
  templateUrl: './journal.component.html',
  styleUrls: ['./journal.component.scss'],
})
export class JournalComponent extends BaseAPIComponent implements OnInit {
  @ViewChild('sensorSelect') sensorSelect: MatSelect;
  @ViewChild('trendSelect') trendSelect: MatSelect;
  @ViewChild('trend') trend: TrendChartComponent;

  controller: Controller = new Controller();
  searchRanges: SelectItem[] = [];

  searchForm: FormGroup;
  journalData = new BehaviorSubject<JournalModuleData[]>([]);
  trendSensorChartData = new BehaviorSubject<JournalSensorData[]>([]);
  trendDeviceChartData = new BehaviorSubject<JournalDeviceData[]>([]);
  trendDeviceChartModes = new BehaviorSubject<JournalDeviceModeData[]>([]);
  trendSensorChartSeries = this.trendSensorChartData.pipe(
    map((data) => data.map((node) => node.trend))
  );
  trendDeviceChartSeries = this.trendDeviceChartData.pipe(
    map((data) => data.map((node) => node.trend))
  );
  trendDeviceChartModeSeries = this.trendDeviceChartModes.pipe(
    map((data) => data.map((node) => node.trend))
  );
  trendScheme = 'neons';
  trendScheme2 = 'cool';

  private searchTerms = new Subject<JournalSearchTerm>();
  private currentSearch: JournalSearchTerm = null;
  public userPrefs: UserPrefs;
  public selectedSensorId: string = null;
  public selectedTab = 0;
  public showSearch = true;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private journalDataService: JournalDataService,
    private userPrefService: UserPreferencesService,
    snackbar: MatSnackBar,
    progressBarService: ProgressBarService
  ) {
    super(snackbar, progressBarService);
    this.searchRanges = TimeUtil.loadSearchRanges();
  }

  ngOnInit() {
    super.ngOnInit();

    this.searchForm = new FormGroup({
      startDate: new FormControl('', [Validators.required]),
      endDate: new FormControl('', [Validators.required]),
      range: new FormControl('', [Validators.required]),
      hourly: new FormControl(true, [Validators.required]),
    });

    this.resetData();

    this.subs.add(
      this.controllerService.currentContainer.subscribe((r) => {
        this.updateController(r);
      })
    );

    this.subs.add(
      this.userPrefService.userPrefs.subscribe((prefs) => {
        this.userPrefs = prefs;
      })
    );

    const journalControllerData = this.searchTerms.pipe(
      distinctUntilChanged(),
      switchMap((term) => {
        this.currentSearch = term;
        if (!term) {
          return of(new JournalData());
        }

        return this.journalDataService
          .getJournalControllers(term.controllerId, term.startDate, term.endDate)
          .pipe(
            tap((data) => {
              if (!data.Controllers || !data.Controllers.length) {
                return;
              }

              setTimeout(() => {
                const selected = this.sensorSelect.options.find(
                  (opt) => opt.value.id === this.selectedSensorId
                );
                if (selected) {
                  selected.select();
                }

                if (this.selectedTab === 0) {
                  if (this.sensorSelect.empty) {
                    this.sensorSelect.open();
                  }
                }
                if (this.selectedTab === 1) {
                  if (this.trendSelect.empty) {
                    this.trendSelect.open();
                  }
                }
              }, 250);
            })
          );
      }),
      catchError((err, caught) => {
        this.handleError(err);
        return caught;
      })
    );

    this.subs.add(journalControllerData.subscribe((r) => this.processJournalData(r)));
    this.subs.add(this.range.valueChanges.subscribe((r) => this.setDates(r)));
    this.range.setValue(this.searchRanges[3].value);

    this.route.paramMap.subscribe((params) => {
      this.selectedSensorId = params.get('id');
      if (this.selectedSensorId) {
        this.range.setValue(this.searchRanges[1].value);
        this.showSearch = false;
        window.setTimeout(() => {
          this.search();
        });
      }
    });
  }

  get startDate() {
    return this.searchForm.get('startDate');
  }
  get endDate() {
    return this.searchForm.get('endDate');
  }
  get range() {
    return this.searchForm.get('range');
  }
  get hourly() {
    return this.searchForm.get('hourly');
  }
  get isHourly(): boolean {
    if (!this.currentSearch) {
      return false;
    }

    return this.currentSearch.isHourly;
  }

  get moduleSensors(): Observable<JournalSensorData[]> {
    return this.journalData.pipe(
      map((modules) =>
        modules.reduce((all, mod) => all.concat(mod.sensors), new Array<JournalSensorData>())
      ),
      tap((sensors) => sensors.sort((a, b) => a.sensorName.localeCompare(b.sensorName)))
    );
  }

  get moduleDevices(): Observable<JournalDeviceData[]> {
    return this.journalData.pipe(
      map((modules) =>
        modules.reduce((all, mod) => all.concat(mod.devices), new Array<JournalDeviceData>())
      ),
      tap((devices) => devices.sort((a, b) => a.deviceName.localeCompare(b.deviceName)))
    );
  }

  get allChartModes(): JournalDeviceModeData[] {
    return this.journalData.value.reduce(
      (all, mod) => all.concat(...mod.deviceModes),
      new Array<JournalDeviceModeData>()
    );
  }

  resetData() {
    this.journalData.next([]);
    this.trendSensorChartData.next([]);
    this.trendDeviceChartData.next([]);
    this.trendDeviceChartModes.next([]);
  }

  setDates(e: { startDate: Date; endDate: Date }): void {
    if (e === null || e.startDate === null || e.endDate === null) {
      return;
    }

    this.startDate.setValue(e.startDate);
    this.endDate.setValue(e.endDate);
  }

  customDate(_event) {
    this.range.setValue(this.searchRanges[0].value);
  }

  search() {
    if (!this.searchForm.valid || !this.controller || !this.controller.Guid) {
      return;
    }

    const searchTerm: JournalSearchTerm = {
      controllerId: this.controller.Guid,
      startDate: this.startDate.value,
      endDate: this.endDate.value,
      isHourly: this.hourly.value,
      dayNightOption: DayNightOption.TwentyFourHours,
    };

    this.searchTerms.next(searchTerm);
    this.showSearch = false;
  }

  export(filename: string, fileContents: string): void {
    fileContents = fileContents.replace(/[^\x00-\x7F]/g, '');
    const blob = new Blob([fileContents], { type: 'text/csv;charset=utf-8;' });
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, filename);
    } else {
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.setAttribute('href', url);
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  exportSensorData(): void {
    const term = this.currentSearch;
    this.journalDataService
      .getJournalSensorData(
        this.controller.Guid,
        null,
        term.startDate,
        term.endDate,
        term.isHourly,
        DayNightOption.TwentyFourHours
      )
      .subscribe((data) => {
        const resultController = data.Controllers[0];
        resultController.Modules.forEach((resultModule) => {
          var module = this.journalData.value.find((m) => m.id === resultModule.Id);
          if (!module) {
            return;
          }

          resultModule.Sensors.forEach((resultSensor) => {
            var sensor = module.sensors.find((s) => s.id === resultSensor.Id);
            if (!sensor) {
              return;
            }

            this.loadSensorChartData(sensor, resultSensor);
          });
        });

        this.exportSensorDataCSV();
      });
  }

  private exportSensorDataCSV() {
    const timeFormat = TimeUtil.preferredTimeFormat(this.userPrefs.prefer24Hour, true);
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    };
    const exportData = [];
    const header = ['Controller', 'Module', 'Sensor', 'Time', 'AvgValue', 'MinValue', 'MaxValue'];
    exportData.push(header);
    for (const t of this.journalData.value) {
      for (const d of t.sensors) {
        for (const dta of d.individual.fullData[0].series.slice(1)) {
          const av: Date = dta.name;
          const rowDte = av.toLocaleDateString('en-us', dateOptions).replace(',', '');
          const rowTime = moment(dta.name).format(timeFormat);
          exportData.push([
            `"${this.controller.Name}"`,
            `"${t.moduleName}"`,
            `"${d.sensorName}"`,
            `${rowDte} ${rowTime}`,
            dta.value,
            dta.min,
            dta.max,
          ]);
        }
      }
    }

    this.export('JournalData.csv', exportData.join('\r\n'));
  }

  exportDeviceData(): void {
    const term = this.currentSearch;
    this.journalDataService
      .getJournalDeviceData(this.controller.Guid, null, term.startDate, term.endDate)
      .subscribe((data) => {
        const resultController = data.Controllers[0];
        resultController.Modules.forEach((resultModule) => {
          var module = this.journalData.value.find((m) => m.id === resultModule.Id);
          if (!module) {
            return;
          }

          resultModule.Devices.forEach((resultDevice) => {
            var device = module.devices.find((s) => s.id === resultDevice.Id);
            if (!device) {
              return;
            }

            const deviceMode = this.allChartModes.find((cm) => cm.id === device.id);
            this.loadDeviceChartData(device, deviceMode, resultDevice);
          });
        });

        this.exportDeviceDataCSV();
      });
  }

  private exportDeviceDataCSV() {
    const timeFormat = TimeUtil.preferredTimeFormat(this.userPrefs.prefer24Hour, true);
    const dateTimeOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    };
    const exportData = [];
    const header = ['Device', 'On', 'Off', 'Throttle'];
    exportData.push(header);

    for (const module of this.journalData.value) {
      for (const device of module.devices) {
        const deviceData = this.getDeviceRows(device.trend.series);
        for (const row of deviceData) {
          const start = row.start;
          const startDte = start.toLocaleDateString('en-us', dateTimeOptions).replace(',', '');
          const startTime = moment(start).format(timeFormat);
          const end = row.end;
          const endDte = end.toLocaleDateString('en-us', dateTimeOptions).replace(',', '');
          const endTime = moment(end).format(timeFormat);
          exportData.push([
            device.deviceName,
            `${startDte} ${startTime}`,
            `${endDte} ${endTime}`,
            row.throttle,
          ]);
        }
      }
    }

    this.export('DeviceData.csv', exportData.join('\r\n'));
  }

  processJournalData(data: JournalData) {
    if (!data.Controllers || data.Controllers.length === 0) {
      this.journalData.next([]);
      return;
    }

    this.loadTrendControllerData(data);
  }

  updateSensorChart(e: MatButtonToggleChange, chart: JournalSensorData) {
    const newOption = parseInt(e.value, 10) as DayNightOption;

    if (chart.individual.currentMode !== newOption) {
      chart.individual.currentMode = newOption;
      console.log('new daynightoption', newOption);
      this.getSensorChart(chart, newOption);
    }
  }

  private addTrendSensorNode(node: JournalSensorData) {
    const currentChartData = this.trendSensorChartData.value;
    if (currentChartData.find((exist) => exist.id === node.id)) {
      return;
    }

    if (node.data.length) {
      currentChartData.push(node);
      this.trendSensorChartData.next(currentChartData);
    } else {
      const term = this.currentSearch;
      node.loading = true;

      this.journalDataService
        .getJournalSensorData(
          term.controllerId,
          node.id,
          term.startDate,
          term.endDate,
          term.isHourly
        )
        .subscribe((result) => {
          const resultSensor = result.Controllers[0].Modules[0].Sensors[0];
          currentChartData.push(node);

          this.loadSensorChartData(node, resultSensor);
        });
    }
  }
  private addTrendDeviceNode(node: JournalDeviceData) {
    const currentChartData = this.trendDeviceChartData.value;
    const currentChartModes = this.trendDeviceChartModes.value;
    if (currentChartData.find((exist) => exist.id === node.id)) {
      return;
    }

    const modeNode = this.allChartModes.find((nm) => nm.id === node.id);
    if (node.data.length) {
      currentChartData.push(node);
      if (modeNode) {
        currentChartModes.push(modeNode);
      }
      this.trendDeviceChartData.next(currentChartData);
      this.trendDeviceChartModes.next(currentChartModes);
    } else {
      const term = this.currentSearch;
      node.loading = true;

      this.journalDataService
        .getJournalDeviceData(term.controllerId, node.id, term.startDate, term.endDate)
        .subscribe((result) => {
          const resultDevice = result.Controllers[0].Modules[0].Devices[0];
          currentChartData.push(node);
          if (modeNode) {
            currentChartModes.push(modeNode);
          }

          this.loadDeviceChartData(node, modeNode, resultDevice);
        });
    }
  }
  private removeTrendSensorNode(node: JournalSensorData) {
    const currentChartData = this.trendSensorChartData.value.filter(
      (exist) => exist.id !== node.id
    );

    this.trendSensorChartData.next(currentChartData);
  }
  private removeTrendDeviceNode(node: JournalDeviceData) {
    const currentChartData = this.trendDeviceChartData.value.filter(
      (exist) => exist.id !== node.id
    );
    const currentChartModes = this.trendDeviceChartModes.value.filter(
      (exist) => exist.id !== node.id
    );

    this.trendDeviceChartData.next(currentChartData);
    this.trendDeviceChartModes.next(currentChartModes);
  }

  trendNodesChanged(e: MatSelectChange) {
    const selected = e.value as JournalNodeData[];
    const selectedSensors = selected.filter(
      (node) => node instanceof JournalSensorData
    ) as JournalSensorData[];
    const selectedDevices = selected.filter(
      (node) => node instanceof JournalDeviceData
    ) as JournalDeviceData[];
    const currentSensors = [...this.trendSensorChartData.value];
    const currentDevices = [...this.trendDeviceChartData.value];

    selectedSensors.forEach((node) => {
      this.addTrendSensorNode(node as JournalSensorData);
      node.selected = true;
    });
    selectedDevices.forEach((node) => {
      this.addTrendDeviceNode(node as JournalDeviceData);
      node.selected = true;
    });

    currentSensors.forEach((exist) => {
      if (!selectedSensors.some((sel) => sel.id === exist.id)) {
        this.removeTrendSensorNode(exist);
        exist.selected = false;
      }
    });

    currentDevices.forEach((exist) => {
      if (!selectedDevices.some((sel) => sel.id === exist.id)) {
        this.removeTrendDeviceNode(exist);
        exist.selected = false;
      }
    });
  }

  sensorNodesChanged(e: MatSelectChange) {
    const selected = e.value as JournalSensorData[];
    selected.forEach((node) => {
      if (node.module.selectedSensors.some((exist) => exist.id === node.id)) {
        return;
      }

      node.module.selectedSensors.push(node);

      if (node.data.length) {
        return;
      }

      this.getSensorChart(node, DayNightOption.TwentyFourHours);
    });

    this.journalData.value.forEach((module) => {
      module.selectedSensors = module.selectedSensors.filter((exist) =>
        selected.some((sel) => sel.id === exist.id)
      );
    });
  }

  private getSensorChart(node: JournalSensorData, dayNightOption: DayNightOption) {
    const term = this.currentSearch;
    node.loading = true;

    this.journalDataService
      .getJournalSensorData(
        term.controllerId,
        node.id,
        term.startDate,
        term.endDate,
        term.isHourly,
        dayNightOption
      )
      .subscribe((result) => {
        if (
          result &&
          result.Controllers &&
          result.Controllers.length &&
          result.Controllers[0].Modules.length &&
          result.Controllers[0].Modules[0].Sensors.length
        ) {
          node.data = result.Controllers[0].Modules[0].Sensors[0].DataPoints;
        }
        node.loading = false;
      });
  }

  trendUpdated() {
    const currentSensorData = this.trendSensorChartData.value;
    const currentChartData = this.trendDeviceChartData.value;
    const currentChartModes = this.trendDeviceChartModes.value;

    currentSensorData.forEach(node => {
      node.color = this.trend.getSensorColor(node.sensorName);
    });

    currentChartData.forEach(node => {
      node.color = this.trend.getDeviceColor(node.deviceName);
      const modeNode = currentChartModes.find((nm) => nm.id === node.id);
      if (modeNode) {
        modeNode.color = node.color;
        modeNode.selected = true;
      }
    });
  }

  private loadTrendControllerData(data: JournalData): void {
    const newJournalData: JournalModuleData[] = [];
    const existSensorChartData = this.trendSensorChartData.value;
    const existDeviceChartData = this.trendDeviceChartData.value;
    const existDeviceChartModes = this.trendDeviceChartModes.value;
    const term = this.currentSearch;

    for (const controller of data.Controllers) {
      for (const module of controller.Modules.filter(
        (m) => m.Sensors.length + m.Devices.length > 0
      )) {
        const moduleData = new JournalModuleData();
        moduleData.id = module.Id;
        moduleData.moduleName = module.Name;

        for (const sensor of module.Sensors) {
          const sensorData = new JournalSensorData();
          const sensorConfig = this.findSensorConfig(sensor.Id);
          sensorData.id = sensor.Id;
          sensorData.metric = sensorConfig ? sensorConfig.MetricName : '';
          sensorData.sensorName = sensor.Name;
          sensorData.module = moduleData;
          sensorData.suffix = sensor.Suffix;
          sensorData.sensorType = sensorConfig ? sensorConfig.DataPointMetric : DataPointMetric.None;

          const existSeries = existSensorChartData.find(
            (node) => node.id === sensor.Id
          ) as JournalSensorData;
          if (existSeries) {
            sensorData.data = existSeries.data;
            sensorData.selected = true;
            sensorData.loading = true;
            sensorData.color = existSeries.color;
            this.journalDataService
              .getJournalSensorData(
                controller.Id,
                sensor.Id,
                term.startDate,
                term.endDate,
                term.isHourly
              )
              .subscribe((result) => {
                const resultSensor = result.Controllers[0].Modules[0].Sensors[0];

                this.loadSensorChartData(sensorData, resultSensor);
              });
          }

          moduleData.sensors.push(sensorData);
        }

        for (const device of module.Devices) {
          const deviceData = new JournalDeviceData();
          const deviceMode = new JournalDeviceModeData();
          deviceData.id = device.Id;
          deviceData.deviceName = device.Name;
          deviceMode.id = device.Id;
          deviceMode.deviceName = device.Name;

          const existSeries = existDeviceChartData.find(
            (node) => node.id === device.Id
          ) as JournalDeviceData;
          if (existSeries) {
            deviceData.data = existSeries.data;
            deviceData.selected = true;
            deviceData.color = existSeries.color;

            const existModeSeries = existDeviceChartModes.find((node) => node.id === device.Id);
            if (existModeSeries) {
              deviceMode.data = existModeSeries.data;
              deviceMode.selected = true;
              deviceMode.color = existModeSeries.color;
            }

            this.journalDataService
              .getJournalDeviceData(controller.Id, device.Id, term.startDate, term.endDate)
              .subscribe((result) => {
                const resultDevice = result.Controllers[0].Modules[0].Devices[0];

                this.loadDeviceChartData(deviceData, deviceMode, resultDevice);
              });
          }

          moduleData.devices.push(deviceData);
          moduleData.deviceModes.push(deviceMode);
        }
        moduleData.sensors.sort((a, b) => a.sensorName.localeCompare(b.sensorName));
        moduleData.devices.sort((a, b) => a.deviceName.localeCompare(b.deviceName));
        moduleData.deviceModes.sort((a, b) => a.deviceName.localeCompare(b.deviceName));
        newJournalData.push(moduleData);
      }

      newJournalData.sort((a, b) => a.moduleName.localeCompare(b.moduleName));
    }

    this.journalData.next(newJournalData);
  }

  findSensorConfig(sensorId: string): SensorResponse {
    for (const module of this.controller.Modules) {
      const sensor = module.Sensors.find(s => s.Guid === sensorId);

      if (sensor) { return sensor; }
    }

    return null;
  }

  private loadSensorChartData(target: JournalSensorData, result: JournalSensor) {
    const current = this.trendSensorChartData.value;
    const existChartIdx = current.findIndex((s) => s.id === target.id);

    target.data = result.DataPoints;
    target.loading = false;
    if (existChartIdx > -1) {
      current.splice(existChartIdx, 1, target);
      this.trendSensorChartData.next(current);
    }
  }

  private loadDeviceChartData(
    target: JournalDeviceData,
    targetMode: JournalDeviceModeData,
    result: JournalDevice
  ) {
    const now = new Date();
    const current = this.trendDeviceChartData.value;
    const currentModes = this.trendDeviceChartModes.value;
    const existChartIdx = current.findIndex((s) => s.id === target.id);
    const existModeIdx = currentModes.findIndex((s) => s.id === target.id);

    target.data = result.DeviceStates;
    targetMode.data = result.DeviceStates;
    target.loading = false;

    const first = target.trend.series[0];
    const last = target.trend.series[target.trend.series.length - 1];
    if (first.name > this.startDate.value) {
      target.trend.series.unshift({
        name: this.startDate.value,
        value: first.value,
        auto: first.auto,
      });
    }
    if (last.name < this.endDate.value) {
      target.trend.series.push({
        name: this.endDate.value > now ? now : this.endDate.value,
        value: last.value,
        auto: last.auto,
      });
    }

    if (existChartIdx > -1) {
      current.splice(existChartIdx, 1, target);
      currentModes.splice(existModeIdx, 1, targetMode);

      this.trendDeviceChartData.next(current);
      this.trendDeviceChartModes.next(currentModes);
    }
  }

  private getDeviceRows(
    data: TrendChartDeviceDataPoint[]
  ): { start: Date; end: Date; throttle: number }[] {
    const first = data[0];
    const now = new Date();
    let currentState = first.value > 0;
    let currentThrottle = first.value;

    const result: { start: Date; end: Date; throttle: number }[] = [];
    if (currentState) {
      result.push({ start: this.startDate.value, end: null, throttle: currentThrottle });
    }
    for (let index = 0; index < data.length; index++) {
      const dp = data[index];
      const isActive = dp.value > 0;
      if (isActive !== currentState) {
        if (isActive) {
          result.push({ start: dp.name, end: null, throttle: dp.value });
        } else {
          result[result.length - 1].end = dp.name;
        }
      } else if (dp.value !== currentThrottle) {
        result[result.length - 1].end = dp.name;
        result.push({ start: dp.name, end: null, throttle: dp.value });
      }

      currentState = isActive;
      currentThrottle = dp.value;
    }
    if (currentState) {
      result[result.length - 1].end = this.endDate.value > now ? now : this.endDate.value;
    }

    return result;
  }

  private updateController(controller: Controller): void {
    this.progressBarService.SetCurrentPage([
      {
        icon: 'business',
        caption: controller.Name,
        url: ['controller', controller.Guid, 'dashboard'],
      },
      { icon: 'assessment', caption: 'Journal' },
    ]);

    this.resetData();

    if (!controller || !controller.Guid) {
      this.showSearch = true;
      return;
    }

    this.controller = controller;
    if (this.selectedSensorId) {
      this.search();
    }
  }
}

class JournalSearchTerm {
  controllerId: string;
  startDate: Date;
  endDate: Date;
  isHourly: boolean;
  dayNightOption: DayNightOption;
}

class IndividualChartDataModel {
  selected = false;
  fullData: IndividualChartSeries[];
  chartData = new BehaviorSubject<IndividualChartSeries[]>([]);
  currentMode: DayNightOption;
}

interface IndividualChartSeries {
  name: string;
  series: IndividualChartDataPoint[];
}

class IndividualChartDataPoint {
  name: Date;
  value: number;
  timeOfDay: number;
  min: number;
  max: number;
}


class JournalModuleData {
  id: string;
  moduleName: string;
  sensors: JournalSensorData[] = [];
  devices: JournalDeviceData[] = [];
  deviceModes: JournalDeviceModeData[] = [];
  selectedSensors: JournalSensorData[] = [];

  containsSensor(id: string): boolean {
    return this.sensors.find((s) => s.id === id) !== undefined;
  }
}

interface JournalNodeData {
  id: string;
  color: string;
  selected: boolean;
  loading: boolean;
  data: string[];
  trend: TrendChartSensorSeries | TrendChartDeviceSeries | TrendChartDeviceModeSeries;
}

class JournalSensorData implements JournalNodeData {
  private _rawData: string[] = [];
  id: string;
  color: string;
  selected = false;
  loading = false;
  sensorName: string;
  suffix: string;
  sensorType: DataPointMetric;
  metric: string;
  module: JournalModuleData;

  get data(): string[] {
    return this._rawData;
  }
  set data(newData: string[]) {
    this._rawData = newData;

    this.processRawData();
  }
  trend: TrendChartSensorSeries;
  individual: IndividualChartDataModel;

  get individualSelected(): boolean {
    return this.individual ? this.individual.selected : false;
  }
  set individualSelected(value: boolean) {
    if (!this.individual) {
      return;
    }

    this.individual.selected = value;
  }

  get individualChart() {
    if (!this.individual || !this.individual.chartData) {
      return new BehaviorSubject<IndividualChartSeries[]>([]);
    }

    return this.individual.chartData;
  }

  private processRawData() {
    const option = this.individual ? this.individual.currentMode : DayNightOption.TwentyFourHours;
    this.individual = new IndividualChartDataModel();
    const sensorName = `${this.sensorName} ${this.suffix} Avg(Range)`;
    this.individual.currentMode = option;
    this.individual.fullData = [{ name: sensorName, series: [] }];

    const statistics = this._rawData
      .map<JournalSensorStatistics>((dataStr) => {
        const tokens = dataStr.split(',');
        switch (tokens.length) {
          case 11: {
            const tstamp = parseInt(tokens[0], 10);
            const timeOfDay = parseInt(tokens[1], 10);
            const min = safeParseFloat(tokens[2]);
            const avg = safeParseFloat(tokens[3]);
            const max = safeParseFloat(tokens[4]);

            return {
              DateTime: tstamp,
              TimeOfDay: timeOfDay,
              Min: min,
              Max: max,
              Avg: avg,
            };
          }
          case 5: {
            const tstamp = parseInt(tokens[0], 10);
            const timeOfDay = parseInt(tokens[1], 10);
            const min = safeParseFloat(tokens[2]);
            const avg = safeParseFloat(tokens[3]);
            const max = safeParseFloat(tokens[4]);

            return {
              DateTime: tstamp,
              TimeOfDay: timeOfDay,
              Min: min,
              Max: max,
              Avg: avg,
            };
          }
          default:
            return null;
        }
      })
      .filter((stat) => stat !== null);

    statistics
      .sort((a, b) => a.DateTime - b.DateTime)
      .forEach((s) => {
        const cDate = TimeUtil.localTimestamp(s.DateTime);

        this.individual.fullData[0].series.push({
          name: cDate,
          value: s.Avg,
          min: s.Min,
          max: s.Max,
          timeOfDay: s.TimeOfDay,
        });
      });
    this.individual.chartData.next(this.individual.fullData);

    this.trend = {
      name: this.sensorName,
      metric: this.metric,
      unitOfMeasure: this.suffix && this.suffix.trim(),
      sensorType: this.sensorType,
      series: statistics
        .sort((a, b) => a.DateTime - b.DateTime)
        .map((stat) => ({ name: TimeUtil.localTimestamp(stat.DateTime), value: stat.Avg, timeOfDay: stat.TimeOfDay })),
    };
  }
}

class JournalDeviceData implements JournalNodeData {
  private _rawData: string[] = [];
  id: string;
  color: string;
  selected = false;
  loading = false;
  deviceName: string;
  get data(): string[] {
    return this._rawData;
  }
  set data(newData: string[]) {
    this._rawData = newData;

    this.processRawData();
  }
  trend: TrendChartDeviceSeries;

  private processRawData() {
    const stateChanges = this._rawData
      .map<JournalDeviceStateChange>((dataStr) => {
        const tokens = dataStr.split(',');
        if (tokens.length !== 4) {
          return null;
        }
        const tstamp = parseInt(tokens[0], 10);
        const isActive = parseInt(tokens[1], 10);
        const isManual = parseInt(tokens[2], 10);
        const throttle = safeParseFloat(tokens[3]);

        return {
          DateTime: tstamp,
          IsActive: isActive === 1,
          IsManual: isManual === 1,
          Throttle: throttle,
        };
      })
      .filter((state) => state !== null);

    this.trend = {
      name: this.deviceName,
      series: stateChanges
        .sort((a, b) => a.DateTime - b.DateTime)
        .map((state) => ({
          name: TimeUtil.localTimestamp(state.DateTime),
          value: state.Throttle !== null ? state.Throttle : state.IsActive ? 100 : 0,
          auto: !state.IsManual,
        })),
    };
  }
}
class JournalDeviceModeData implements JournalNodeData {
  private _rawData: string[] = [];
  id: string;
  color: string;
  selected = false;
  loading = false;
  deviceName: string;
  get data(): string[] {
    return this._rawData;
  }
  set data(newData: string[]) {
    this._rawData = newData;

    this.processRawData();
  }
  trend: TrendChartDeviceModeSeries;

  private processRawData() {
    const stateChanges = this._rawData
      .map<JournalDeviceStateChange>((dataStr) => {
        const tokens = dataStr.split(',');
        if (tokens.length !== 4) {
          return null;
        }
        const tstamp = parseInt(tokens[0], 10);
        const isActive = parseInt(tokens[1], 10);
        const isManual = parseInt(tokens[2], 10);
        const throttle = safeParseFloat(tokens[3]);

        return {
          DateTime: tstamp,
          IsActive: isActive === 1,
          IsManual: isManual === 1,
          Throttle: throttle,
        };
      })
      .filter((state) => state !== null);

    let currentMode = stateChanges[0].IsManual;
    this.trend = {
      name: this.deviceName,
      series: stateChanges
        .sort((a, b) => a.DateTime - b.DateTime)
        .reduce((result, state) => {
          const cDate = TimeUtil.localTimestamp(state.DateTime);
          if (currentMode !== state.IsManual) {
            result.push({
              name: cDate,
              value: !state.IsManual ? 1 : 0,
              auto: !state.IsManual,
              x: cDate,
              y: state.Throttle !== null ? state.Throttle : state.IsActive ? 100 : 0,
              r: !state.IsManual ? 50 : 100,
            });

            currentMode = state.IsManual;
          }

          return result;
        }, new Array<TrendChartDeviceModePoint>()),
    };
  }
}

function safeParseFloat(str: string): number {
  if (str.length < 1 || str === 'null') {
    return null;
  }

  return parseFloat(str);
}
