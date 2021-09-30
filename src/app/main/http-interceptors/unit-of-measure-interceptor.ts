import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserPreferencesService } from '@services';

@Injectable()
export class UnitOfMeasureInterceptor implements HttpInterceptor {
  private paths: Array<string> = [
    'containers',
    'FormattedDataPoints/',
    'Sensors/',
    'DeviceSensorTriggers/',
    'DeviceSchedules/',
    'DeviceTimers/',
    'SensorAlerts/',
    'ManualTasks/',
    'SensorReadingSummaries',
    'FormattedDeviceStates',
    'AlertDescriptions',
    'ScheduleDescriptions',
    'TimerDescriptions',
    'SensorTriggerDescriptions',
    'ChartDataPoints',
    'OrgDashboardReadings',
    'JournalData',
    'JournalControllers',
    'JournalSensorData',
    'JournalDeviceData',
    'Heatmaps',
    'HeatmapHistory',
    'HeatmapGroups',
    'HeatmapSensors',
    'HeatmapDevices',
    'ParticleSensors',
    'Notifications',
  ];

  constructor(public prefs: UserPreferencesService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.paths.some(p => request.url.indexOf(p) >= 0) && request.method !== 'Delete') {
      const pramsPrefix = request.url.indexOf('?') >= 0 ? '&' : '?';
      const prefsParams =
        `${pramsPrefix}tempUnitOfMeasure=${this.prefs.currentUserPrefs.temp}&tdsUnitOfMeasure=${this.prefs.currentUserPrefs.tds}` +
        `&lightLevelUnitOfMeasure=${this.prefs.currentUserPrefs.lightLevel}&vpdUnitOfMeasure=${this.prefs.currentUserPrefs.vpd}`;
      request = request.clone({ url: request.url + prefsParams });
    }

    return next.handle(request);
  }
}
