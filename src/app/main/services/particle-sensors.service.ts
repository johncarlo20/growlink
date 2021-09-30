import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ProgressBarService } from './progress-bar.service';
import { ParticleSensorResponse, ParticleSensor, Controller, ControllerResponse, SelectItem } from '@models';

@Injectable()
export class ParticleSensorsService {
  private particleSensors: ParticleSensorResponse[] = [];

  constructor(private http: HttpClient,
    private progressBarService: ProgressBarService) {
    this.loadParticleSensors();

  }

  private loadParticleSensors(): void {
    const cache = sessionStorage.getItem('particleSensors');
    if (cache !== null && cache.length) {
      this.particleSensors = JSON.parse(cache);
    }

    this.http.get<ParticleSensorResponse[]>('api/ParticleSensors')
      .subscribe(r => {
        this.particleSensors = r;
        this.particleSensors.sort((a, b) => a.SortId - b.SortId);
        sessionStorage.setItem('particleSensors', JSON.stringify(this.particleSensors));
      });
  }

  public LoadControllerParticleSensors(controller: Controller | ControllerResponse, calibrationTimestamp?: number): Observable<ParticleSensorResponse[]> {
    const calibrationParam = calibrationTimestamp !== undefined ? `&calibrationTimestamp=${calibrationTimestamp}` : '';
    const url = `api/ParticleSensors?firmwareVersion=${controller.FirmwareVersion}${calibrationParam}`;
    this.progressBarService.SetLoading(true);
    return this.http.get<ParticleSensorResponse[]>(url).pipe(
      finalize(() => this.progressBarService.SetLoading(false)));
  }

  public FindParticleSensor(sensorType: ParticleSensor) {
    return this.particleSensors.find(ps => ps.Id === sensorType);
  }

  public get SelectList(): SelectItem[] {
    return this.particleSensors.map(ps => ({ value: ps.Id, caption: ps.Description }));
  }

  public CalibrationSelectList(controllerSensors?: ParticleSensorResponse[]): SelectItem[] {
    const sensorsSource = controllerSensors && controllerSensors.length ? controllerSensors : this.particleSensors;
    const sensors = sensorsSource
      .filter(ps => ps.AllowManualAdjustment || ps.SupportsCalibration || ps.AllowCalibrateToValue)
      .sort((a, b) => a.SortId - b.SortId)
      .map(ps => ({ value: ps.Id, caption: ps.Description }));
    sensors.unshift({ caption: 'All', value: 0 });

    return sensors;
  }

  public LowFullSensor(sensor: ParticleSensorResponse): boolean {
    if (!sensor) {
      return false;
    }
    return ParticleSensor.LowFullSensor(sensor.Id);
  }
  public OnOffSensor(sensor: ParticleSensorResponse): boolean {
    if (!sensor) {
      return false;
    }
    return ParticleSensor.OnOffSensor(sensor.Id);
  }
}
