import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { of } from 'rxjs';

import { ChartDataPointResponse } from '@models';

@Injectable()
export class ChartDataPointsService {

  constructor(private http: HttpClient) { }

  getChartData(controllerId: string, duration: number): Observable<ChartDataPointResponse[]> {
    if (!controllerId) {
      return of([]);
    }

    duration = duration || 10;

    return this.http.get<ChartDataPointResponse[]>(`api/ChartDataPoints?controllerId=${controllerId}&duration=${duration}`);
  }
}
