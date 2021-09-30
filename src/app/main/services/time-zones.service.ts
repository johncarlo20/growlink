import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, finalize, map } from 'rxjs/operators';
import { ProgressBarService } from './progress-bar.service';
import { TimeZoneInfo, SelectItem } from '@models';

@Injectable()
export class TimeZonesService {
  constructor(private http: HttpClient, private progressBarService: ProgressBarService) {}

  forSelectList(countryCode: string): Observable<SelectItem[]> {
    return this.getTimeZones(countryCode).pipe(map(s =>
      s.map(timeZoneId => ({ caption: timeZoneId, value: timeZoneId }))
    ));
  }

  private getTimeZones(countryCode: string): Observable<string[]> {
    const cached = sessionStorage.getItem(`timezones-${countryCode}`);
    if (cached && cached.length > 0) {
      return of(JSON.parse(cached));
    }
    this.progressBarService.SetLoading(true);
    return this.http.get<string[]>(`api/TimeZones?countryCode=${countryCode}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      tap(s => {
        sessionStorage.setItem(`timezones-${countryCode}`, JSON.stringify(s));
      })
    );
  }

  public getTimeZoneInfo(timeZoneId: string): Observable<TimeZoneInfo> {
    const cached = sessionStorage.getItem(`timezoneInfos`);
    if (cached && cached.length > 0) {
      const cachedInfos = JSON.parse(cached) as TimeZoneInfo[];
      const exist = cachedInfos.find(tz => tz.Id === timeZoneId);
      if (exist) {
        return of(exist);
      }
    }

    this.progressBarService.SetLoading(true);
    return this.http
      .get<TimeZoneInfo>(`api/TimeZoneInfos/?id=${encodeURIComponent(timeZoneId)}`)
      .pipe(
        finalize(() => this.progressBarService.SetLoading(false)),
        tap(s => {
          const curCachedJson = sessionStorage.getItem(`timezoneInfos`);
          const curCached =
            curCachedJson && curCachedJson.length
              ? (JSON.parse(curCachedJson) as TimeZoneInfo[])
              : new Array<TimeZoneInfo>();
          const newCached = [...curCached, s];
          sessionStorage.setItem(`timezoneInfos`, JSON.stringify(newCached));
        })
      );
  }
}
