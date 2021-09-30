import { Pipe, PipeTransform } from '@angular/core';
import { UserPreferencesService } from '../services';
import { TimeUtil } from './time-util';
import * as moment from 'moment';
import 'moment-timezone';

@Pipe({ name: 'mdate' })
export class MomentDatePipe implements PipeTransform {
  private shortFormat = 'l, LT';
  private mediumTimeFormat = `LTS`;

  constructor(public userPrefs: UserPreferencesService) {
    userPrefs.userPrefs.subscribe(prefs => {
      this.shortFormat = `l, ${TimeUtil.preferredTimeFormat(prefs.prefer24Hour, false)}`;
      this.mediumTimeFormat = TimeUtil.preferredTimeFormat(prefs.prefer24Hour, true);
    })
  }

  transform(value: moment.Moment, format: 'short' | 'mediumTime', tz: string = null): string {
    let tstamp = moment(value);
    if (tz) {
      tstamp = tstamp.tz(tz);
    }

    switch (format) {
      case 'short':
        return tstamp.format(this.shortFormat);
      case 'mediumTime':
        return tstamp.format(this.mediumTimeFormat);
    }
  }
}
