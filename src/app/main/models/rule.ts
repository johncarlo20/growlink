import { Controller } from './controller';
import { TimeUtil } from '@util';
import * as moment from 'moment';

export abstract class RuleResponse {
  Id: string;
  RuleGroupId: string;
  IsActive: boolean;
  DisplayName?: string;
}

export abstract class Rule {
  Id: string;
  RuleGroupId: string;
  IsActive = true;
  DisplayName?: string;

  protected getRuleBasics(source: RuleResponse) {
    this.Id = source.Id;
    this.RuleGroupId = source.RuleGroupId;
    this.IsActive = source.IsActive;
    this.DisplayName = source.DisplayName;
  }

  protected getControllerTimeString(prefer24: boolean, controller: Controller, dateTime: string): string {
    const tzAbbr = TimeUtil.getTimezoneAbbr(controller.TimeZoneId);
    if (dateTime.length !== 19) {
      return `${moment
        .tz(dateTime, 'HH:mm:ss', controller.TimeZoneId)
        .format(TimeUtil.preferredTimeFormat(prefer24))} ${tzAbbr}`;
    }

    const adjustedTimestamp = moment.utc(dateTime).format('HH:mm:ss');

    return `${moment
      .utc(adjustedTimestamp, 'HH:mm:ss')
      .tz(controller.TimeZoneId)
      .format(TimeUtil.preferredTimeFormat(prefer24))} ${tzAbbr}`;
  }

  protected setRuleBasics(response: RuleResponse) {
    response.Id = this.Id;
    response.RuleGroupId = this.RuleGroupId;
    response.IsActive = this.IsActive;
    response.DisplayName = this.DisplayName;
  }
}
