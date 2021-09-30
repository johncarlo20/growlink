import { OnInit, Inject, Component } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationBase } from '@models';
import { NotificationsService } from '@services';
import * as moment from 'moment';

@Component({template: ''})
export abstract class AlertDialogComponent<
  TNotificationType extends NotificationBase,
  TDialogComponent extends AlertDialogComponent<TNotificationType, TDialogComponent>
> implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { alert: TNotificationType },
    public dialogRef: MatDialogRef<TDialogComponent>,
    public notificationService: NotificationsService,
  ) {}

  ngOnInit() {
    if (this.data.alert && !this.data.alert.Seen) {
      this.notificationService.toggleRead(this.data.alert.Id, true);
    }
  }

  toggleRead() {
    if (this.data.alert) {
      this.notificationService.toggleRead(this.data.alert.Id, !this.Seen);
    }
  }

  onClose() {
    this.dialogRef.close();
  }

  get FormattedActivated(): string {
    return this.data.alert && this.data.alert.ControllerActivateTimestamp;
  }

  get FormattedDeactivated(): string {
    return this.data.alert && this.data.alert.ControllerDeactivateTimestamp;
  }

  get Activated(): moment.Moment {
    return this.data.alert && this.data.alert.ActivateTimestamp;
  }

  get Deactivated(): moment.Moment {
    return this.data.alert && this.data.alert.DeactivateTimestamp;
  }

  get Details(): string {
    return this.data.alert && this.data.alert.Details;
  }

  get Seen(): boolean {
    return this.data.alert && this.data.alert.Seen;
  }
}
