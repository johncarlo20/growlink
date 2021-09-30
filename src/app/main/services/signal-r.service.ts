import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';
import 'signalr';

import {
  FormattedSensorReadingsResponse,
  ParticleDeviceStateResponse,
  ParticleManualTaskState,
  ParticleDosingRecipeState,
} from '@models';
import { UserPreferencesService } from './userpreferences.service';
import { AuthenticationService } from './authentication.service';
import { DeviceStates } from './controller.service';
import { environment } from '../../../environments/environment';
import { ConfigUpdateToastComponent } from '../config-update-toast/config-update-toast.component';
import { takeWhile } from 'rxjs/operators';
import { isArray } from 'lodash';

export type SnackbarCallback = (message: string, config: MatSnackBarConfig) => void;
export type NewDataPointsCallback = (dp: FormattedSensorReadingsResponse[]) => void;
export type NewDeviceStatesCallback = (dp: ParticleDeviceStateResponse) => void;
export type NewDosingRecipesCallback = (dp: ParticleDosingRecipeState) => void;

const KEEP_ALIVE = 20000;

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  connection: SignalR.Hub.Connection;
  userApiHub: SignalR.Hub.Proxy;
  readingsHub: SignalR.Hub.Proxy;
  interactHub: SignalR.Hub.Proxy;
  streamingHub: SignalR.Hub.Proxy;
  notificationsHub: SignalR.Hub.Proxy;

  NewDataPointsHandler: NewDataPointsCallback = null;
  NewDeviceStatesHandler: NewDeviceStatesCallback = null;
  NewDosingRecipesHandler: NewDosingRecipesCallback = null;

  private orgSubscription = new BehaviorSubject<string>(null);

  private connected = new BehaviorSubject<boolean>(false);
  private idle = new BehaviorSubject<boolean>(false);
  private configSnackOptions: MatSnackBarConfig = {
    horizontalPosition: 'center',
    verticalPosition: 'top',
  };
  private configAutoSnackOptions: MatSnackBarConfig = {
    horizontalPosition: 'center',
    verticalPosition: 'top',
    duration: 10000,
  };
  private configSnackRef: MatSnackBarRef<ConfigUpdateToastComponent>;
  private configSnackTimeout?: number;
  private firmwareSnackRef: MatSnackBarRef<ConfigUpdateToastComponent>;
  private apiPing: number;
  private active = false;
  private currentlyStreaming: string[] = [];

  constructor(
    public prefs: UserPreferencesService,
    private authenticationService: AuthenticationService,
    private snackbar: MatSnackBar,
    private zone: NgZone
  ) {
    this.connection = $.hubConnection();
    this.userApiHub = this.connection.createHubProxy('UserApiHub');
    this.readingsHub = this.connection.createHubProxy('ControllerReadings');
    this.interactHub = this.connection.createHubProxy('ControllerInteractions');
    this.streamingHub = this.connection.createHubProxy('ControllerStreaming');
    this.notificationsHub = this.connection.createHubProxy('Notifications');
    this.streamingHub.on('streamingStarted', (deviceId) => {
      console.log(`Streaming started - ${deviceId}`);
    });
    this.streamingHub.on('streamingEnded', (deviceId) => {
      console.log(`Streaming ended - ${deviceId}`);
    });
    this.streamingHub.on('newDataPoints', (_deviceId, dataPoints: FormattedSensorReadingsResponse | FormattedSensorReadingsResponse[]) => {
      if (this.NewDataPointsHandler !== null) {
        if (isArray(dataPoints)) {
          for (let idx = 0; idx < dataPoints.length; idx++) {
            const element = dataPoints[idx];
            dataPoints[idx] = Object.assign(new FormattedSensorReadingsResponse(), element);
          }
          this.NewDataPointsHandler(dataPoints);
        } else {
          this.NewDataPointsHandler([Object.assign(new FormattedSensorReadingsResponse(), dataPoints)]);
        }
      }
    });
    this.streamingHub.on('newDeviceStates', (_deviceId, devStates) => {
      if (this.NewDeviceStatesHandler !== null) {
        const newStates = Object.assign(new ParticleDeviceStateResponse(), devStates);
        this.NewDeviceStatesHandler(newStates);
      }
    });
    this.streamingHub.on('newDosingRecipes', (_deviceId, recipeStates) => {
      if (this.NewDosingRecipesHandler !== null) {
        const newStates = Object.assign(new ParticleDosingRecipeState(), recipeStates);
        this.NewDosingRecipesHandler(newStates);
      }
    });
    this.streamingHub.on('configAPILoading', (deviceId) => {
      console.log(`Configuration API Loading started - ${deviceId}`);
      this.configStarted('Controller configuration update started...');
    });
    this.streamingHub.on('configStorageLoading', (deviceId) => {
      console.log(`Configuration Storage Loading started - ${deviceId}`);
      this.configStarted('Load from API failed; loading previous configuration from memory...');
    });
    this.streamingHub.on('configAPICompleted', (deviceId, success) => {
      console.log(`Configuration API Loading completed - ${deviceId}`, success);
      this.configCompleteHandler(success);
    });
    this.streamingHub.on('configStorageCompleted', (deviceId, success) => {
      console.log(`Configuration Storage Loading completed - ${deviceId}`, success);
      this.configCompleteHandler(success);
    });
    this.streamingHub.on('firmwareUpdateStatus', (deviceId, state) => {
      console.log(`Firmware Update status - ${deviceId}`, state);
      switch (state) {
        case 'started':
          this.firmwareUpdateStarted();
          break;
        case 'success':
          this.firmwareUpdateCompleteHandler(true);
          break;
        case 'update_timeout':
          this.firmwareUpdateCompleteHandler(false);
          break;
      }
    });
    this.streamingHub.on('organizationSubscriptionUpdate', (organizationId) => {
      console.log(`Organization Subscription Status Update`, organizationId);
      this.orgSubscription.next(organizationId);
    });
    this.connection.url = `${environment.api}/signalr/`;
    this.connection.reconnected(() => {
      console.debug(`SignalR Reconnected (${this.connection.id})`);
      this.connected.next(true);
      if (!this.apiPing) {
        this.apiPing = window.setInterval(() => this.ping(), KEEP_ALIVE);
      }
      this.restartStreaming();
    });
    this.connection.disconnected(() => {
      console.debug(`SignalR Disconnected (${this.connection.id})`);
      this.connected.next(false);

      if (this.apiPing) {
        window.clearInterval(this.apiPing);
        this.apiPing = null;
      }

      if (this.active) {
        window.setTimeout(() => {
          this.connect();
        }, 5000);
      }
    });

    if (!environment.production) {
      this.connection.logging = true;
    }

    this.prefs.userPrefs.subscribe((userPrefs) => {
      console.debug('reconnect SignalR for unit changes');
      this.reconnect();
    });

    this.authenticationService.updatedToken.subscribe((token) => {
      if (!token) {
        this.disconnect();
      }
    });
  }

  private ping() {
    this.userApiHub
      .invoke('echo')
      .done((result) => {
        // console.debug('echo result', result);
        if (!this.connected.value) {
          this.connected.next(true);
        }
      })
      .fail((err) => {
        console.error(`SignalR echo error`, err);
        if (this.connected.value) {
          this.connected.next(false);
        }
      });
  }

  private configStarted(message: string) {
    this.zone.run(() => {
      this.clearConfigSnackbar();
      this.configSnackRef = this.snackbar.openFromComponent(ConfigUpdateToastComponent, {
        ...this.configSnackOptions,
        data: message,
      });
      if (this.configSnackTimeout) {
        window.clearTimeout(this.configSnackTimeout);
      }
      this.configSnackTimeout = window.setTimeout(() => {
        this.configTimeoutHandler();
      }, 60000);
    });
  }

  private configCompleteHandler(success: boolean) {
    const message = success ? `Configuration update completed.` : `Configuration update failed.`;
    const options = success ? this.configAutoSnackOptions : this.configSnackOptions;
    this.zone.run(() => {
      this.clearConfigSnackbar();
      this.snackbar.open(message, 'Dismiss', options);
      if (this.configSnackTimeout) {
        window.clearTimeout(this.configSnackTimeout);
      }
    });
  }

  private configTimeoutHandler() {
    this.clearConfigSnackbar();
    this.snackbar.open(
      'Controller configuration update confirmation timed out.',
      'Dismiss',
      this.configSnackOptions
    );
    if (this.configSnackTimeout) {
      window.clearTimeout(this.configSnackTimeout);
    }
    this.configSnackTimeout = null;
  }

  private firmwareUpdateStarted() {
    this.zone.run(() => {
      this.clearFirmwareSnackbar();
      this.firmwareSnackRef = this.snackbar.openFromComponent(ConfigUpdateToastComponent, {
        ...this.configSnackOptions,
        data: 'Firmware update in process...',
      });
    });
  }

  private firmwareUpdateCompleteHandler(success: boolean) {
    const message = success ? `Firmware update complete.` : `Firmware update timed out.`;
    const options = success ? this.configAutoSnackOptions : this.configSnackOptions;
    this.zone.run(() => {
      this.clearFirmwareSnackbar();
      this.snackbar.open(message, 'Dismiss', options);
    });
  }

  private clearConfigSnackbar() {
    if (this.configSnackRef) {
      this.configSnackRef.dismiss();
      this.configSnackRef = null;
    }
  }
  private clearFirmwareSnackbar() {
    if (this.firmwareSnackRef) {
      this.firmwareSnackRef.dismiss();
      this.firmwareSnackRef = null;
    }
  }

  public get Connected(): Observable<boolean> {
    return this.connected.asObservable();
  }
  public get Idle(): Observable<boolean> {
    return this.idle.asObservable();
  }
  public get OrganizationSubscription(): Observable<string> {
    return this.orgSubscription.asObservable();
  }
  public get Active(): boolean {
    return this.active;
  }

  public SetIdle(isIdle: boolean): void {
    if (isIdle !== this.idle.value) {
      this.idle.next(isIdle);
    }
  }

  private start(token: string) {
    this.connection.qs = {
      access_token: token,
      tempUnitOfMeasure: this.prefs.currentUserPrefs.temp,
      tdsUnitOfMeasure: this.prefs.currentUserPrefs.tds,
      lightLevelUnitOfMeasure: this.prefs.currentUserPrefs.lightLevel,
      vpdUnitOfMeasure: this.prefs.currentUserPrefs.vpd,
    };

    this.connection
      .start()
      .done(() => {
        console.debug(`SignalR Connected (${this.connection.id})`);
        this.connected.next(true);
        if (!this.apiPing) {
          this.apiPing = window.setInterval(() => this.ping(), KEEP_ALIVE);
        }
        this.restartStreaming();
      })
      .always(() => {
        this.active = true;
      })
      .fail((err) => {
        console.error(`SignalR error`, err);
      });
  }

  private restartStreaming() {
    console.debug(`currentlyStreaming`, this.currentlyStreaming);
    if (this.currentlyStreaming.length) {
      this.currentlyStreaming.forEach(controllerId => this.streamingHub.invoke('StartStreaming', controllerId));
    }
  }

  private connect() {
    if (this.authenticationService.token) {
      this.start(this.authenticationService.token);
    }
  }

  private disconnect() {
    if (this.connection.state === SignalR.ConnectionState.Connected) {
      this.active = false;
      this.connection.stop();
    }
  }

  public reconnect() {
    this.disconnect();
    this.connect();
  }

  public GetControllerReadings(controllerId: string) {
    if (this.connection.state !== SignalR.ConnectionState.Connected) {
      return $.Deferred().reject();
    }

    if (!controllerId) {
      return $.Deferred().resolve([]);
    }

    return this.readingsHub
      .invoke('GetReadings', controllerId)
      .pipe((result: FormattedSensorReadingsResponse[]) => {
        if (!result) {
          return [];
        }

        return result.map((v) => Object.assign(new FormattedSensorReadingsResponse(), v));
      });
  }

  public GetControllerDeviceStates(controllerId: string) {
    if (this.connection.state !== SignalR.ConnectionState.Connected) {
      return $.Deferred().reject();
    }

    if (!controllerId) {
      return $.Deferred().resolve([]);
    }

    return this.readingsHub
      .invoke('GetStates', controllerId)
      .then((result: ParticleDeviceStateResponse[]) => {
        if (!result) {
          return [];
        }

        return result.map((s) => Object.assign(new ParticleDeviceStateResponse(), s));
      });
  }

  public GetManualTasks(controllerId: string): JQueryPromise<ParticleManualTaskState[]> {
    if (this.connection.state !== SignalR.ConnectionState.Connected) {
      return $.Deferred().reject().promise();
    }

    if (!controllerId) {
      return $.Deferred().resolve([]).promise();
    }

    return this.readingsHub
      .invoke('GetManualTasks', controllerId)
      .then((result: ParticleManualTaskState[]) => {
        if (!result) {
          return null;
        }

        return result.map((s) => Object.assign(new ParticleManualTaskState(), s));
      });
  }

  public GetActiveRecipes(controllerId: string): JQueryPromise<ParticleDosingRecipeState> {
    if (this.connection.state !== SignalR.ConnectionState.Connected) {
      return $.Deferred().reject().promise();
    }

    if (!controllerId) {
      return $.Deferred().resolve(null).promise();
    }

    return this.readingsHub
      .invoke('GetDosingRecipeStates', controllerId)
      .then((result: ParticleDosingRecipeState) => {
        if (!result) {
          return null;
        }

        return result;
      });
  }

  public StartTask(controllerId: string, taskId: number, duration: number) {
    const postArgs = `${taskId},${duration}`;

    if (this.connection.state !== SignalR.ConnectionState.Connected) {
      return $.Deferred().reject();
    }

    return this.controllerCall(controllerId, 'startTask', postArgs);
  }
  public UpdateDeviceState(
    controllerId: string,
    serialNumber: string,
    device: number,
    state: DeviceStates
  ) {
    const postArgs = `${serialNumber},${device},${state}`;

    return this.controllerCall(controllerId, 'switchDevice', postArgs);
  }

  public GetUnreadCount() {
    if (this.connection.state !== SignalR.ConnectionState.Connected) {
      return $.Deferred().reject();
    }

    return this.notificationsHub.invoke('GetUnreadCount').then((result: number) => {
      if (!result) {
        return 0;
      }

      return result;
    });
  }

  public MarkAllRead() {
    if (this.connection.state !== SignalR.ConnectionState.Connected) {
      return $.Deferred().reject();
    }

    return this.notificationsHub.invoke('MarkAllRead');
  }

  public ToggleRead(notificationId: string, seen: boolean) {
    if (this.connection.state !== SignalR.ConnectionState.Connected) {
      return $.Deferred().reject();
    }

    return this.notificationsHub.invoke('ToggleRead', notificationId, seen);
  }

  public StartStreaming(controllerId: string): void {
    this.connected.pipe(takeWhile((c) => c === false, true)).subscribe((connected) => {
      if (connected) {
        this.streamingHub.invoke('StartStreaming', controllerId);
        this.currentlyStreaming.push(controllerId);
      }
    });
  }

  public StopStreaming(controllerId: string): void {
    this.clearConfigSnackbar();
    if (this.configSnackTimeout) {
      window.clearTimeout(this.configSnackTimeout);
    }

    this.connected.pipe(takeWhile((c) => c === false, true)).subscribe((connected) => {
      if (connected) {
        this.streamingHub.invoke('StopStreaming', controllerId);
        const controllerIdx = this.currentlyStreaming.indexOf(controllerId);
        if (controllerIdx > -1) {
          this.currentlyStreaming.splice(controllerIdx, 1);
        }
      }
    });
  }

  private controllerCall(controllerId: string, functionName: string, postArgs: string) {
    return this.interactHub.invoke('ControllerCall', controllerId, functionName, postArgs);
  }
}
