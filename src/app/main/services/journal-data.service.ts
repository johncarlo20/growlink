import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ProgressBarService } from './progress-bar.service';
import { JournalData, HistoricHeatmapData, DayNightOption } from '@models';
import { TimeUtil } from '@util';

@Injectable()
export class JournalDataService {
  constructor(private http: HttpClient, private progressBarService: ProgressBarService) { }

  getJournalControllers(
    controllerId: string,
    startDate: Date,
    endDate: Date
  ): Observable<JournalData> {
    if (!controllerId || controllerId === '') {
      return new Observable<JournalData>();
    }

    const startDateId = TimeUtil.getDateId(startDate);
    const endDateId = TimeUtil.getDateId(endDate);
    const url = `api/JournalControllers/?controllerId=${controllerId}&startDateId=${startDateId}&endDateId=${endDateId}`;
    this.progressBarService.SetLoading(true);
    return this.http
      .get<JournalData>(url)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  getJournalSensorData(
    controllerId: string,
    sensorId: string,
    startDate: Date,
    endDate: Date,
    includeHourly: boolean,
    dayNightOption: DayNightOption = DayNightOption.TwentyFourHours
  ): Observable<JournalData> {
    if (!controllerId || controllerId === '') {
      return new Observable<JournalData>();
    }

    const startDateId = TimeUtil.getDateId(startDate);
    const endDateId = TimeUtil.getDateId(endDate);
    const url = `api/JournalSensorData/?controllerId=${controllerId}&startDateId=${startDateId}&endDateId=${endDateId}&includeHourly=${includeHourly}${sensorId !== null ? `&sensorId=${sensorId}` : '&sensorId='}${dayNightOption !== null ? `&dayNightOption=${dayNightOption}` : ''}`;
    this.progressBarService.SetLoading(true);
    return this.http
      .get<JournalData>(url)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  getJournalDeviceData(
    controllerId: string,
    deviceId: string,
    startDate: Date,
    endDate: Date
  ): Observable<JournalData> {
    if (!controllerId || controllerId === '') {
      return new Observable<JournalData>();
    }

    const startDateId = TimeUtil.getDateId(startDate);
    const endDateId = TimeUtil.getDateId(endDate);
    const url = `api/JournalDeviceData/?controllerId=${controllerId}&startDateId=${startDateId}&endDateId=${endDateId}&includeHourly=false${deviceId !== null ? `&deviceId=${deviceId}` : '&deviceId='}`;
    this.progressBarService.SetLoading(true);
    return this.http
      .get<JournalData>(url)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  getHistoricHeatmapData(heatmapId: string, dateRange: number): Observable<HistoricHeatmapData> {
    const url = `api/HeatmapHistory/?heatmapId=${heatmapId}&dateRange=${dateRange}`;
    this.progressBarService.SetLoading(true);
    return this.http
      .get<HistoricHeatmapData>(url)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }
}
