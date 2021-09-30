import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IModuleAlertNotificationData, ModuleAlertNotification, ControllerResponse } from '@models';
import { NotificationsService, ControllerService } from '@services';
import { AlertDialogComponent } from './alert-dialogs.base';
import * as moment from 'moment';

@Component({
  selector: 'fuse-module-alert-dialog',
  templateUrl: './module-alert-dialog.component.html',
  styleUrls: ['./alert-dialogs.component.scss'],
})
export class ModuleAlertDialogComponent
  extends AlertDialogComponent<ModuleAlertNotification, ModuleAlertDialogComponent>
  implements OnInit {
  alertDetails: IModuleAlertNotificationData;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { alert: ModuleAlertNotification },
    public dialogRef: MatDialogRef<ModuleAlertDialogComponent>,
    public notificationService: NotificationsService,
    private controllerService: ControllerService
  ) {
    super(data, dialogRef, notificationService);

    this.alertDetails = data.alert.Data as IModuleAlertNotificationData;
  }

  get LastSeen(): moment.Moment {
    return this.data.alert && this.data.alert.LastSeen;
  }

  get FormattedLastSeen(): string {
    return this.data.alert && this.data.alert.ControllerLastSeen;
  }

  get Controller(): Observable<ControllerResponse> {
    return this.controllerService.AllControllers.pipe(
      map(all => all.find(c => c.Id === this.alertDetails.Module.ControllerId))
    );
  }

  get ControllerUrl(): Observable<string> {
    return this.Controller.pipe(
      map(c => c ? `/controller/${c.Id}/dashboard/${c.DefaultDashboardId ? c.DefaultDashboardId : 'generated'}` : '#')
    );
  }
}
