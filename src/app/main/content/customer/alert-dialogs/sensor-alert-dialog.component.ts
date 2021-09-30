import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SensorAlertNotification, ISensorAlertNotificationData, ControllerResponse } from '@models';
import { NotificationsService, ControllerService } from '@services';
import { AlertDialogComponent } from './alert-dialogs.base';

@Component({
  selector: 'fuse-sensor-alert-dialog',
  templateUrl: './sensor-alert-dialog.component.html',
  styleUrls: ['./alert-dialogs.component.scss'],
})
export class SensorAlertDialogComponent
  extends AlertDialogComponent<SensorAlertNotification, SensorAlertDialogComponent>
  implements OnInit {
  alertDetails: ISensorAlertNotificationData;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { alert: SensorAlertNotification },
    public dialogRef: MatDialogRef<SensorAlertDialogComponent>,
    public notificationService: NotificationsService,
    private controllerService: ControllerService
  ) {
    super(data, dialogRef, notificationService);

    this.alertDetails = data.alert.Data as ISensorAlertNotificationData;
  }

  get Controller(): Observable<ControllerResponse> {
    return this.controllerService.AllControllers.pipe(
      map(all => all.find(c => c.Id === this.alertDetails.Sensor.ControllerId))
    );
  }

  get ControllerUrl(): Observable<string> {
    return this.Controller.pipe(
      map(c => c ? `/controller/${c.Id}/dashboard/${c.DefaultDashboardId ? c.DefaultDashboardId : 'generated'}` : '#')
    );
  }
}
