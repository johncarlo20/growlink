import { DeviceTypes } from './devicetype';
import { ModuleResponse } from './moduleresponse';
import { Controller } from './controller';

export class MotorControl {
  ControllerId: string;
  Name: string;
  DeviceType: DeviceTypes;
  OpenDeviceId: string;
  OpenDuration = '00:00:00';
  CloseDeviceId: string;
  CloseDuration = '00:00:00';

  public static GetMotorControl(controller: Controller, mod: ModuleResponse): MotorControl {
    if (!mod.MotorControl || !mod.Devices || !mod.Devices.length) {
      return null;
    }

    const motorControl = new MotorControl();
    const motorControlDevice = mod.Devices[0];

    motorControl.ControllerId = controller.Guid;
    motorControl.Name = mod.Name;
    motorControl.DeviceType = motorControlDevice.DeviceType;
    motorControl.OpenDeviceId = mod.MotorControl.OpenDeviceId;
    motorControl.CloseDeviceId = mod.MotorControl.CloseDeviceId;
    motorControl.OpenDuration = mod.MotorControl.OpenDuration;
    motorControl.CloseDuration = mod.MotorControl.CloseDuration;

    return motorControl;
  }
}
