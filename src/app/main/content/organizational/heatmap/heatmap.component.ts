import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSliderChange } from '@angular/material/slider';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable, Subject, of } from 'rxjs';
import { distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import {
  ControllerService,
  ProgressBarService,
  HeatmapService,
  AuthenticationService,
  JournalDataService,
  UserPreferencesService,
} from '@services';
import { HistoricHeatmapData, SelectItem, UserPrefs } from '@models';
import { TimeUtil } from '@util';
import { HeatmapBaseComponent } from './heatmap-base.component';
import * as moment from 'moment';
import 'moment-timezone';

@Component({
  selector: 'fuse-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss'],
})
export class HeatmapComponent extends HeatmapBaseComponent implements OnInit, OnDestroy {
  searchRanges: SelectItem[] = [];
  minTimestamp = 0;
  maxTimestamp = 100;
  stepTimestamp = 1;
  sliderValue = 0;
  useTimezone = '';
  playHistory = false;
  playTimer: number = null;

  searchForm: FormGroup;
  private searchTerms = new Subject<number>();
  private userPrefs: UserPrefs;
  historicData: Observable<HistoricHeatmapData>;
  currentData: HistoricHeatmapData;
  currentTimestamp: string = null;

  constructor(
    route: ActivatedRoute,
    controllers: ControllerService,
    progressBarService: ProgressBarService,
    heatmaps: HeatmapService,
    auth: AuthenticationService,
    snackbar: MatSnackBar,
    private userPrefService: UserPreferencesService,
    private journalDataService: JournalDataService
  ) {
    super(route, controllers, heatmaps, auth, progressBarService, snackbar);
    this.searchRanges = [
      {
        caption: 'Real-time',
        value: 1,
      },
      {
        caption: 'Last 24 hours',
        value: 2,
      },
      {
        caption: 'Last 7 days',
        value: 3,
      },
    ];
  }

  ngOnInit() {
    super.ngOnInit();

    this.route.paramMap.subscribe(params => {
      const editId = params.has('id') ? params.get('id') : null;
      this.heatmaps.getHeatmap(editId).subscribe(
        heatmap => {
          this.config = heatmap;
          this.progressBarService.SetCurrentPage([
            { icon: 'insert_chart', caption: 'Heat Maps', url: ['org', 'heatmaps'] },
            { icon: 'settings', caption: this.config.Name },
          ]);

          window.setTimeout(() => {
            this.loadHeatmap();

            const selected = this.config.Groups.length ? this.config.Groups[0].Id : null;
            this.selectedGroup.setValue(selected, {emitEvent: false});
          });
        },
        error => this.handleError(error)
      );
    });

    this.searchForm = new FormGroup({
      range: new FormControl('', [Validators.required]),
      selectedGroup: new FormControl('', [Validators.required]),
    });

    this.historicData = this.searchTerms.pipe(
      distinctUntilChanged(),
      switchMap(term =>
        term > 1
          ? this.journalDataService.getHistoricHeatmapData(this.config.Id, term)
          : of(new HistoricHeatmapData())
      ),
      catchError(() => of(new HistoricHeatmapData()))
    );

    this.subs.add(this.userPrefService.userPrefs.subscribe(prefs => this.userPrefs = prefs));

    this.subs.add(
      this.historicData.subscribe(data => {
        if (!data || !data.Sensors || !data.Devices) {
          return;
        }

        this.currentData = data;
        const timeSpan = this.range.value === 2 ? 1440 : 1440 * 7;
        const dataInterval = this.range.value === 2 ? 10 : 60;
        const timezones = this.currentData.Sensors.reduce((all, sens) => {
          const sensor = this.sensorList.find(s => s.Guid === sens.SensorId);
          if (!sensor) {
            return all;
          }
          const tz = sensor.Controller.TimeZoneId;
          if (!all.find(exist => exist === tz)) {
            all.push(tz);
          }

          return all;
        }, new Array<string>());

        this.useTimezone = timezones.length ? timezones[0] : null;

        this.minTimestamp = moment.tz(this.useTimezone)
          .subtract(timeSpan, 'minutes')
          .toDate()
          .getTime();
        this.maxTimestamp = moment.tz(this.useTimezone)
          .toDate()
          .getTime();
        this.stepTimestamp = dataInterval * 60000;

        this.sliderValue = this.minTimestamp;
        this.populateData(this.sliderValue);
      })
    );

    this.subs.add(
      this.range.valueChanges.subscribe(newRange => {
        this.allSensors.forEach(sens => sens.currentValue = null);
        this.allDevices.forEach(dev => dev.currentState = dev.throttle = dev.autoManual = null);

        if (newRange === 1) {
          this.realTime = true;
          this.minTimestamp = 0;
          this.updateReadings();
        } else {
          this.realTime = false;
        }
        this.searchTerms.next(newRange);
        this.drawHeatmap();
      })
    );

    this.subs.add(
      this.selectedGroup.valueChanges.subscribe(newGroupId => {
        const newGroup = this.config.Groups.find(grp => grp.Id === newGroupId);
        if (newGroup) {
          this.markGroupActive(true, newGroup);
        }
      })
    );

    this.range.setValue(1);
  }

  ngOnDestroy() {
    super.ngOnDestroy();

    if (this.playTimer) {
      window.clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  get range() {
    return this.searchForm.get('range');
  }
  get selectedGroup() {
    return this.searchForm.get('selectedGroup');
  }

  onUserChange(newTimestamp: MatSliderChange): void {
    this.sliderValue = newTimestamp.value;
    this.populateData(newTimestamp.value);
  }

  populateData(timeStamp: number) {
    if (!this.config || this.realTime) {
      return;
    }

    const timeFormat = TimeUtil.preferredTimeFormat(this.userPrefs.prefer24Hour, false);
    let findDate = moment.tz(new Date(timeStamp), this.useTimezone);
    this.currentTimestamp = findDate.format(`ll ${timeFormat}`);
    const hours24 = this.range.value === 2;
    if (hours24) {
      findDate = moment(findDate).utc();
    }

    this.allSensors.forEach(sens => {
      const sensor = this.currentData.Sensors.find(
        sensorData => sensorData.SensorId === sens.SensorId
      );
      if (sensor) {
        const exactReading = sensor.SensorReadings
          .find(r => (hours24 ? moment.utc(r.DateTime) : moment.tz(r.DateTime, this.useTimezone)).isSame(findDate, 'minutes'));
        let readingIdx = sensor.SensorReadings
          .findIndex(r => (hours24 ? moment.utc(r.DateTime) : moment.tz(r.DateTime, this.useTimezone)).isAfter(findDate));
        if (readingIdx === -1) {
          readingIdx = sensor.SensorReadings.length - 1;
        } else if (readingIdx > 0) {
          readingIdx--;
        }
        const reading = exactReading ? exactReading : sensor.SensorReadings[readingIdx];
        sens.currentValue = reading ? Math.round(reading.Value * 100.0) / 100.0 : null;
        sens.suffix = sensor.Suffix;
      }
    });
    this.allDevices.forEach(dev => {
      const device = this.currentData.Devices.find(
        deviceData => deviceData.DeviceId === dev.DeviceId
      );
      if (device) {
        const exactState = device.StateChanges.find(r => moment.utc(r.DateTime).isSame(findDate, 'minutes'));
        let stateIdx = device.StateChanges.findIndex(r => moment.utc(r.DateTime).isAfter(findDate));
        if (stateIdx === -1) {
          stateIdx = device.StateChanges.length - 1;
        } else if (stateIdx > 0) {
          stateIdx--;
        }
        const state = exactState ? exactState : device.StateChanges[stateIdx];
        dev.currentState = state ? state.IsActive : null;
        dev.autoManual = state ? state.IsManual : null;
        dev.throttle = state ? state.Throttle : null;
        dev.DeviceType = device.DeviceType;
      }
    });

    this.updateSensorDetails();
    this.updateDeviceDetails();
    this.drawHeatmap();
  }

  toggleHistoryPlayback() {
    this.playHistory = !this.playHistory;
    if (this.playHistory) {
      this.playTimer = window.setInterval(() => {
        this.sliderValue += this.stepTimestamp;
        if (this.sliderValue > this.maxTimestamp) {
          this.sliderValue = this.minTimestamp;
        }
        this.populateData(this.sliderValue);
      }, 500);
    } else {
      if (this.playTimer) {
        window.clearInterval(this.playTimer);
        this.playTimer = null;
      }
    }
  }

  protected updateSensorsValues() {
    if (this.range.value === 1) {
      super.updateSensorsValues();
    }
  }
  protected updateDevicesValues() {
    if (this.range.value === 1) {
      super.updateDevicesValues();
    }
  }
}
