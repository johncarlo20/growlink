import * as moment from 'moment';

export class EntityUpdate {
  FieldName: string;
  OldValue: string;
  NewValue: string;
  UserName: string;
  IpAddress: string;
  Timestamp: moment.Moment;

  constructor(src?: EntityUpdate) {
    if (src) {
      this.FieldName = src.FieldName;
      this.OldValue = src.OldValue;
      this.NewValue = src.NewValue;
      this.UserName = src.UserName;
      this.IpAddress = src.IpAddress;
      this.Timestamp = moment(`${src.Timestamp}Z`);
    }
  }
}
