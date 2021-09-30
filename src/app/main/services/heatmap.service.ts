import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, finalize, mapTo } from 'rxjs/operators';
import {
  HeatmapConfiguration,
  IHeatmapConfiguration,
  HeatmapGroup,
  IHeatmapGroup,
  HeatmapSensor,
  IHeatmapSensor,
  HeatmapDevice,
  IHeatmapDevice,
} from '@models';
import { ProgressBarService } from './progress-bar.service';

@Injectable()
export class HeatmapService {
  constructor(private http: HttpClient, private progressBarService: ProgressBarService) {}

  getHeatmaps(orgId: string): Observable<HeatmapConfiguration[]> {
    return this.http
      .get<HeatmapConfiguration[]>(`api/Heatmaps?organizationId=${orgId}`)
      .pipe(map(maps => maps.map(hm => new HeatmapConfiguration(hm))));
  }

  getHeatmap(heatmapId: string): Observable<HeatmapConfiguration> {
    return this.http
      .get<HeatmapConfiguration>(`api/Heatmaps/${heatmapId}`)
      .pipe(map(heatmap => new HeatmapConfiguration(heatmap)));
  }

  saveHeatmap(config: HeatmapConfiguration): Observable<HeatmapConfiguration> {
    this.progressBarService.SetLoading(true);
    const configBody: IHeatmapConfiguration = {
      Name: config.Name,
      OrganizationId: config.OrganizationId,
    };

    if (config.Id) {
      return this.http.put(`api/Heatmaps/${config.Id}`, configBody).pipe(
        finalize(() => this.progressBarService.SetLoading(false)),
        mapTo(config)
      );
    } else {
      return this.http
        .post<HeatmapConfiguration>(`api/Heatmaps`, configBody)
        .pipe(finalize(() => this.progressBarService.SetLoading(false)));
    }
  }

  saveHeatmapGroup(group: HeatmapGroup): Observable<HeatmapGroup> {
    this.progressBarService.SetLoading(true);
    const groupBody: IHeatmapGroup = {
      Name: group.Name,
      HeatmapId: group.HeatmapId,
      MinReading: group.MinReading,
      MaxReading: group.MaxReading,
      ParticleSensor: group.ParticleSensor
    };

    if (group.Id) {
      return this.http.put(`api/HeatmapGroups/${group.Id}`, groupBody).pipe(
        finalize(() => this.progressBarService.SetLoading(false)),
        mapTo(group)
      );
    } else {
      return this.http
        .post<HeatmapGroup>(`api/HeatmapGroups`, groupBody)
        .pipe(finalize(() => this.progressBarService.SetLoading(false)));
    }
  }

  saveHeatmapSensor(sensor: HeatmapSensor): Observable<HeatmapSensor> {
    this.progressBarService.SetLoading(true);
    const sensorBody: IHeatmapSensor = {
      SensorId: sensor.SensorId,
      HeatmapGroupId: sensor.HeatmapGroupId,
      LocationX0: sensor.LocationX0,
      LocationX1: sensor.LocationX1,
      LocationY0: sensor.LocationY0,
      LocationY1: sensor.LocationY1,
    };

    if (sensor.Id) {
      return this.http.put(`api/HeatmapSensors/${sensor.Id}`, sensorBody).pipe(
        finalize(() => this.progressBarService.SetLoading(false)),
        mapTo(sensor)
      );
    } else {
      return this.http
        .post<HeatmapSensor>(`api/HeatmapSensors`, sensorBody)
        .pipe(finalize(() => this.progressBarService.SetLoading(false)));
    }
  }

  saveHeatmapDevice(device: HeatmapDevice): Observable<HeatmapDevice> {
    this.progressBarService.SetLoading(true);
    const deviceBody: IHeatmapDevice = {
      DeviceId: device.DeviceId,
      DeviceType: device.DeviceType,
      HeatmapGroupId: device.HeatmapGroupId,
      LocationX: device.LocationX,
      LocationY: device.LocationY,
      Size: device.Size,
    };

    if (device.Id) {
      return this.http.put(`api/HeatmapDevices/${device.Id}`, deviceBody).pipe(
        finalize(() => this.progressBarService.SetLoading(false)),
        mapTo(device)
      );
    } else {
      return this.http
        .post<HeatmapDevice>(`api/HeatmapDevices`, deviceBody)
        .pipe(finalize(() => this.progressBarService.SetLoading(false)));
    }
  }

  deleteHeatmap(mapId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);

    return this.http.delete(`api/Heatmaps/${mapId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      mapTo(true)
    );
  }

  deleteHeatmapGroup(groupId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);

    return this.http.delete(`api/HeatmapGroups/${groupId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      mapTo(true)
    );
  }

  deleteHeatmapSensor(sensorId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);

    return this.http.delete(`api/HeatmapSensors/${sensorId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      mapTo(true)
    );
  }

  deleteHeatmapDevice(deviceId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);

    return this.http.delete(`api/HeatmapDevices/${deviceId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      mapTo(true)
    );
  }
}
