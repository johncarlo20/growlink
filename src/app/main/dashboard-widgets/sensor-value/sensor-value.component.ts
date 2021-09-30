import { Component, Input, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SensorRealTimeModel, SensorAlert } from '@models';

@Component({
  selector: 'fuse-sensor-value',
  templateUrl: './sensor-value.component.html',
  styleUrls: ['./sensor-value.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SensorValueComponent {
  @Input() sensor: SensorRealTimeModel;
  @Input() custom = false;
  @Input() isLoading = true;
  @Input() customName: string;

  get activeAlerts(): Observable<SensorAlert[]> {
    return this.sensor.activeAlerts;
  }

  get hasActiveAlerts(): Observable<boolean> {
    return this.activeAlerts.pipe(
      map(alerts => alerts.length > 0)
    );
  }

  constructor() {}
}
