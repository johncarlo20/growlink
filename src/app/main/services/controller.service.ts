import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { tap, map, finalize, take, catchError } from 'rxjs/operators';

import {
  Controller,
  ControllerResponse,
  ModuleResponse,
  DeviceSensorTriggerResponse,
  DeviceScheduleResponse,
  DeviceTimerResponse,
  SensorAlertResponse,
  ManualTaskResponse,
  RuleGroup,
  DeviceResponse,
  SensorResponse,
  DosingRecipe,
  UserPrefs,
  SensorSummariesResponse,
  NewModulesResponse,
  ProductRegistration,
  ProductInventoryResponse,
  OrgDashboardControllerResponse,
  OrgDashboardControllerDevicesResponse,
  UnitOfMeasure,
  ParticleManualTaskState,
  CropSteeringProgramResponse,
  CropSteeringProgramRequest,
  CropSteeringShot,
} from '@models';
import { UserPreferencesService } from './userpreferences.service';
import { ProgressBarService } from './progress-bar.service';
import { ActiveControllerService } from './active-controller.service';

export type DeviceStates = 'true' | 'false' | 'auto' | number;

@Injectable()
export class ControllerService implements Resolve<any> {
  private allControllers = new BehaviorSubject<ControllerResponse[]>([]);
  private controller = new BehaviorSubject<Controller>(new Controller());
  private containersPath = 'api/containers';
  private controllersPath = 'api/controllers';
  private variablesPath = 'api/ControllerVariables';
  private deviceSensorTriggerPath = 'api/DeviceSensorTriggers';
  private deviceSchedulePath = 'api/DeviceSchedules';
  private deviceTimerPath = 'api/DeviceTimers';
  private sensorAlertPath = 'api/SensorAlerts';
  private manualTaskPath = 'api/ManualTasks';
  private dosingRecipePath = 'api/DosingRecipes';
  private controllerSettingsPath = 'api/ContainerSettings';
  private orgDashboardReadingsPath = 'api/OrgDashboardReadings';
  private orgDashboardStatesPath = 'api/OrgDashboardDeviceStates';
  private orgDashboardTaskStatesPath = 'api/OrgDashboardManualTaskStates';
  private sensorReadingSummariesPath = 'api/SensorReadingSummaries';
  private unregisteredModulesPath = 'api/UnregisteredModules';
  private productRegistrationPath = 'api/ProductRegistrations';
  private productInventoriesPath = 'api/ProductInventories';
  private cropSteeringPath = 'api/CropSteering';
  private modulesPath = 'api/Modules';
  private userPrefs: UserPrefs;
  private _loadingController = false;

  public get currentContainer() {
    return this.controller.asObservable();
  }
  public get instanceContainer() {
    return this.controller.getValue();
  }

  public get IsControllerLoading() {
    return this._loadingController;
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private userPrefsService: UserPreferencesService,
    private activeControllerService: ActiveControllerService,
    private progressBarService: ProgressBarService
  ) {
    this.userPrefsService.userPrefs.subscribe((p) => {
      this.userPrefs = p;
      this.setCurrentController(this.instanceContainer.Guid, true).subscribe();
    });
    this.controller.subscribe((c) => this.activeControllerService.updateController(c));

    this.allControllers.subscribe((all) => {
      if (!this.controller.value) {
        return;
      }

      const controller = { ...this.controller.value };
      const exist = all.find((d) => d.DeviceId === controller.DeviceId);
      controller.isReadOnly = exist ? exist.IsReadOnly : true;
      controller.EnableHighFrequencyJournalData = exist ? exist.EnableHighFrequencyJournalData : false;
      controller.SupportsCropSteering = exist ? exist.SupportsCropSteering : false;
      console.log('exist', exist, controller);
      this.controller.next(controller);
    });
  }

  /**
   * Resolve
   * @param {ActivatedRouteSnapshot} route
   * @param {RouterStateSnapshot} state
   * @returns {Observable<any> | Promise<any> | any}
   */
  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    return this.setCurrentController(route.paramMap.get('guid')).pipe(
      catchError((error) => {
        console.error(error);
        this.router.navigate(['/home']);
        return of(null);
      })
    );
  }

  loadControllers(): Observable<ControllerResponse[]> {
    this.progressBarService.SetLoading(true);
    return this.http.get<ControllerResponse[]>(this.controllersPath).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map((r) => {
        return r.filter((c) => c.HasPaidSubscription);
      }),
      tap((r) => {
        this.allControllers.next(r);
      })
    );
  }

  getControllers(): Observable<ControllerResponse[]> {
    return this.allControllers.asObservable();
  }

  get AllControllers(): Observable<ControllerResponse[]> {
    return this.allControllers.asObservable();
  }

  findController(controllerId: string): ControllerResponse {
    const curControllers = this.allControllers.value;
    return curControllers.find((controller) => controller.Id === controllerId);
  }

  removeController(controllerId: string) {
    const curControllers = this.allControllers.value;
    const controllerIdx = curControllers.findIndex((exist) => exist.Id === controllerId);
    if (controllerIdx < 0) {
      return;
    }

    curControllers.splice(controllerIdx, 1);
    this.allControllers.next(curControllers);
  }

  getContainers(enableRules = false): Observable<Controller[]> {
    this.progressBarService.SetLoading(true);
    return this.http
      .get<Controller[]>(
        `${this.containersPath}${enableRules ? '?enableControllerLevelRules=true' : ''}`
      )
      .pipe(
        tap((cs) => cs.forEach(c => c.Units = {...this.userPrefs})),
        finalize(() => this.progressBarService.SetLoading(false))
      );
    // return fromPromise(fetch('assets/temp-containers-stephen.json').then(res => res.json())).pipe(
    //   finalize(() => this.progressBarService.SetLoading(false)),
    // );
  }

  private getContainer(guid: string): Observable<Controller> {
    if (!guid) {
      return of(null);
    }

    this.progressBarService.SetLoading(true);
    return this.http
      .get<Controller>(`${this.containersPath}/${guid}/?enableControllerLevelRules=true`)
      .pipe(
        finalize(() => this.progressBarService.SetLoading(false))
      );
  }

  setCurrentController(guid: string, forceReload = false): Observable<Controller> {
    if (!guid) {
      this.updateController(null);
      return of(null).pipe(take(1));
    }

    let loadingSub: Observable<Controller>;
    if (!forceReload && this.controller.value && this.controller.value.Guid === guid) {
      loadingSub = of(this.controller.value);
    } else {
      loadingSub = this.getContainer(guid);
      this._loadingController = true;
    }

    return loadingSub.pipe(
      tap((c) => c.Units = {...this.userPrefs}),
      tap(c => this.updateController(c)),
      take(1)
    );
  }

  getOrgDashboardReadings(firstRun = false): Observable<OrgDashboardControllerResponse[]> {
    const url = `${this.orgDashboardReadingsPath}`;
    if (firstRun) {
      this.progressBarService.SetLoading(true);
    }

    return this.http.get<OrgDashboardControllerResponse[]>(url).pipe(
      map((r) => r || []),
      finalize(() => {
        if (firstRun) {
          this.progressBarService.SetLoading(false);
        }
      })
    );
  }

  getOrgDashboardStates(firstRun = false): Observable<OrgDashboardControllerDevicesResponse[]> {
    const url = `${this.orgDashboardStatesPath}`;
    if (firstRun) {
      this.progressBarService.SetLoading(true);
    }

    return this.http.get<OrgDashboardControllerDevicesResponse[]>(url).pipe(
      map((r) => r || []),
      finalize(() => {
        if (firstRun) {
          this.progressBarService.SetLoading(false);
        }
      })
    );
  }

  getOrgManualTaskStates(organizationId: string, dashboardId: string, firstRun = false): Observable<ParticleManualTaskState[]> {
    if (!organizationId) {
      return of([]);
    }

    const url = `${this.orgDashboardTaskStatesPath}?organizationId=${organizationId}&dashboardId=${dashboardId}`;
    if (firstRun) {
      this.progressBarService.SetLoading(true);
    }

    return this.http.get<ParticleManualTaskState[]>(url).pipe(
      map((r) => r || []),
      finalize(() => {
        if (firstRun) {
          this.progressBarService.SetLoading(false);
        }
      })
    );
  }

  getSensorSummaries(controllerId: string): Observable<SensorSummariesResponse[]> {
    if (!controllerId) {
      return of([]);
    }

    const url = `${this.sensorReadingSummariesPath}?controllerId=${controllerId}&moduleId=`;

    return this.http.get<SensorSummariesResponse[]>(url);
  }

  updateDeviceState(
    serialNumber: string,
    device: number,
    state: DeviceStates
  ): Observable<boolean> {
    if (this.instanceContainer.DeviceId) {
      const postArgs = `${serialNumber},${device},${state}`;

      return this.updateControllerConfig('switchDevice', postArgs);
    }

    return new Observable<boolean>();
  }

  updateSensorCalibration(
    serialNumber: string,
    sensor: number,
    calibrationValue: number,
    calibrationTimestamp: number
  ): Observable<boolean> {
    if (this.instanceContainer.DeviceId) {
      const postArgs = `${serialNumber},${sensor},${calibrationValue},${calibrationTimestamp}`;

      return this.updateControllerConfig('calibrate', postArgs);
    }

    return new Observable<boolean>();
  }

  updateDevice(device: DeviceResponse): Observable<boolean> {
    if (this.instanceContainer.DeviceId) {
      this.progressBarService.SetLoading(true);
      return this.http.put(`api/Devices/${device.Guid}`, device).pipe(
        finalize(() => this.progressBarService.SetLoading(false)),
        map(() => true)
      );
    }
    return new Observable<boolean>();
  }

  updateSensor(sensor: SensorResponse): Observable<boolean> {
    if (this.instanceContainer.DeviceId) {
      this.progressBarService.SetLoading(true);
      return this.http.put(`api/Sensors/${sensor.Guid}/`, sensor).pipe(
        finalize(() => this.progressBarService.SetLoading(false)),
        map(() => true)
      );
    }
    return new Observable<boolean>();
  }

  updateModule(module: ModuleResponse): Observable<boolean> {
    if (this.instanceContainer.DeviceId) {
      this.progressBarService.SetLoading(true);
      return this.http.put(`api/Modules/${module.Guid}`, module).pipe(
        finalize(() => this.progressBarService.SetLoading(false)),
        map(() => true)
      );
    }
    return new Observable<boolean>();
  }

  updateConfig(): Observable<boolean> {
    if (this.instanceContainer.DeviceId) {
      return this.updateControllerConfig('updateConfig', null);
    }
    return new Observable<boolean>();
  }

  updateAdditionalConfig(deviceId: string): Observable<boolean> {
    return this.updateControllerConfig('updateConfig', null, deviceId);
  }

  createDeviceSensorTrigger(
    trigger: DeviceSensorTriggerResponse
  ): Observable<DeviceSensorTriggerResponse> {
    this.progressBarService.SetLoading(true);
    return this.http
      .post<DeviceSensorTriggerResponse>(`${this.deviceSensorTriggerPath}/`, trigger)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  updateDeviceSensorTrigger(trigger: DeviceSensorTriggerResponse): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.put(`${this.deviceSensorTriggerPath}/${trigger.Id}/`, trigger).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  deleteDeviceSensorTrigger(triggerId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.delete(`${this.deviceSensorTriggerPath}/${triggerId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  createDeviceSchedule(schedule: DeviceScheduleResponse): Observable<DeviceScheduleResponse> {
    this.progressBarService.SetLoading(true);
    return this.http
      .post<DeviceScheduleResponse>(this.deviceSchedulePath, schedule)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  updateDeviceSchedule(schedule: DeviceScheduleResponse): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.put(`${this.deviceSchedulePath}/${schedule.Id}`, schedule).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  deleteDeviceSchedule(scheduleId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.delete(`${this.deviceSchedulePath}/${scheduleId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  createDeviceTimer(timer: DeviceTimerResponse): Observable<DeviceTimerResponse> {
    this.progressBarService.SetLoading(true);
    return this.http
      .post<DeviceTimerResponse>(this.deviceTimerPath, timer)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  updateDeviceTimer(timer: DeviceTimerResponse): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.put(`${this.deviceTimerPath}/${timer.Id}`, timer).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  deleteDeviceTimer(timerId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.delete(`${this.deviceTimerPath}/${timerId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  getSensorAlert(alertId: string): Observable<SensorAlertResponse> {
    this.progressBarService.SetLoading(true);
    return this.http
      .get<SensorAlertResponse>(`${this.sensorAlertPath}/${alertId}`)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  createSensorAlert(alert: SensorAlertResponse): Observable<SensorAlertResponse> {
    this.progressBarService.SetLoading(true);
    return this.http
      .post<SensorAlertResponse>(`${this.sensorAlertPath}/`, alert)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  updateSensorAlert(alert: SensorAlertResponse): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.put(`${this.sensorAlertPath}/${alert.Id}/`, alert).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  deleteSensorAlert(alertId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.delete(`${this.sensorAlertPath}/${alertId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  getOrgManualTasks(organizationId: string): Observable<ManualTaskResponse[]> {
    if (!organizationId) {
      return of([]);
    }

    const url = `${this.manualTaskPath}?organizationId=${organizationId}`;

    this.progressBarService.SetLoading(true);
    return this.http
      .get<ManualTaskResponse[]>(url)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  createManualTask(task: ManualTaskResponse): Observable<ManualTaskResponse> {
    this.progressBarService.SetLoading(true);
    return this.http
      .post<ManualTaskResponse>(this.manualTaskPath, task)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  updateManualTask(task: ManualTaskResponse): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.put(`${this.manualTaskPath}/${task.Id}`, task).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  deleteManualTask(taskId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.delete(`${this.manualTaskPath}/${taskId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  getCropSteeringPrograms(ruleGroupId: string): Observable<CropSteeringProgramResponse[]> {
    const url = `${this.cropSteeringPath}/RuleGroup/${ruleGroupId}`;

    this.progressBarService.SetLoading(true);
    return this.http
      .get<CropSteeringProgramResponse[]>(url)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }
  getCropSteeringProgram(programId: string): Observable<CropSteeringProgramResponse> {
    const url = `${this.cropSteeringPath}/${programId}`;

    this.progressBarService.SetLoading(true);
    return this.http
      .get<CropSteeringProgramResponse>(url)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }
  validateCropSteeringProgram(program: CropSteeringProgramRequest): Observable<boolean> {
    return this.http.post(`${this.cropSteeringPath}/Validate`, program).pipe(
      map(() => true)
    );
  }
  createCropSteeringProgram(program: CropSteeringProgramRequest): Observable<string> {
    this.progressBarService.SetLoading(true);
    return this.http.post(`${this.cropSteeringPath}`, program).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map((result: {id: string}) => result.id)
    );
  }
  updateCropSteeringProgram(programId: string, program: CropSteeringProgramRequest): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.put(`${this.cropSteeringPath}/${programId}`, program).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }
  deleteCropSteeringProgram(programId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.delete(`${this.cropSteeringPath}/${programId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  updateSettings(controller: Controller, tempUnit: UnitOfMeasure): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.put(`${this.controllerSettingsPath}/${controller.Guid}?tempUnitOfMeasure=${tempUnit}`, controller).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      tap(() => this.updateController(controller)),
      map(() => true)
    );
  }

  getAlertDescription(alert: SensorAlertResponse): Observable<string> {
    const url = `api/AlertDescriptions?use24HourTimeFormat=${this.userPrefs.prefer24Hour}`;

    return this.http.post<string>(url, alert).pipe(map((r) => r || ''));
  }

  getScheduleDescription(schedule: DeviceScheduleResponse): Observable<string> {
    const url = `api/ScheduleDescriptions?use24HourTimeFormat=${this.userPrefs.prefer24Hour}`;

    return this.http.post<string>(url, schedule).pipe(map((r) => r || ''));
  }

  getTimerDescription(timer: DeviceTimerResponse): Observable<string> {
    const url = `api/TimerDescriptions?use24HourTimeFormat=${this.userPrefs.prefer24Hour}`;

    return this.http.post<string>(url, timer).pipe(map((r) => r || ''));
  }

  getTriggerDescription(trigger: DeviceSensorTriggerResponse): Observable<string> {
    const url = `api/SensorTriggerDescriptions?use24HourTimeFormat=${this.userPrefs.prefer24Hour}`;

    return this.http.post<string>(url, trigger).pipe(map((r) => r || ''));
  }

  getManualTaskDescription(task: ManualTaskResponse): Observable<string> {
    return of(`Activate for ${task.Duration}`);
    // const url = 'api/TimerDescriptions';

    // return this.http.post<string>(url, task).pipe(map(r => r || ''));
  }

  getCropSteeringShotConfig(program: CropSteeringProgramRequest): Observable<CropSteeringShot> {
    const url = `${this.cropSteeringPath}/ShotConfiguration`;

    return this.http.post<CropSteeringShot>(url, program).pipe(map((r) => r || {
      estimatedIrrigationEvents: 0,
      estimatedRampUpWindow: 0,
      rampUpShotSizeSeconds: 0
    }));
  }

  addRuleGroup(ruleGroup: RuleGroup): Observable<RuleGroup> {
    this.progressBarService.SetLoading(true);
    return this.http
      .post<RuleGroup>(`api/RuleGroups`, ruleGroup)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  duplicateRuleGroup(ruleGroup: RuleGroup): Observable<RuleGroup> {
    this.progressBarService.SetLoading(true);
    const body = { SourceRuleGroupId: ruleGroup.Id };
    return this.http
      .post<RuleGroup>(`api/RuleGroupDuplications`, body)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  updateRuleGroup(ruleGroup: RuleGroup): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.put(`api/RuleGroups/${ruleGroup.Id}`, ruleGroup).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  deleteRuleGroup(ruleGroup: RuleGroup): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.delete(`api/RuleGroups/${ruleGroup.Id}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  createDosingRecipe(recipe: DosingRecipe, tdsUnit: UnitOfMeasure): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http
      .post(`${this.dosingRecipePath}/?tdsUnitOfMeasure=${tdsUnit}`, recipe)
      .pipe(
        finalize(() => this.progressBarService.SetLoading(false)),
        map(() => true)
      );
  }

  updateDosingRecipe(recipe: DosingRecipe, tdsUnit: UnitOfMeasure): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http
      .put(`${this.dosingRecipePath}/${recipe.Id}/?tdsUnitOfMeasure=${tdsUnit}`, recipe)
      .pipe(
        finalize(() => this.progressBarService.SetLoading(false)),
        map(() => true)
      );
  }

  deleteDosingRecipe(recipeId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.delete(`${this.dosingRecipePath}/${recipeId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  getNewModules(deviceId: string): Observable<NewModulesResponse[]> {
    if (!deviceId) {
      return of([]);
    }

    const url = `${this.variablesPath}?deviceId=${deviceId}&variableName=newModules`;

    this.progressBarService.SetLoading(true);
    return this.http
      .get<NewModulesResponse[]>(url)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  getProductInventory(serial: string): Observable<ProductInventoryResponse> {
    const url = `${this.productInventoriesPath}?serialNumber=${serial}`;

    this.progressBarService.SetLoading(true);
    return this.http
      .get<ProductInventoryResponse>(url)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  getUnregisteredModules(serials: string[]): Observable<string[]> {
    if (!serials || !serials.length) {
      return of([]);
    }

    const url = `${this.unregisteredModulesPath}?serialNumbers=${serials.join(',')}`;

    this.progressBarService.SetLoading(true);
    return this.http
      .get<string[]>(url)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  registerModule(mod: ProductRegistration): Observable<ModuleResponse> {
    this.progressBarService.SetLoading(true);
    const body = { ...mod };
    return this.http
      .post<ModuleResponse>(`${this.productRegistrationPath}`, body)
      .pipe(finalize(() => this.progressBarService.SetLoading(false)));
  }

  deleteModule(moduleId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.delete(`${this.modulesPath}/${moduleId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  deleteController(controllerId: string): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    return this.http.delete(`${this.containersPath}/${controllerId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  updateController(controller: Controller): void {
    this._loadingController = false;
    if (controller) {
      const exist = this.allControllers.value.find((d) => d.DeviceId === controller.DeviceId);
      controller.isReadOnly = exist ? exist.IsReadOnly : true;
      controller.EnableHighFrequencyJournalData = exist ? exist.EnableHighFrequencyJournalData : false;
      controller.SupportsCropSteering = exist ? exist.SupportsCropSteering : false;
    }

    this.controller.next(controller);
  }

  updateControllerDefaultDashboard(
    controller: ControllerResponse,
    dashboardId: string
  ): Observable<boolean> {
    this.progressBarService.SetLoading(true);
    const controllerBody = Object.assign<
      ControllerResponse,
      Partial<ControllerResponse>,
      Partial<ControllerResponse>
    >(new ControllerResponse(), controller, { DefaultDashboardId: dashboardId });
    return this.http.put(`${this.controllersPath}/${controller.Id}`, controllerBody).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }

  startTask(taskId: number, duration: number): Observable<boolean> {
    const postArgs = `${taskId},${duration}`;

    return this.updateControllerConfig('startTask', postArgs);
  }

  private updateControllerConfig(
    functionName: string,
    postArgs: string,
    deviceId: string = null
  ): Observable<boolean> {
    const url = `api/ControllerFunctionCalls/?deviceId=${
      deviceId ? deviceId : this.instanceContainer.DeviceId
    }&functionName=${functionName}&arguments=${encodeURIComponent(postArgs)}`;

    this.progressBarService.SetLoading(true);
    return this.http.post(url, {}).pipe(
      finalize(() => this.progressBarService.SetLoading(false)),
      map(() => true)
    );
  }
}
