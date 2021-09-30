import { RuleResponse, Rule } from './rule';
import { DeviceWithThrottle } from './devicewiththrottle';
import { DeviceResponse, DeviceAllowThrottle } from './deviceresponse';
import { DosingRecipeResponse } from './dosingreciperesponse';

export abstract class DeviceBasedRuleResponse extends RuleResponse {
  DeviceId: string;
  Throttle: number;
  BacnetValue: string;
  AdditionalDeviceIds: string[];
  AdditionalThrottles: number[];
  AdditionalBacnetValues: string[];
  DosingRecipeId?: string;
}

export abstract class DeviceBasedRule extends Rule {
  DeviceIds: string[] = [];
  DosingRecipeId?: string;
  Throttles: number[] = [];
  BacnetValues: string[] = [];
  DeviceList: string[] = [];
  DeviceNames: string;

  protected getDeviceRuleBasics(
    source: DeviceBasedRuleResponse,
    deviceOptions: DeviceResponse[] = [],
    dosingRecipes: DosingRecipeResponse[] = []
  ) {
    this.DeviceIds = [source.DeviceId];
    this.DeviceIds = this.DeviceIds.concat(source.AdditionalDeviceIds);
    this.Throttles = [source.Throttle];
    this.Throttles = this.Throttles.concat(source.AdditionalThrottles);
    this.BacnetValues = [source.BacnetValue];
    this.BacnetValues = this.BacnetValues.concat(source.AdditionalBacnetValues);
    this.DosingRecipeId = source.DosingRecipeId;

    if (deviceOptions.length) {
      this.DeviceList = this.DeviceIds.map(devId => deviceOptions.find(dev => dev.Guid === devId))
        .filter(dev => !!dev)
        .map(dev => dev.Name);
    }

    if (this.DosingRecipeId) {
      const recipe = dosingRecipes.find(dr => dr.Id === this.DosingRecipeId);
      if (recipe) {
        this.DeviceList.push(recipe.Name);
      }
    }

    this.DeviceList.sort((a, b) => a.localeCompare(b));
    this.DeviceNames = this.DeviceList.join(', ');
  }

  public getDeviceThrottles(deviceAllowsThrottles: DeviceAllowThrottle[]) {
    const throttles: DeviceWithThrottle[] = [];
    deviceAllowsThrottles.forEach(dev => {
      const devThrottle = Object.assign<DeviceWithThrottle, Partial<DeviceWithThrottle>>(
        new DeviceWithThrottle(),
        dev
      );
      throttles.push(devThrottle);
    });

    for (let deviceIndex = 0; deviceIndex < this.DeviceIds.length; deviceIndex++) {
      const deviceId = this.DeviceIds[deviceIndex];
      const addThrottle = throttles.find(t => t.Guid === deviceId);
      if (addThrottle) {
        Object.assign<DeviceWithThrottle, Partial<DeviceWithThrottle>>(addThrottle, {
          Throttle: this.Throttles[deviceIndex],
          BACNetValue: this.BacnetValues[deviceIndex],
        });
      }
    }

    return throttles;
  }

  protected setDeviceRuleBasics(response: DeviceBasedRuleResponse) {
    response.DosingRecipeId = this.DosingRecipeId;
  }

  protected setDevicesAndThrottles(
    response: DeviceBasedRuleResponse,
    selectedDeviceThrottles: DeviceWithThrottle[]
  ): void {
    const deviceThrottles: DeviceWithThrottle[] = selectedDeviceThrottles.map(x =>
      Object.assign({}, x)
    );

    response.DeviceId = deviceThrottles[0].Guid;
    response.Throttle = deviceThrottles[0].Throttle ? deviceThrottles[0].Throttle : 0;
    response.BacnetValue = deviceThrottles[0].IsBACNet ? deviceThrottles[0].BACNetValue : null;
    deviceThrottles.splice(0, 1);
    response.AdditionalDeviceIds = deviceThrottles.map(d => d.Guid);
    response.AdditionalThrottles = deviceThrottles.map(d => (d.Throttle ? d.Throttle : 0));
    response.AdditionalBacnetValues = deviceThrottles.map(d => (d.IsBACNet ? d.BACNetValue : null));
  }
}
