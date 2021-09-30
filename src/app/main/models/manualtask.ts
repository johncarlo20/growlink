import { ManualTaskResponse } from './manualtaskresponse';
import { DeviceWithThrottle } from './devicewiththrottle';
import { DeviceBasedRule } from './devicesrule';
import { DeviceResponse } from './deviceresponse';
import { DosingRecipeResponse } from './dosingreciperesponse';
import { TimeUtil } from '@util';

export class ManualTask extends DeviceBasedRule {
  DatabaseId: number;
  Duration = `00:00:00`;

  Name: string;
  DurationHuman: string;

  public static GetManualTask(
    deviceOptions: DeviceResponse[],
    dosingRecipes: DosingRecipeResponse[],
    source: ManualTaskResponse
  ): ManualTask {
    const task = new ManualTask();

    task.getRuleBasics(source);
    task.getDeviceRuleBasics(source, deviceOptions, dosingRecipes);
    task.DatabaseId = source.DatabaseId;
    task.Duration = source.Duration;

    task.DurationHuman = TimeUtil.getHumanReadableDuration(task.Duration);
    task.Name = `${task.DeviceNames} for ${task.DurationHuman}`;

    return task;
  }

  getManualTaskResponse(selectedDeviceThrottles: DeviceWithThrottle[]): ManualTaskResponse {
    const tResponse = new ManualTaskResponse();

    this.setRuleBasics(tResponse);
    this.setDeviceRuleBasics(tResponse);
    tResponse.DatabaseId = this.DatabaseId;
    tResponse.Duration = this.Duration !== '00:00:00' ? this.Duration : null;

    this.setDevicesAndThrottles(tResponse, selectedDeviceThrottles);

    return tResponse;
  }
}
