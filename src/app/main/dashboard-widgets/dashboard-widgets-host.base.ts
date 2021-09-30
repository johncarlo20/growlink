import { OnInit, OnDestroy, Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import {
  UserPrefs,
  SensorRealTimeModel,
  ChartDataPointResponse,
  DeviceModel,
  FormattedSensorReadingsResponse,
  ParticleSensor,
  ParticleDeviceStateResponse,
  ParticleDevice,
  ParticleDeviceState,
  Controller,
  OrgDashboardReading,
  OrgDashboardState,
} from '@models';
import {
  ControllerService,
  ParticleSensorsService,
  UserPreferencesService,
  OFFLINE_THRESHOLD,
} from '@services';
import { TimeUtil } from '@util';
import * as moment from 'moment';

@Component({template: ''})
export abstract class DashboardWidgetsHost implements OnInit, OnDestroy {
  public chartsLoading = true;

  protected subs = new Subscription();

  protected chartSubscription: Subscription;
  protected prefs: UserPrefs;
  protected snackbarRef: MatSnackBarRef<SimpleSnackBar> = null;

  protected errorOptions: MatSnackBarConfig = {
    duration: 10000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
    panelClass: 'snack-panel-error',
  };

  private _anyAlerts = false;

  public get anyAlerts() {
    return this._anyAlerts;
  }
  public set anyAlerts(value: boolean) {
    if (value !== this._anyAlerts) {
      this._anyAlerts = value;
      this.setBreadcrumbs();
    }
  }

  constructor(
    protected controllerService: ControllerService,
    protected particleSensorService: ParticleSensorsService,
    protected userPrefsService: UserPreferencesService,
    public snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.userPrefsService.userPrefs.subscribe((usrPrefs) => {
        this.prefs = usrPrefs;
        this.loadAllData();
      })
    );
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
    if (this.chartSubscription) {
      this.chartSubscription.unsubscribe();
    }
  }

  protected getFormattedSensorReading(
    readings: FormattedSensorReadingsResponse,
    sensor: ParticleSensor
  ): string {
    switch (sensor) {
      case ParticleSensor.AmbientTemperature:
        return readings.at;
      case ParticleSensor.AmbientTemperature2:
        return readings.at2;
      case ParticleSensor.AmbientHumidity:
        return readings.ah;
      case ParticleSensor.AmbientCo2:
        return readings.c;
      case ParticleSensor.SolutionTemperature:
        return readings.st;
      case ParticleSensor.SolutionPh:
        return readings.p;
      case ParticleSensor.SolutionPh2:
        return readings.p2;
      case ParticleSensor.SolutionTds:
        return readings.t;
      case ParticleSensor.SolutionFloat:
        return readings.f;
      case ParticleSensor.LightLevel:
        return readings.ll;
      case ParticleSensor.BatteryLevel:
        return readings.bl;
      case ParticleSensor.SoilMoisture:
        return readings.slm;
      case ParticleSensor.SoilSalinity:
        return readings.sls;
      case ParticleSensor.SoilTemperature:
        return readings.slt;
      case ParticleSensor.Switch1:
        return readings.sw1;
      case ParticleSensor.Switch2:
        return readings.sw2;
      case ParticleSensor.Switch3:
        return readings.sw3;
      case ParticleSensor.SoilMoisture1:
        return readings.sm1;
      case ParticleSensor.SoilMoisture2:
        return readings.sm2;
      case ParticleSensor.SoilMoisture3:
        return readings.sm3;
      case ParticleSensor.SoilMoisture4:
        return readings.sm4;
      case ParticleSensor.SoilMoisture5:
        return readings.sm5;
      case ParticleSensor.SoilMoistureSerial:
        return readings.sms;
      case ParticleSensor.SoilTemperature1:
        return readings.st1;
      case ParticleSensor.SoilTemperature2:
        return readings.st2;
      case ParticleSensor.SoilTemperature3:
        return readings.st3;
      case ParticleSensor.SoilTemperature4:
        return readings.st4;
      case ParticleSensor.SoilTemperatureSerial:
        return readings.sts;
      case ParticleSensor.SoilEc1:
        return readings.se1;
      case ParticleSensor.SoilEc2:
        return readings.se2;
      case ParticleSensor.SoilEc3:
        return readings.se3;
      case ParticleSensor.SoilEc4:
        return readings.se4;
      case ParticleSensor.SoilEcSerial:
        return readings.ses;
      case ParticleSensor.VaporPressureDeficit:
        return readings.vpd;
      case ParticleSensor.Gpio1:
        return readings.gp1;
      case ParticleSensor.Gpio2:
        return readings.gp2;
      case ParticleSensor.Gpio3:
        return readings.gp3;
      case ParticleSensor.Gpio4:
        return readings.gp4;
      case ParticleSensor.Gpio5:
        return readings.gp5;
      case ParticleSensor.Gpio6:
        return readings.gp6;
      case ParticleSensor.Gpio7:
        return readings.gp7;
      case ParticleSensor.Gpio8:
        return readings.gp8;
      case ParticleSensor.DissolvedOxygen:
        return readings.do;
      case ParticleSensor.FlowRate:
        return readings.fr;
      case ParticleSensor.OutsideTemperature:
        return readings.ot;
      case ParticleSensor.OutsideHumidity:
        return readings.oh;
      case ParticleSensor.OutsideVaporPressure:
        return readings.ov;
      case ParticleSensor.OutsideAtmosphericPressure:
        return readings.oa;
      case ParticleSensor.WindDirection:
        return readings.wd;
      case ParticleSensor.WindSpeed:
        return readings.ws;
      case ParticleSensor.PAR:
        return readings.pr;
      case ParticleSensor.Precipitation:
        return readings.pc;
      case ParticleSensor.AnalogInput1:
        return readings.a1;
      case ParticleSensor.AnalogInput2:
        return readings.a2;
      case ParticleSensor.AnalogInput3:
        return readings.a3;
      case ParticleSensor.AnalogInput4:
        return readings.a4;
      case ParticleSensor.AnalogInput5:
        return readings.a5;
      case ParticleSensor.AnalogInput6:
        return readings.a6;
      case ParticleSensor.AnalogInput7:
        return readings.a7;
      case ParticleSensor.AnalogInput8:
        return readings.a8;
      case ParticleSensor.CurrentLoopInput1:
        return readings.cl1;
      case ParticleSensor.CurrentLoopInput2:
        return readings.cl2;
      case ParticleSensor.CurrentLoopInput3:
        return readings.cl3;
      case ParticleSensor.CurrentLoopInput4:
        return readings.cl4;
      case ParticleSensor.CurrentLoopInput5:
        return readings.cl5;
      case ParticleSensor.BacnetInput1:
        return readings.b1;
      case ParticleSensor.BacnetInput2:
        return readings.b2;
      case ParticleSensor.BacnetInput3:
        return readings.b3;
      case ParticleSensor.BacnetInput4:
        return readings.b4;
      case ParticleSensor.BacnetInput5:
        return readings.b5;
      case ParticleSensor.BacnetInput6:
        return readings.b6;
      case ParticleSensor.BacnetInput7:
        return readings.b7;
      case ParticleSensor.BacnetInput8:
        return readings.b8;
      default:
        return null;
    }
  }

  protected createChartData(data: ChartDataPointResponse[], timeZone: string): void {
    const timeFormat = TimeUtil.preferredTimeFormat(this.prefs.prefer24Hour, false);
    const allDataIds = data.reduce((all, dataPoint) => {
      if (!all.find((exist) => exist === dataPoint.SensorId)) {
        all.push(dataPoint.SensorId);
      }

      return all;
    }, new Array<string>());

    allDataIds.forEach((sensorId) => {
      const sensor = this.allSensors.find((s) => s.deviceId === sensorId);
      if (!sensor) {
        return;
      }

      sensor.chartData = [{ name: sensor.name, series: [] }];
      sensor.chartMin.next(null);
      sensor.chartMax.next(null);
    });

    for (const dataPoint of data) {
      const sensor = this.allSensors.find((s) => s.deviceId === dataPoint.SensorId);
      if (!sensor) {
        continue;
      }

      const chartMoment = moment(dataPoint.Timestamp);
      const chartMomentTz = chartMoment.isValid() ? chartMoment.tz(timeZone) : null;
      const chartTime = chartMomentTz ? chartMomentTz.format(timeFormat) : '';
      const chartValue = dataPoint.Value.toFixed(1).endsWith('.0')
        ? dataPoint.Value.toFixed(0)
        : dataPoint.Value.toFixed(1);
      sensor.chartData[0].series.push({ name: chartTime, value: chartValue });
      if (dataPoint.Value < sensor.chartMin.value || sensor.chartMin.value === null) {
        sensor.chartMin.next(dataPoint.Value);
      }
      if (dataPoint.Value > sensor.chartMax.value || sensor.chartMax.value === null) {
        sensor.chartMax.next(dataPoint.Value);
      }
    }

    this.chartsLoading = false;
  }

  protected getDeviceTStamp(deviceStates: ParticleDeviceStateResponse): moment.Moment {
    if (!deviceStates) {
      return null;
    }

    return moment(deviceStates.ts);
  }
  protected getDeviceState(
    device: ParticleDevice,
    deviceStates: ParticleDeviceStateResponse
  ): string {
    if (!deviceStates) {
      return null;
    }

    switch (device) {
      case ParticleDevice.ReservoirChiller:
        return this.deviceStateToString(deviceStates.ch);
      case ParticleDevice.ReservoirPump:
        return this.deviceStateToString(deviceStates.p);
      case ParticleDevice.AuxA:
        return this.deviceStateToString(deviceStates.a);
      case ParticleDevice.AuxB:
        return this.deviceStateToString(deviceStates.b);
      case ParticleDevice.AuxC:
        return this.deviceStateToString(deviceStates.c);
      case ParticleDevice.AuxD:
        return this.deviceStateToString(deviceStates.d);
      case ParticleDevice.AuxE:
        return this.deviceStateToString(deviceStates.e);
      case ParticleDevice.AuxF:
        return this.deviceStateToString(deviceStates.f);
      case ParticleDevice.AuxG:
        return this.deviceStateToString(deviceStates.g);
      case ParticleDevice.AuxH:
        return this.deviceStateToString(deviceStates.h);
      case ParticleDevice.DosingPumpA:
        return this.deviceStateToString(deviceStates.pa);
      case ParticleDevice.DosingPumpB:
        return this.deviceStateToString(deviceStates.pb);
      case ParticleDevice.DosingPumpC:
        return this.deviceStateToString(deviceStates.pc);
      case ParticleDevice.Device1:
        return this.deviceStateToString(deviceStates.d1);
      case ParticleDevice.Device2:
        return this.deviceStateToString(deviceStates.d2);
      case ParticleDevice.Device3:
        return this.deviceStateToString(deviceStates.d3);
      case ParticleDevice.Device4:
        return this.deviceStateToString(deviceStates.d4);
      case ParticleDevice.Device5:
        return this.deviceStateToString(deviceStates.d5);
      case ParticleDevice.Device6:
        return this.deviceStateToString(deviceStates.d6);
      case ParticleDevice.Device7:
        return this.deviceStateToString(deviceStates.d7);
      case ParticleDevice.Device8:
        return this.deviceStateToString(deviceStates.d8);
      case ParticleDevice.Device9:
        return this.deviceStateToString(deviceStates.d9);
      case ParticleDevice.Device10:
        return this.deviceStateToString(deviceStates.d10);
      case ParticleDevice.Device11:
        return this.deviceStateToString(deviceStates.d11);
      case ParticleDevice.Device12:
        return this.deviceStateToString(deviceStates.d12);
      case ParticleDevice.Device13:
        return this.deviceStateToString(deviceStates.d13);
      case ParticleDevice.Device14:
        return this.deviceStateToString(deviceStates.d14);
      case ParticleDevice.Device15:
        return this.deviceStateToString(deviceStates.d15);
      case ParticleDevice.Device16:
        return this.deviceStateToString(deviceStates.d16);
      case ParticleDevice.Device17:
        return this.deviceStateToString(deviceStates.d17);
      case ParticleDevice.Device18:
        return this.deviceStateToString(deviceStates.d18);
      case ParticleDevice.Device19:
        return this.deviceStateToString(deviceStates.d19);
      case ParticleDevice.Device20:
        return this.deviceStateToString(deviceStates.d20);
      case ParticleDevice.Device21:
        return this.deviceStateToString(deviceStates.d21);
      case ParticleDevice.Device22:
        return this.deviceStateToString(deviceStates.d22);
      case ParticleDevice.Device23:
        return this.deviceStateToString(deviceStates.d23);
      case ParticleDevice.Device24:
        return this.deviceStateToString(deviceStates.d24);
      default:
        return '';
    }
  }
  protected getDeviceThrottle(
    device: ParticleDevice,
    deviceStates: ParticleDeviceStateResponse
  ): number {
    if (!deviceStates) {
      return null;
    }

    switch (device) {
      case ParticleDevice.AuxA:
        return deviceStates.at;
      case ParticleDevice.AuxB:
        return deviceStates.bt;
      case ParticleDevice.AuxC:
        return deviceStates.ct;
      case ParticleDevice.AuxD:
        return deviceStates.dt;
      case ParticleDevice.AuxE:
        return deviceStates.et;
      case ParticleDevice.AuxF:
        return deviceStates.ft;
      case ParticleDevice.AuxG:
        return deviceStates.gt;
      case ParticleDevice.AuxH:
        return deviceStates.ht;
      case ParticleDevice.DosingPumpA:
        return deviceStates.pat;
      case ParticleDevice.DosingPumpB:
        return deviceStates.pbt;
      case ParticleDevice.DosingPumpC:
        return deviceStates.pct;
      case ParticleDevice.Device1:
        return deviceStates.d1t;
      case ParticleDevice.Device2:
        return deviceStates.d2t;
      case ParticleDevice.Device3:
        return deviceStates.d3t;
      case ParticleDevice.Device4:
        return deviceStates.d4t;
      case ParticleDevice.Device5:
        return deviceStates.d5t;
      case ParticleDevice.Device6:
        return deviceStates.d6t;
      case ParticleDevice.Device7:
        return deviceStates.d7t;
      case ParticleDevice.Device8:
        return deviceStates.d8t;
      case ParticleDevice.Device9:
        return deviceStates.d9t;
      case ParticleDevice.Device10:
        return deviceStates.d10t;
      case ParticleDevice.Device11:
        return deviceStates.d11t;
      case ParticleDevice.Device12:
        return deviceStates.d12t;
      case ParticleDevice.Device13:
        return deviceStates.d13t;
      case ParticleDevice.Device14:
        return deviceStates.d14t;
      case ParticleDevice.Device15:
        return deviceStates.d15t;
      case ParticleDevice.Device16:
        return deviceStates.d16t;
      case ParticleDevice.Device17:
        return deviceStates.d17t;
      case ParticleDevice.Device18:
        return deviceStates.d18t;
      case ParticleDevice.Device19:
        return deviceStates.d19t;
      case ParticleDevice.Device20:
        return deviceStates.d20t;
      case ParticleDevice.Device21:
        return deviceStates.d21t;
      case ParticleDevice.Device22:
        return deviceStates.d22t;
      case ParticleDevice.Device23:
        return deviceStates.d23t;
      case ParticleDevice.Device24:
        return deviceStates.d24t;
      default:
        return 0;
    }
  }
  protected getDeviceValue(
    device: ParticleDevice,
    deviceStates: ParticleDeviceStateResponse
  ): string {
    if (!deviceStates) {
      return null;
    }

    switch (device) {
      case ParticleDevice.AuxA:
        return deviceStates.abv;
      case ParticleDevice.AuxB:
        return deviceStates.bbv;
      case ParticleDevice.AuxC:
        return deviceStates.cbv;
      case ParticleDevice.AuxD:
        return deviceStates.dbv;
      case ParticleDevice.AuxE:
        return deviceStates.ebv;
      case ParticleDevice.AuxF:
        return deviceStates.fbv;
      case ParticleDevice.AuxG:
        return deviceStates.gbv;
      case ParticleDevice.AuxH:
        return deviceStates.hbv;
      default:
        return '';
    }
  }
  private deviceStateToString(state: ParticleDeviceState): string {
    switch (state) {
      case ParticleDeviceState.AutoOff:
        return 'Auto-Off';
      case ParticleDeviceState.ManualOff:
        return 'Manual-Off';
      case ParticleDeviceState.AutoOn:
        return 'Auto-On';
      case ParticleDeviceState.ManualOn:
        return 'Manual-On';
      default:
        return '';
    }
  }

  protected handleSignalRErrors(err: any) {
    if (err instanceof Error) {
      if (
        err.message.toLowerCase() ===
        'connection was disconnected before invocation result was received.'
      ) {
        // console.log('trapped signalr connection error');
        return;
      }
    }

    this.handleErrors(err);
  }

  protected handleErrors(err: any) {
    if (!err) {
      return;
    }

    if (err instanceof HttpErrorResponse) {
      if (err.status === 404) {
        return;
      }

      if (!this.snackbarRef) {
        this.snackbarRef = this.snackbar.open(
          `API Error - ${err.error.Message}`,
          'Dismiss',
          this.errorOptions
        );
        this.snackbarRef.afterDismissed().subscribe(() => {
          this.snackbarRef = null;
        });
      }
      return;
    }
    if (err && err.message && err.message === 'The operation was canceled.') {
      return;
    }
    if (err && err instanceof Error && err.message === 'The controller could not be reached.') {
      return;
    }

    console.log(err);

    if (!this.snackbarRef) {
      this.snackbarRef = this.snackbar.open(`ERROR: ${err}`, 'Dismiss', this.errorOptions);
      this.snackbarRef.afterDismissed().subscribe(() => {
        this.snackbarRef = null;
      });
    }
  }

  protected abstract loadAllData(): void;
  protected abstract loadCharts(): void;
  protected abstract setBreadcrumbs(): void;

  public abstract get allSensors(): SensorRealTimeModel[];
  public abstract get allDevices(): DeviceModel[];

  protected getSensorSummaries(
    controllerGuids: string[],
    newMin: Map<string, number>,
    newMax: Map<string, number>
  ) {
    controllerGuids.forEach((guid) => {
      this.controllerService.getSensorSummaries(guid).subscribe(
        (results) => {
          results.forEach((summary) => {
            if (summary.MinValue >= summary.MaxValue) {
              return;
            }

            newMin.set(summary.SensorId, summary.MinValue);
            newMax.set(summary.SensorId, summary.MaxValue);
          });

          this.allSensors.forEach((sensor) => {
            sensor.rangeMin.next(newMin.get(sensor.deviceId));
            sensor.rangeMax.next(newMax.get(sensor.deviceId));
          });
        },
        (err) => {
          this.handleErrors(err);
        }
      );
    });
  }

  protected updateSensorFormattedReadings(
    sensor: SensorRealTimeModel,
    reading: OrgDashboardReading | FormattedSensorReadingsResponse,
    controller: Controller
  ) {
    if (!reading || !sensor) {
      return;
    }

    if (!sensor.connected.value) {
      sensor.connected.next(true);
    }
    sensor.tstamp =
      reading instanceof FormattedSensorReadingsResponse
        ? moment(reading.ts)
        : reading.Timestamp !== undefined
        ? moment.utc(reading.Timestamp)
        : moment(0);
    sensor.tzId = moment(sensor.tstamp).tz(controller.TimeZoneId).format('Z');
    sensor.tzAbbr = TimeUtil.getTimezoneAbbr(controller.TimeZoneId);

    let formattedValue = '--';
    if (reading instanceof FormattedSensorReadingsResponse) {
      if (reading.ssn?.length && reading.ssn !== sensor.serialNumber) { return; }
      formattedValue =
        sensor.age !== -1
          ? this.getFormattedSensorReading(reading, sensor.particleSensor.Id)
          : '--';
    } else {
      formattedValue =
        reading.Value !== undefined && reading.Value !== null
          ? `${reading.Value}${reading.Suffix ? reading.Suffix : ''}`
          : '--';
      if (sensor.particleSensor.IsBinary) {
        const lowFull = this.particleSensorService.LowFullSensor(sensor.particleSensor);
        if (formattedValue === '1') {
          if (lowFull) {
            formattedValue = 'FULL';
          } else {
            formattedValue = 'ON';
          }
        } else {
          if (lowFull) {
            formattedValue = 'LOW';
          } else {
            formattedValue = 'OFF';
          }
        }
      }
    }
    sensor.value.next(formattedValue);

    if (sensor.particleSensor.IsBinary) {
      switch (formattedValue) {
        case 'ON':
        case 'FULL':
          sensor.numericValue.next(100);
          sensor.floatValue.next(1);
          break;
        default:
          sensor.numericValue.next(0);
          sensor.floatValue.next(0);
          break;
      }
      sensor.updateActiveAlerts(sensor.numericValue.value);
      return;
    }

    const euValue = parseFloat(formattedValue);
    sensor.floatValue.next(euValue);
    const euMin = sensor.euMin;
    const euMax = sensor.euMax;
    const euRange = euMax - euMin;
    const numValue = (euValue - euMin) / euRange;
    sensor.numericValue.next(numValue * 100.0);

    sensor.updateActiveAlerts(euValue);
  }

  protected updateDeviceState(
    device: DeviceModel,
    state: OrgDashboardState | ParticleDeviceStateResponse
  ) {
    if (!state || !device) {
      return;
    }

    const productType = device.productType && device.productType.Id;

    const deviceTStamp =
      state instanceof ParticleDeviceStateResponse
        ? this.getDeviceTStamp(state)
        : state.State !== undefined
        ? moment()
        : moment(0);
    const deviceState =
      state instanceof ParticleDeviceStateResponse
        ? this.getDeviceState(device.particleDevice, state)
        : `${state.IsManual ? 'Manual' : 'Auto'}-${state.State ? 'On' : 'Off'}`;
    const deviceThrottle =
      state instanceof ParticleDeviceStateResponse
        ? this.getDeviceThrottle(device.particleDevice, state)
        : state.Throttle;
    const deviceValue =
      state instanceof ParticleDeviceStateResponse && (productType === 62 || productType === 74)
        ? this.getDeviceValue(device.particleDevice, state)
        : undefined;

    device.state.next(deviceState);
    device.tstamp = deviceTStamp;
    device.throttle = deviceThrottle;
    device.value = deviceValue;

    if (device._ignoreUpdates > 0) {
      device._ignoreUpdates--;
    }
  }
}
