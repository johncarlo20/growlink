import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ProgressBarService } from './progress-bar.service';
import { EntityUpdate, CalibrationReportResponse } from '@models';

@Injectable()
export class EntityUpdateService {
  constructor(private http: HttpClient, private progressBarService: ProgressBarService) { }

  getEntityUpdateData(entityId: string): Observable<EntityUpdate[]> {
    if (!entityId || entityId === '') {
      return new Observable<EntityUpdate[]>();
    }

    const url = `api/EntityUpdates/?entityId=${entityId}`;
    this.progressBarService.SetLoading(true);
    return this.http.get<EntityUpdate[]>(url).pipe(
      map(entries => entries
        .map(entry => new EntityUpdate(entry))
        .sort((a, b) => b.Timestamp.unix() - a.Timestamp.unix())
      ),
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  getCalibrationReport(controllerId: string, sensorType: number, startDate: Date, endDate: Date) {
    const url = `api/CalibrationReports?controllerId=${controllerId ? controllerId : ''}&particleSensor=${sensorType ? sensorType : ''}` +
      `&startTimestamp=${startDate.toISOString()}&endTimestamp=${endDate.toISOString()}`;
    this.progressBarService.SetLoading(true);
    return this.http.get<CalibrationReportResponse[]>(url).pipe(
      map(entries => entries
        .map(entry => new CalibrationReportResponse(entry))
        .sort((a, b) => b.Timestamp.unix() - a.Timestamp.unix())
      ),
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }
}
