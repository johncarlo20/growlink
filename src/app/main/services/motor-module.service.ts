import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ProgressBarService } from './progress-bar.service';
import { MotorControl, MotorControlResponse } from '@models';

@Injectable()
export class MotorModuleService {
  constructor(private http: HttpClient, private progressBarService: ProgressBarService) { }

  addMotorControl(motorControl: MotorControl): Observable<MotorControlResponse> {
    this.progressBarService.SetLoading(true);
    return this.http
      .post<MotorControlResponse>(`api/MotorControls`, motorControl)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  updateMotorControl(moduleId: string, motorControl: MotorControl): Observable<boolean> {
      this.progressBarService.SetLoading(true);
      return this.http.put(`api/MotorControls/${moduleId}/`, motorControl).pipe(
        finalize(() => this.progressBarService.SetLoading(false)),
        map(() => true)
      );
  }

  deleteMotorControl(moduleId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.delete(`api/MotorControls/${moduleId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }
}
