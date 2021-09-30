import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/table';
import { Observable, BehaviorSubject } from 'rxjs';
import { BaseAPIComponent } from '@util';
import {
  AuthenticationService,
  NotificationsService,
  ProgressBarService,
  ControllerService,
} from '@services';
import { NotificationBase, NotificationType, SelectItem } from '@models';
import { ModuleAlertDialogComponent } from './alert-dialogs/module-alert-dialog.component';
import { ComponentType } from '@angular/cdk/portal';
import { SensorAlertDialogComponent } from './alert-dialogs/sensor-alert-dialog.component';
import 'moment-timezone';

@Component({
  selector: 'fuse-customer-inbox',
  templateUrl: './customer-inbox.component.html',
  styleUrls: ['./customer-inbox.component.scss'],
})
export class CustomerInboxComponent extends BaseAPIComponent implements OnInit {
  private pageLoaded = 0;

  public NotificationsSource = new NotificationsDataSource([]);
  displayedColumns = ['type', 'status', 'controller', 'detail', 'activate', 'deactivate'];
  allControllers: SelectItem[] = [];
  allNotificationTypes: SelectItem[] = [];
  controllerIds: string[] = [];
  notificationTypes: NotificationType[] = [];

  onlyUnseen = true;

  public get TotalLoaded() {
    return this.pageLoaded * 10;
  }

  public get UnreadCount(): Observable<number> {
    return this.notificationsService.UnreadCount;
  }

  public get Count(): Observable<number> {
    return this.notificationsService.Count;
  }

  constructor(
    private authenticationService: AuthenticationService,
    private notificationsService: NotificationsService,
    private controllerService: ControllerService,
    public dialog: MatDialog,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);
    this.progressBarService.SetCurrentPage([{ icon: 'notifications', caption: 'Inbox' }]);

    this.allNotificationTypes = NotificationBase.forSelectList();
  }

  ngOnInit() {
    super.ngOnInit();

    this.pageLoaded = 0;
    this.subs.add(
      this.authenticationService.User.subscribe(() => {
        this.updateNotifications(1);
      })
    );

    this.subs.add(
      this.notificationsService.Notifications.subscribe(notifications => {
        this.NotificationsSource.update(notifications);
      })
    );

    this.subs.add(
      this.controllerService.AllControllers.subscribe(all => {
        this.allControllers = all.map(c => ({
          caption: c.Name,
          value: c.Id,
        }));
      })
    );
  }

  markAllRead() {
    this.notificationsService.markAllRead();
  }

  refresh() {
    this.updateNotifications(this.pageLoaded);
  }

  toggleOnlyUnseen() {
    this.onlyUnseen = !this.onlyUnseen;
    this.refresh();
  }

  loadMore() {
    this.updateNotifications(this.pageLoaded + 1);
  }

  showNotification(row: NotificationBase) {
    const config: MatDialogConfig = {
      data: { alert: row },
    };

    let dialogType: ComponentType<object>;
    switch (row.Type) {
      case NotificationType.ModuleAlert:
        dialogType = ModuleAlertDialogComponent;
        break;
      case NotificationType.SensorAlert:
        dialogType = SensorAlertDialogComponent;
        break;
      default:
        return;
    }

    this.dialog.open(dialogType, config);
    // dialogRef.afterClosed().subscribe(() => {});
  }

  private updateNotifications(page: number): void {
    setTimeout(() => {
      this.notificationsService.getInbox(!this.onlyUnseen, page * 10, this.notificationTypes, this.controllerIds).subscribe(
        () => {
          this.pageLoaded = page;
        },
        error => this.handleError(error)
      );
      this.notificationsService.getUnreadNotifications();
    });
  }
}

class NotificationsDataSource implements DataSource<NotificationBase> {
  private data: BehaviorSubject<NotificationBase[]>;

  constructor(initialData?: NotificationBase[]) {
    this.data = new BehaviorSubject<NotificationBase[]>(initialData);
  }

  get Data(): Observable<NotificationBase[]> {
    return this.data.asObservable();
  }
  connect(): Observable<NotificationBase[]> {
    return this.data.asObservable();
  }

  update(newData?: NotificationBase[]): void {
    this.data.next(newData);
  }

  disconnect(): void {
    this.data.complete();
  }
}
