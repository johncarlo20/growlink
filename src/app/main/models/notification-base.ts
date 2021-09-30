import { ControllerResponse } from './controllerresponse';
import { SelectItem } from './select-item';
import { TimeUtil } from '@util';
import * as moment from 'moment';

export enum NotificationType {
  SensorAlert = 0,
  ModuleAlert = 1,
}

export abstract class NotificationBase {
  Id: string;
  Type: NotificationType;
  Data: any;
  ActivateTimestamp: moment.Moment;
  DeactivateTimestamp?: moment.Moment;
  SeenTimestamp?: moment.Moment;
  ControllerId?: string;
  ControllerTz?: string;
  ControllerActivateTimestamp?: string;
  ControllerDeactivateTimestamp?: string;

  private prefer24Hours: boolean;

  constructor(prefer24: boolean, src?: NotificationBase) {
    this.prefer24Hours = prefer24;

    if (src) {
      this.Id = src.Id;
      this.Type = src.Type;
      this.ActivateTimestamp = moment.utc(src.ActivateTimestamp);
      this.DeactivateTimestamp = src.DeactivateTimestamp
        ? moment.utc(src.DeactivateTimestamp)
        : null;
      this.ControllerActivateTimestamp = this.FormatTimestamp(
        moment(this.ActivateTimestamp).local(), this.prefer24Hours
      );
      this.ControllerDeactivateTimestamp = this.DeactivateTimestamp
        ? this.FormatTimestamp(moment(this.DeactivateTimestamp).local(), this.prefer24Hours)
        : null;
      this.SeenTimestamp = src.SeenTimestamp ? moment.utc(src.SeenTimestamp) : null;
      this.ControllerId = src.ControllerId;
    }
  }

  abstract get Details(): string;
  get Controller(): ControllerResponse {
    return null;
  }
  set Controller(value: ControllerResponse) {}

  get TypeName(): string {
    switch (this.Type) {
      case NotificationType.ModuleAlert:
        return 'Module Failure';
      case NotificationType.SensorAlert:
        return 'Sensor Alert';
      default:
        return NotificationType[this.Type];
    }
  }

  get Seen(): boolean {
    return !!this.SeenTimestamp;
  }
  get Active(): boolean {
    return !this.DeactivateTimestamp;
  }

  protected SetControllerTimestamps() {
    this.ControllerActivateTimestamp = this.ControllerTimestamp(this.ActivateTimestamp);
    if (this.DeactivateTimestamp) {
      this.ControllerDeactivateTimestamp = this.ControllerTimestamp(this.DeactivateTimestamp);
    }
  }

  protected ControllerTimestamp(dateTime: moment.Moment): string {
    if (!this.Controller) {
      return this.FormatTimestamp(moment(dateTime).local(), this.prefer24Hours);
    }

    this.ControllerTz = TimeUtil.getTimezoneAbbr(this.Controller.TimeZoneId);

    const adjusted = moment.utc(dateTime).tz(this.Controller.TimeZoneId);

    return `${this.FormatTimestamp(adjusted, this.prefer24Hours)} ${this.ControllerTz}`;
  }

  protected FormatTimestamp(dateTime: moment.Moment, prefer24Hours: boolean): string {
    return moment(dateTime).format(`l, ${TimeUtil.preferredTimeFormat(prefer24Hours, false)}`);
  }
}

export namespace NotificationBase {
  export function getTypeDescription(type: NotificationType) {
    switch (type) {
      case NotificationType.ModuleAlert:
        return 'Module Failure';
      case NotificationType.SensorAlert:
        return 'Sensor Alert';
      default:
        return NotificationType[type];
    }
  }

  export function forSelectList(): SelectItem[] {
    const selectItems: SelectItem[] = [];
    // tslint:disable-next-line:forin
    for (const notificationType in NotificationType) {
      const isValueProperty = parseInt(notificationType, 10);
      if (!isNaN(isValueProperty)) {
        selectItems.push({ caption: getTypeDescription(isValueProperty), value: isValueProperty });
      }
    }

    return selectItems;
  }
}
