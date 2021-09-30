import { EntityUpdate } from './entityupdate';

export class CalibrationReportResponse extends EntityUpdate {
  ControllerName: string;
  ModuleName: string;
  SensorName: string;

  constructor(src?: CalibrationReportResponse) {
    super(src);

    if (src) {
      this.ControllerName = src.ControllerName;
      this.ModuleName = src.ModuleName;
      this.SensorName = src.SensorName;
    }
  }
}
