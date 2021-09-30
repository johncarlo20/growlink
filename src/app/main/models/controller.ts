import {
  DayNightOption,
  ModuleResponse,
  CameraResponse,
  RuleGroupResponse,
  MotorControlResponse,
  DosingRecipeResponse,
  DeviceScheduleResponse,
  DeviceSensorTriggerResponse,
  DeviceTimerResponse,
  ManualTaskResponse,
  UserPrefs,
} from './index';

export class Controller {
  Guid: string;
  Name: string;
  DeviceId: string;
  DayStartTime: string;
  DayEndTime: string;
  CountryCode: string;
  TimeZoneId: string;
  TimeZoneOffset: number;
  TimeZoneObservesDaylightSaving: boolean;
  ShutdownTemperature?: number;
  LedBrightness: number;
  LedDayNightOption: DayNightOption;
  EnableAnalogLightingOverride: boolean;
  EnableInlineDosing: boolean;
  EnableMotorControls: boolean;
  EnableHighFrequencyJournalData: boolean;
  SupportsCropSteering: boolean;
  SupportsStreaming: boolean;
  IsSharedController: boolean;
  MinimumLightingVoltage: number;
  InactiveLightingVoltage: number;
  NotificationEmailAddresses: string;
  NutrientDosingRunTime?: string;
  NutrientDosingWaitTime?: string;
  Modules: ModuleResponse[] = [];
  Cameras: CameraResponse[] = [];
  RuleGroups: RuleGroupResponse[] = [];
  MotorControls: MotorControlResponse[] = [];
  DosingRecipes: DosingRecipeResponse[] = [];
  SharedModules: ModuleResponse[] = [];
  SharedDosingRecipes: DosingRecipeResponse[] = [];
  Schedules: DeviceScheduleResponse[] = [];
  SensorTriggers: DeviceSensorTriggerResponse[] = [];
  Timers: DeviceTimerResponse[] = [];
  ManualTasks: ManualTaskResponse[] = [];
  edited: boolean;
  isReadOnly: boolean;
  FirmwareVersion?: number;
  Units?: UserPrefs;
}
