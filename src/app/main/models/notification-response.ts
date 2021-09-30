import { NotificationBase, NotificationType } from './notification-base';
import { ModuleAlertNotification } from './module-alert-notification';
import { SensorAlertNotification } from './sensor-alert-notification';

type NotificationTypes = SensorAlertNotification | ModuleAlertNotification;

export class NotificationResponse extends NotificationBase {
  Data: any;

  constructor(src?: NotificationResponse) {
    super(false, src);
    if (src) {
      this.Data = src.Data;
    }
  }

  public static GetNotification(src: NotificationResponse, prefer24: boolean): NotificationTypes {
    switch (src.Type) {
      case NotificationType.SensorAlert:
        return new SensorAlertNotification(prefer24, src);
      case NotificationType.ModuleAlert:
        return new ModuleAlertNotification(prefer24, src);
      default:
        return null;
    }
  }

  get Details() {
    return null;
  }
}
