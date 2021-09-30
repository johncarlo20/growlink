import { DayNightOption } from './daynightoption';
import { DeviceTimerResponse } from './devicetimerresponse';
import { DeviceWithThrottle } from './devicewiththrottle';
import { DeviceBasedRule } from './devicesrule';
import { Controller } from './controller';
import { DeviceResponse } from './deviceresponse';
import { DosingRecipeResponse } from './dosingreciperesponse';
import { TimeUtil } from '@util';
import * as moment from 'moment';

export class DeviceTimer extends DeviceBasedRule {
  DayNightOption: DayNightOption;
  StartTime?: string;
  EndTime?: string;
  SyncTime?: string;
  StartTimestamp = `00:00:00`;
  Frequency = `00:00:00`;
  Duration = `00:00:00`;

  Name: string;
  SyncTimeDisplay: string;
  FrequencyHuman: string;
  DurationHuman: string;
  TimeOfDay: string;

  public static GetTimer(
    controller: Controller,
    deviceOptions: DeviceResponse[],
    dosingRecipes: DosingRecipeResponse[],
    source: DeviceTimerResponse,
    prefer24Hours: boolean,
  ): DeviceTimer {
    const timer = new DeviceTimer();
    const timestamp = moment.utc(source.StartTimestamp);

    timer.getRuleBasics(source);
    timer.getDeviceRuleBasics(source, deviceOptions, dosingRecipes);
    timer.DayNightOption = source.DayNightOption;
    timer.Duration = source.Duration;
    timer.Frequency = source.Frequency;
    timer.StartTime = source.StartTime;
    timer.EndTime = source.EndTime;
    if (!source.SyncTime) {
      timer.StartTimestamp = timestamp.isValid() ? timestamp.format('HH:mm:ss') : null;
      timer.SyncTimeDisplay = timer.getControllerTimeString(prefer24Hours, controller, source.StartTimestamp);
    } else {
      timer.StartTimestamp = source.SyncTime;
      timer.SyncTime = source.SyncTime;
      timer.SyncTimeDisplay = timer.getControllerTimeString(prefer24Hours, controller, source.SyncTime);
    }

    timer.TimeOfDay = DayNightOption.toHumanReadable(timer.DayNightOption);
    timer.FrequencyHuman = TimeUtil.getHumanReadableDuration(timer.Frequency);
    timer.DurationHuman = TimeUtil.getHumanReadableDuration(timer.Duration);

    timer.Name = `${timer.DeviceNames} at ${timer.SyncTime} for ${timer.DurationHuman}`;

    return timer;
  }

  getTimerResponse(selectedDeviceThrottles: DeviceWithThrottle[]): DeviceTimerResponse {
    const tResponse = new DeviceTimerResponse();
    const syncMoment = moment(this.SyncTime, 'HH:mm:ss');
    let startMoment = moment(this.StartTimestamp, 'HH:mm:ss');
    while (startMoment.isAfter(moment())) {
      startMoment = moment(startMoment.subtract(1, 'day'));
    }

    this.setRuleBasics(tResponse);
    this.setDeviceRuleBasics(tResponse);
    tResponse.DayNightOption = this.DayNightOption;
    tResponse.StartTime = this.StartTime;
    tResponse.EndTime = this.EndTime;
    tResponse.StartTimestamp = startMoment.isValid()
      ? startMoment.format('YYYY-MM-DDTHH:mm:ss')
      : null;
    tResponse.SyncTime = syncMoment.isValid()
      ? syncMoment.format('HH:mm:ss')
      : null;
    tResponse.Duration = this.Duration !== '00:00:00' ? this.Duration : null;
    tResponse.Frequency = this.Frequency !== '00:00:00' ? this.Frequency : null;

    this.setDevicesAndThrottles(tResponse, selectedDeviceThrottles);

    return tResponse;
  }
}
