import { DosingRecipePartResponse } from './dosingrecipepartresponse';

export class DosingRecipeResponse {
  Id: string;
  DatabaseId: number;
  Name: string;
  TargetTds: number;
  ScaleFactor: number;
  ControllerDeviceId: string;
  Parts: DosingRecipePartResponse[] = [];
}
