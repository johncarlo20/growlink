import { NotificationBase } from './notification-base';
import { NotificationResponse } from './notification-response';
import { ControllerResponse } from './controllerresponse';
import * as moment from 'moment';

export interface IModuleAlertNotificationData {
  Module: {
    Id: string;
    Name: string;
    ControllerId: string;
    LastSeenTimestamp: string;
  };
}

export class ModuleAlertNotification extends NotificationBase {
  constructor(prefer24: boolean, src: NotificationResponse) {
    super(prefer24, src);

    this.Data = src.Data;
  }

  Data: IModuleAlertNotificationData | string;
  _controller: ControllerResponse = null;
  ControllerLastSeen?: string;

  get Details() {
    if (typeof this.Data === 'string') {
      return `ERROR: ${this.Data}`;
    }
    if (this.DeactivateTimestamp) {
      return `Module ${this.Data.Module.Name} was not able to be reached`;
    }

    return `Module ${this.Data.Module.Name} cannot currently be reached`;
  }

  get LastSeen(): moment.Moment {
    if (typeof this.Data === 'string') {
      return null;
    }

    return moment.utc(this.Data.Module.LastSeenTimestamp);
  }

  get Controller() {
    return this._controller;
  }
  set Controller(value: ControllerResponse) {
    this._controller = value;
    this.SetControllerTimestamps();
    this.ControllerLastSeen = this.ControllerTimestamp(this.LastSeen);
  }
}
