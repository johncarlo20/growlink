import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, finalize, mapTo } from 'rxjs/operators';
import { ProgressBarService } from './progress-bar.service';
import {
  Dashboard,
  DashboardResponse,
  DashboardRequest,
  DashboardItemRequest,
  DashboardItemResponse,
  DashboardFullRequest,
} from '@models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private generatedDashboard = new BehaviorSubject<Dashboard>(null);

  constructor(private http: HttpClient, private progressBarService: ProgressBarService) {}

  public get GeneratedDashboard(): Observable<Dashboard> {
    return this.generatedDashboard.asObservable();
  }

  getOrganizationDashboards(organizationId: string): Observable<DashboardResponse[]> {
    this.progressBarService.SetLoading(true);
    return this.http
      .get<DashboardResponse[]>(`api/Dashboards?organizationId=${organizationId}`)
      .pipe(
        map((boards) => boards.map((hm) => new DashboardResponse(hm))),
        finalize(() => this.progressBarService.SetLoading(false))
      );
  }

  getControllerDashboards(controllerId: string): Observable<DashboardResponse[]> {
    this.progressBarService.SetLoading(true);
    return this.http.get<DashboardResponse[]>(`api/Dashboards?controllerId=${controllerId}`).pipe(
      map((boards) => boards.map((hm) => new DashboardResponse(hm))),
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  getDashboard(dashboardId: string): Observable<DashboardResponse> {
    this.progressBarService.SetLoading(true);
    return this.http.get<DashboardResponse>(`api/Dashboards/${dashboardId}`).pipe(
      map((board) => new DashboardResponse(board)),
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  addDashboard(newDashboard: DashboardRequest): Observable<DashboardResponse> {
    this.progressBarService.SetLoading(true);
    return this.http.post<DashboardResponse>(`api/Dashboards`, newDashboard).pipe(
      map((board) => new DashboardResponse(board)),
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  updateDashboard(updated: DashboardRequest): Observable<DashboardResponse> {
    this.progressBarService.SetLoading(true);
    return this.http.put(`api/Dashboards/${updated.Id}`, updated).pipe(
      map(() => new DashboardResponse(updated)),
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  deleteDashboard(id: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);

    return this.http.delete(`api/Dashboards/${id}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      mapTo(true)
    );
  }

  saveGeneratedDashboard(newDashboard: DashboardFullRequest): Observable<DashboardResponse> {
    this.progressBarService.SetLoading(true);
    return this.http.post<DashboardResponse>(`api/Dashboards`, newDashboard).pipe(
      map((board) => new DashboardResponse(board)),
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  addDashboardItem(newItem: DashboardItemRequest): Observable<DashboardItemResponse> {
    this.progressBarService.SetLoading(true);
    return this.http.post<DashboardItemResponse>(`api/DashboardItems`, newItem).pipe(
      map((item) => new DashboardItemResponse(item)),
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  updateDashboardItem(updated: DashboardItemRequest): Observable<DashboardItemResponse> {
    this.progressBarService.SetLoading(true);
    return this.http.put(`api/DashboardItems/${updated.Id}`, updated).pipe(
      map(() => new DashboardItemResponse(updated)),
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  deleteDashboardItem(id: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);

    return this.http.delete(`api/DashboardItems/${id}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      mapTo(true)
    );
  }

  setGeneratedDashboard(dashboard: Dashboard): void {
    this.generatedDashboard.next(dashboard);
  }

  clearGeneratedDashboard(): void {
    this.generatedDashboard.next(null);
  }
}
