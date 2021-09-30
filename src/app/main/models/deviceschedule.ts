import { DayOfWeek } from './dayofweek';
import { DeviceScheduleResponse } from './devicescheduleresponse';
import { DeviceWithThrottle } from './devicewiththrottle';
import { DeviceBasedRule } from './devicesrule';
import { Controller } from './controller';
import { DeviceResponse } from './deviceresponse';
import { DosingRecipeResponse } from './dosingreciperesponse';
import * as moment from 'moment';

export class DeviceSchedule extends DeviceBasedRule {
  DaysOfWeek: DayOfWeek[] = [];
  StartTime = `00:00:00`;
  EndTime = `00:00:00`;
  ThrottleFadeIn = `00:00:00`;
  ThrottleFadeOut = `00:00:00`;

  Name: string;
  ControllerStartTime: string;
  ControllerEndTime: string;
  DaysOfWeekHuman: string;

  public static GetSchedule(
    controller: Controller,
    deviceOptions: DeviceResponse[],
    dosingRecipes: DosingRecipeResponse[],
    source: DeviceScheduleResponse,
    prefer24Hours: boolean,
  ): DeviceSchedule {
    const schedule = new DeviceSchedule();
    const fadeInMoment = moment.unix(source.ThrottleFadeIn).utc();
    const fadeOutMoment = moment.unix(source.ThrottleFadeOut).utc();

    schedule.getRuleBasics(source);
    schedule.getDeviceRuleBasics(source, deviceOptions, dosingRecipes);
    schedule.StartTime = source.StartTime;
    schedule.EndTime = source.EndTime;
    schedule.ThrottleFadeIn = fadeInMoment.isValid() ? fadeInMoment.format('HH:mm:ss') : null;
    schedule.ThrottleFadeOut = fadeOutMoment.isValid() ? fadeOutMoment.format('HH:mm:ss') : null;
    schedule.DaysOfWeek = DayOfWeek.getDaysOfWeekForMultiSelect(source.DaysOfWeek);

    schedule.DaysOfWeekHuman = DayOfWeek.getDaysOfWeekDisplay(source.DaysOfWeek);
    schedule.ControllerStartTime = schedule.getControllerTimeString(prefer24Hours, controller, schedule.StartTime);
    schedule.ControllerEndTime = schedule.getControllerTimeString(prefer24Hours, controller, schedule.EndTime);

    schedule.Name = `${schedule.DeviceNames} between ${schedule.ControllerStartTime} and ${schedule.ControllerEndTime}`;

    return schedule;
  }

  getScheduleResponse(selectedDeviceThrottles: DeviceWithThrottle[]): DeviceScheduleResponse {
    const tResponse = new DeviceScheduleResponse();
    const fadeInDuration = moment.duration(this.ThrottleFadeIn);
    const fadeOutDuration = moment.duration(this.ThrottleFadeOut);
    const fadeInMoment = moment
      .unix(0)
      .utc()
      .add(fadeInDuration);
    const fadeOutMoment = moment
      .unix(0)
      .utc()
      .add(fadeOutDuration);

    this.setRuleBasics(tResponse);
    this.setDeviceRuleBasics(tResponse);
    tResponse.StartTime = this.StartTime;
    tResponse.EndTime = this.EndTime;
    tResponse.ThrottleFadeIn = fadeInMoment.isValid() ? fadeInMoment.unix() : 0;
    tResponse.ThrottleFadeOut = fadeOutMoment.isValid() ? fadeOutMoment.unix() : 0;
    tResponse.DaysOfWeek = DayOfWeek.getDaysOfWeekFromMultiSelect(this.DaysOfWeek);

    this.setDevicesAndThrottles(tResponse, selectedDeviceThrottles);

    return tResponse;
  }
}
