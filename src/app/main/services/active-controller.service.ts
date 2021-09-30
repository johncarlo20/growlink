import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  Controller,
  RuleGroupResponse,
  FormattedSensorReadingsResponse,
  ParticleDeviceStateResponse,
  SensorResponse,
  SensorSummariesResponse,
  ParticleManualTaskState,
  ParticleDosingRecipeState,
} from '@models';
import { SignalRService } from './signal-r.service';
import { environment } from '../../../environments/environment';
import * as moment from 'moment';

export const OFFLINE_THRESHOLD = 60;

@Injectable({
  providedIn: 'root',
})
export class ActiveControllerService {
  private controller: Controller;
  private activeRuleGroup = new BehaviorSubject<RuleGroupResponse>(null);
  private sensorReadings = new BehaviorSubject<FormattedSensorReadingsResponse[]>([]);
  private sensorMinimums = new BehaviorSubject<Map<string, number>>(new Map<string, number>());
  private sensorMaximums = new BehaviorSubject<Map<string, number>>(new Map<string, number>());
  private deviceStates = new BehaviorSubject<ParticleDeviceStateResponse[]>([]);
  private taskStates = new BehaviorSubject<ParticleManualTaskState[]>(null);
  private dosingRecipeStates = new BehaviorSubject<ParticleDosingRecipeState>(null);
  private controllerOffline = new BehaviorSubject<boolean>(false);

  protected deviceStatesTimer: number;
  protected sensorReadingsTimer: number;
  protected sensorSummariesTimer: number;
  protected taskStatesTimer: number;
  protected dosingRecipeStatesTimer: number;
  protected runTimers = true;
  protected refreshRate = 1000;
  protected sanityRefreshRate = 1000;

  public get IsIdle() { return this.signalR.Idle; }

  public controllerLastOnline = moment().subtract(OFFLINE_THRESHOLD - 10, 'seconds');

  constructor(private signalR: SignalRService, private http: HttpClient) {
    signalR.NewDeviceStatesHandler = (states) => {
      this.updateDeviceStates([states]);
    };
    signalR.NewDataPointsHandler = (readings) => {
      this.updateFormattedReadings(readings);
    };
    signalR.NewDosingRecipesHandler = (states) => {
      this.updateDosingRecipes(states);
    };
  }

  public updateController(controller: Controller) {
    if (this.controller === controller) {
      return;
    }

    if (this.controller && (this.controller.FirmwareVersion < 999 || !this.controller.FirmwareVersion)) {
      this.signalR.StopStreaming(this.controller.DeviceId);
    }

    this.controller = controller;
    this.sensorReadings.next([]);
    this.controllerLastOnline = moment().subtract(OFFLINE_THRESHOLD - 10, 'seconds');
    this.controllerOffline.next(false);

    if (!this.controller) {
      this.activeRuleGroup.next(null);
      this.stopTimers();
      return;
    }

    if (controller && (controller.FirmwareVersion < 999 || !controller.FirmwareVersion)) {
      this.signalR.StartStreaming(controller.DeviceId);
    }

    const activeRG = this.controller.RuleGroups.find((rg) => rg.IsActive);
    this.activeRuleGroup.next(activeRG);
    this.dosingRecipeStates.next(null);

    this.loadAllData();
  }

  public updateRefreshRate(rate: number) {
    this.refreshRate = rate;
  }

  public updateSanityRefreshRate(rate: number) {
    this.sanityRefreshRate = rate;
  }

  public bumpObservables() {
    this.activeRuleGroup.next(this.activeRuleGroup.value);
    this.controllerOffline.next(this.controllerOffline.value);
    this.sensorReadings.next(this.sensorReadings.value);
    this.sensorMinimums.next(this.sensorMinimums.value);
    this.sensorMaximums.next(this.sensorMaximums.value);
    this.deviceStates.next(this.deviceStates.value);
    this.taskStates.next(this.taskStates.value);
    this.dosingRecipeStates.next(this.dosingRecipeStates.value);
  }

  public updateActiveRuleGroup() {
    const activeRG = this.controller.RuleGroups.find((rg) => rg.IsActive);
    this.activeRuleGroup.next(activeRG);
  }

  public get ActiveRuleGroup(): Observable<RuleGroupResponse> {
    return this.activeRuleGroup.asObservable();
  }
  public get ControllerOffline(): Observable<boolean> {
    return this.controllerOffline.asObservable();
  }
  public get SensorReadings(): Observable<FormattedSensorReadingsResponse[]> {
    return this.sensorReadings.asObservable();
  }
  public get SensorMinimums(): Observable<Map<string, number>> {
    return this.sensorMinimums.asObservable();
  }
  public get SensorMaximums(): Observable<Map<string, number>> {
    return this.sensorMaximums.asObservable();
  }
  public get DeviceStates(): Observable<ParticleDeviceStateResponse[]> {
    return this.deviceStates.asObservable();
  }
  public get ManualTaskStates(): Observable<ParticleManualTaskState[]> {
    return this.taskStates.asObservable();
  }
  public get DosingRecipeStates(): Observable<ParticleDosingRecipeState> {
    return this.dosingRecipeStates.asObservable();
  }

  public RestartTimers(): void {
    this.stopTimers();
    this.loadAllData();
  }

  private loadAllData() {
    if (this.deviceStatesTimer) {
      window.clearTimeout(this.deviceStatesTimer);
    }
    if (this.sensorReadingsTimer) {
      window.clearTimeout(this.sensorReadingsTimer);
    }
    if (this.sensorSummariesTimer) {
      window.clearTimeout(this.sensorSummariesTimer);
    }
    if (this.taskStatesTimer) {
      window.clearTimeout(this.taskStatesTimer);
    }
    if (this.dosingRecipeStatesTimer) {
      window.clearTimeout(this.dosingRecipeStatesTimer);
    }

    this.runTimers = true;

    this.loadSensorReadings();
    this.loadDeviceStates();
    this.loadTaskStates();
    this.loadDosingRecipes();
    this.loadSensorSummaries();
  }

  private stopTimers() {
    this.runTimers = false;
    if (this.deviceStatesTimer) {
      window.clearTimeout(this.deviceStatesTimer);
    }
    if (this.sensorReadingsTimer) {
      window.clearTimeout(this.sensorReadingsTimer);
    }
    if (this.sensorSummariesTimer) {
      window.clearTimeout(this.sensorSummariesTimer);
    }
    if (this.taskStatesTimer) {
      window.clearTimeout(this.taskStatesTimer);
    }
    if (this.dosingRecipeStatesTimer) {
      window.clearTimeout(this.dosingRecipeStatesTimer);
    }
  }

  private loadSensorReadings(): void {
    if (environment.signalR) {
      this.signalR
        .GetControllerReadings(this.controller.DeviceId)
        .done((r) => {
          this.updateFormattedReadings(r);
          this.startLoadSensorReadings();
        })
        .fail((err) => {
          this.handleSignalRErrors(err);
          this.startLoadSensorReadings();
        });
    } else {
      this.getFormattedReadings().subscribe(
        (r) => {
          this.updateFormattedReadings(r);
          this.startLoadSensorReadings();
        },
        (err) => {
          this.handleErrors(err);
          this.startLoadSensorReadings();
        }
      );
    }
  }

  private loadDeviceStates(): void {
    if (environment.signalR) {
      this.signalR
        .GetControllerDeviceStates(this.controller.DeviceId)
        .done((r) => {
          this.updateDeviceStates(r);
          this.startLoadDeviceStates();
        })
        .fail((err) => {
          this.handleSignalRErrors(err);
          this.startLoadDeviceStates();
        });
    } else {
      this.getFormattedDeviceStates().subscribe(
        (r) => {
          this.updateDeviceStates(r);
          this.startLoadDeviceStates();
        },
        (err) => {
          this.handleErrors(err);
          this.startLoadDeviceStates();
        }
      );
    }
  }

  private loadSensorSummaries(): void {
    const newMin = new Map<string, number>();
    const newMax = new Map<string, number>();
    const allSensors = this.controller.Modules.reduce((all, mod) => {
      return all.concat(mod.Sensors);
    }, new Array<SensorResponse>());
    allSensors.forEach((sens) => {
      newMin.set(sens.Guid, sens.MinRange);
      newMax.set(sens.Guid, sens.MaxRange);
    });

    this.getSensorSummaries().subscribe(
      (results) => {
        results.forEach((summary) => {
          if (summary.MinValue >= summary.MaxValue) {
            return;
          }

          newMin.set(summary.SensorId, summary.MinValue);
          newMax.set(summary.SensorId, summary.MaxValue);
        });

        this.sensorMinimums.next(newMin);
        this.sensorMaximums.next(newMax);
      },
      (err) => {
        this.handleErrors(err);
        this.startLoadSensorSummaries();
      }
    );

    this.startLoadSensorSummaries();
  }

  private loadTaskStates(): void {
    if (this.controller.FirmwareVersion && this.controller.FirmwareVersion < 233 && this.controller.FirmwareVersion > 0) {
      this.startLoadTaskStates();
      return;
    }

    if (environment.signalR) {
      this.signalR
        .GetManualTasks(this.controller.DeviceId)
        .done((r) => {
          this.updateManualTaskStates(r);
          this.startLoadTaskStates();
        })
        .fail((err) => {
          this.handleSignalRErrors(err);
          this.startLoadTaskStates();
        });
    } else {
      this.getTaskStates().subscribe(
        (r) => {
          this.updateManualTaskStates(r);
          this.startLoadTaskStates();
        },
        (err) => {
          this.handleManualTaskErrors(err);
          this.startLoadTaskStates();
        }
      );
    }
  }

  private loadDosingRecipes(): void {
    if (environment.signalR) {
      this.signalR
        .GetActiveRecipes(this.controller.DeviceId)
        .done((r) => {
          this.updateDosingRecipes(r);
          if (!this.controller.SupportsStreaming) {
            this.startLoadDosingRecipes();
          }
        })
        .fail((err) => {
          this.handleSignalRErrors(err);
          if (!this.controller.SupportsStreaming) {
            this.startLoadDosingRecipes();
          }
        });
    } else {
      this.getDosingRecipeStates().subscribe(
        (r) => {
          this.updateDosingRecipes(r);
          this.startLoadDosingRecipes();
        },
        (err) => {
          this.handleManualTaskErrors(err);
          this.startLoadDosingRecipes();
        }
      );
    }
  }

  private startLoadSensorReadings(): void {
    if (this.sensorReadingsTimer) {
      window.clearTimeout(this.sensorReadingsTimer);
    }
    if (this.runTimers) {
      this.sensorReadingsTimer = window.setTimeout(() => {
        this.loadSensorReadings();
      }, this.refreshRate);
    }
  }
  private startLoadDeviceStates(): void {
    if (this.deviceStatesTimer) {
      window.clearTimeout(this.deviceStatesTimer);
    }
    if (this.runTimers) {
      this.deviceStatesTimer = window.setTimeout(() => {
        this.loadDeviceStates();
      }, this.sanityRefreshRate);
    }
  }
  private startLoadSensorSummaries(): void {
    if (this.sensorSummariesTimer) {
      window.clearTimeout(this.sensorSummariesTimer);
    }
    if (this.runTimers) {
      this.sensorSummariesTimer = window.setTimeout(() => {
        this.loadSensorSummaries();
      }, 60000 * 5);
    }
  }
  private startLoadTaskStates(): void {
    if (this.taskStatesTimer) {
      window.clearTimeout(this.taskStatesTimer);
    }
    if (this.runTimers) {
      this.taskStatesTimer = window.setTimeout(() => {
        this.loadTaskStates();
      }, this.refreshRate);
    }
  }
  private startLoadDosingRecipes(): void {
    if (this.dosingRecipeStatesTimer) {
      window.clearTimeout(this.dosingRecipeStatesTimer);
    }
    if (this.runTimers) {
      this.dosingRecipeStatesTimer = window.setTimeout(() => {
        this.loadDosingRecipes();
      }, 3000);
    }
  }

  private getFormattedReadings(): Observable<FormattedSensorReadingsResponse[]> {
    if (!this.controller || !this.controller.DeviceId) {
      return of([]);
    }

    return this.http
      .get<FormattedSensorReadingsResponse[]>(
        `api/FormattedDataPoints/?deviceId=${this.controller.DeviceId}`
      )
      .pipe(
        map((result) => {
          if (!result) {
            return [];
          }

          return result.map((v) => Object.assign(new FormattedSensorReadingsResponse(), v));
        })
      );
  }
  private updateFormattedReadings(readings: FormattedSensorReadingsResponse[]): void {
    this.controllerLastOnline = moment();
    this.controllerOffline.next(false);

    if (!readings || !readings.length) {
      return;
    }

    const existReadings = this.sensorReadings.getValue();
    readings.forEach((reading) => {
      const existReadingIdx = existReadings.findIndex((r) => r.sn === reading.sn && r.ssn === reading.ssn);
      if (existReadingIdx >= 0) {
        existReadings[existReadingIdx] = reading;
      } else {
        existReadings.push(reading);
      }
    });

    this.sensorReadings.next(existReadings);
  }
  private getFormattedDeviceStates(): Observable<ParticleDeviceStateResponse[]> {
    if (!this.controller || !this.controller.DeviceId) {
      return of([]);
    }

    const url = `api/FormattedDeviceStates?deviceId=${this.controller.DeviceId}`;

    return this.http.get<ParticleDeviceStateResponse[]>(url).pipe(
      map((result) => {
        if (!result) {
          return [];
        }

        return result.map((v) => Object.assign(new ParticleDeviceStateResponse(), v));
      })
    );
  }
  private updateDeviceStates(states: ParticleDeviceStateResponse[]): void {
    this.controllerLastOnline = moment();
    this.controllerOffline.next(false);

    if (!states || !states.length) {
      return;
    }

    const existStates = this.deviceStates.getValue();
    states.forEach((state) => {
      const existDeviceIdx = existStates.findIndex((r) => r.sn === state.sn);
      if (existDeviceIdx >= 0) {
        const existState = existStates[existDeviceIdx];
        for (const key in existState) {

          if (Object.prototype.hasOwnProperty.call(state, key) && state[key] !== null && state[key] !== existState[key]) {
            // console.log(`updating ${key} from ${existState[key]} to ${state[key]}`);
            existState[key] = state[key];
          }
        }
      } else {
        existStates.push(state);
      }
    });

    this.deviceStates.next(existStates);
  }

  private getDosingRecipeStates(): Observable<ParticleDosingRecipeState> {
    if (!this.controller || !this.controller.DeviceId) {
      return of(null);
    }

    const url = `api/ControllerVariables?deviceId=${this.controller.DeviceId}&variableName=dosingRecipes`;

    return this.http.get<ParticleDosingRecipeState>(url).pipe(
      map((result) => {
        if (!result) {
          return null;
        }

        return Object.assign(new ParticleDosingRecipeState(), result);
      })
    );
  }
  private updateDosingRecipes(states: ParticleDosingRecipeState): void {
    this.controllerLastOnline = moment();
    this.controllerOffline.next(false);

    if (!states || !states.r || !states.r.length) {
      return;
    }

    const existStates = this.dosingRecipeStates.getValue();
    // console.log('updateDosingRecipes - existStates', existStates, states);
    if (!existStates || !existStates.r) {
      // console.log('updateDosingRecipes - Setting states', states);
      this.dosingRecipeStates.next(states);
      return;
    }

    states.r.forEach((state) => {
      const existDeviceIdx = existStates.r.findIndex((r) => r.id === state.id);
      if (existDeviceIdx >= 0) {
        const existState = existStates.r[existDeviceIdx];
        // console.log('updateDosingRecipes - existState', existState, state);
        for (const key in existState) {

          if (Object.prototype.hasOwnProperty.call(state, key) && state[key] !== null && state[key] !== existState[key]) {
            // console.log(`updating ${key} from ${existState[key]} to ${state[key]}`);
            existState[key] = state[key];
          }
        }
      } else {
        existStates.r.push(state);
      }
    });

    this.dosingRecipeStates.next(existStates);
  }

  protected getSensorSummaries(): Observable<SensorSummariesResponse[]> {
    if (!this.controller || !this.controller.Guid) {
      return of([]);
    }

    const url = `api/SensorReadingSummaries?controllerId=${this.controller.Guid}&moduleId=`;

    return this.http.get<SensorSummariesResponse[]>(url);
  }
  private getTaskStates(): Observable<ParticleManualTaskState[]> {
    if (!this.controller || !this.controller.DeviceId) {
      return of([]);
    }

    const url = `api/ControllerVariables?deviceId=${this.controller.DeviceId}&variableName=manualTasks`;

    return this.http.get<ParticleManualTaskState[]>(url).pipe(
      map((result) => {
        if (!result) {
          return [];
        }

        return result.map((v) => Object.assign(new ParticleManualTaskState(), v));
      })
    );
  }
  private updateManualTaskStates(states: ParticleManualTaskState[]): void {
    this.controllerLastOnline = moment();
    this.controllerOffline.next(false);

    this.taskStates.next(states);
  }

  protected handleManualTaskErrors(err: any) {
    if (err && err instanceof Error && err.message === 'The controller could not be reached.') {
      return;
    }

    this.handleErrors(err);
  }

  protected handleSignalRErrors(err: any) {
    if (err instanceof Error) {
      if (
        err.message.toLowerCase() ===
        'connection was disconnected before invocation result was received.'
      ) {
        // console.log('trapped signalr connection error');
        return;
      }
    }

    this.handleErrors(err);
  }

  protected handleErrors(err: any) {
    if (!err) {
      return;
    }

    if (err instanceof HttpErrorResponse) {
      if (err.status === 404) {
        if (moment().diff(this.controllerLastOnline, 'seconds') > OFFLINE_THRESHOLD) {
          this.controllerOffline.next(true);
        }
        return;
      }
      return;
    }
    if (err && err.message && err.message === 'The operation was canceled.') {
      return;
    }
    if (err && err instanceof Error && err.message === 'The controller could not be reached.') {
      if (moment().diff(this.controllerLastOnline, 'seconds') >= OFFLINE_THRESHOLD) {
        this.controllerOffline.next(true);
      }
      return;
    }

    console.log(err);
  }
}
