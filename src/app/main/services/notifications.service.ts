import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, finalize, tap } from 'rxjs/operators';
import { NotificationResponse, NotificationBase, ControllerResponse, NotificationType, UserPrefs } from '@models';
import { ProgressBarService } from './progress-bar.service';
import { SignalRService } from './signal-r.service';
import { ControllerService } from './controller.service';
import { UserPreferencesService } from './userpreferences.service';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private notifications = new BehaviorSubject<NotificationBase[]>([]);
  private unread = new BehaviorSubject<number>(0);
  private allControllers: ControllerResponse[] = [];
  private userPrefs: UserPrefs;

  public get Notifications(): Observable<NotificationBase[]> {
    return this.notifications.asObservable();
  }
  public get UnreadCount(): Observable<number> {
    return this.unread.asObservable();
  }
  public get Count(): Observable<number> {
    return this.notifications.pipe(
      map(notifications => notifications.length)
    );
  }

  constructor(
    private http: HttpClient,
    private progressBarService: ProgressBarService,
    private signalR: SignalRService,
    private controllerService: ControllerService,
    private userPrefService: UserPreferencesService
  ) {
    this.controllerService.AllControllers.subscribe(all => this.allControllers = all);
    this.userPrefService.userPrefs.subscribe(prefs => this.userPrefs = prefs);
  }

  getUnreadNotifications(): void {
    this.signalR.GetUnreadCount().done((unread: number) => {
      this.unread.next(unread);
    });
  }

  getInbox(seen: boolean, pageSize: number, types: NotificationType[], controllers: string[]): Observable<NotificationBase[]> {
    let URL = `api/Notifications?seen=${seen}&pageSize=${pageSize}`;
    types.forEach(type => {
      URL += `&notificationType=${type}`;
    });
    controllers.forEach(controllerId => {
      URL += `&controllerId=${controllerId}`;
    });

    this.progressBarService.SetLoading(true);
    return this.http.get<NotificationResponse[]>(URL).pipe(
      map(notifications => notifications.map(n => NotificationResponse.GetNotification(n, this.userPrefs.prefer24Hour))),
      tap(notifications => {
        notifications.forEach(n => {
          if (!n.ControllerId || !n.ControllerId.length) {
            return;
          }

          n.Controller = this.allControllers.find(c => c.Id === n.ControllerId);
        });
      }),
      tap(notifications => this.notifications.next(notifications)),
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  toggleRead(notificationId: string, seen: boolean) {
    this.signalR.ToggleRead(notificationId, seen).done(() => {
      this.markNotificationSeen(notificationId, seen);
    });
  }

  markAllRead() {
    this.signalR.MarkAllRead().done(() => {
      this.notifications.value.forEach(n => this.markNotificationSeen(n.Id, true, false));
      this.getUnreadNotifications();
    });
  }

  private markNotificationSeen(notificationId: string, seen: boolean, getUnread = true) {
    const notifications = this.notifications.value;
    const findNotification = notifications.find(n => n.Id === notificationId);
    if (findNotification) {
      findNotification.SeenTimestamp = seen ? moment() : null;
      this.notifications.next(notifications);
    }

    if (getUnread) {
      this.getUnreadNotifications();
    }
  }
}
