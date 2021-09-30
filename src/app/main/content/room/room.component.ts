import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataSource } from '@angular/cdk/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectChange } from '@angular/material/select';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { interval } from 'rxjs';

import {
  ControllerService,
  UserPreferencesService,
  AuthenticationService,
  ProgressBarService,
  DashboardService,
  ParticleSensorsService,
} from '@services';
import { ParticleSensor, ControllerResponse, OrgDashboardControllerResponse } from '@models';
import { BaseAPIComponent } from '@util';
import { ChartType, ChartDataSets, ChartOptions } from 'chart.js';
import { MultiDataSet, Label, Color } from 'ng2-charts';

@Component({
  selector: 'fuse-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent extends BaseAPIComponent implements OnInit {
  allControllers: ControllerResponse[] = [];
  orgValues: OrgDashboardControllerResponse[] = [];
  orgControllers: string[] = [];
  orgId: string;
  displayedColumns: string[] = [];
  sensorMatrix = new ParticleDataSource();
  preSelected: string[] = null;
  displayStyle = 'type';

  doughnutChartLabels: Label[] = ['81.4 °F', ' 69.2 °F'];
  doughnutChartData: MultiDataSet = [
    [25, 75]
  ];
  doughnutChartType: ChartType = 'doughnut';
  chartColors1: Array<any> = [
    {
      backgroundColor: ['#38BDF8', '#0EA5E9'],
      borderWidth: 2
    }
  ];
  chartColors2: Array<any> = [
    {
      backgroundColor: ['#6EE7B7', '#14B8A6'],
      borderWidth: 2
    }
  ];
  chartColors3: Array<any> = [
    {
      backgroundColor: ['#FCD34D', '#F59E0B'],
      borderWidth: 2
    }
  ];
  chartColors4: Array<any> = [
    {
      backgroundColor: ['#A5B4FC', '#6366F1'],
      borderWidth: 2
    }
  ];
  chartColors5: Array<any> = [
    {
      backgroundColor: ['#FCA5A5', '#EF4444'],
      borderWidth: 2
    }
  ];

  public lineChartData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
    { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' },
  ];
  public lineChartLabels: Label[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
  public lineChartOptions: (ChartOptions) = {
    responsive: true,
    scales: {
      // We use this empty structure as a placeholder for dynamic theming.
      xAxes: [{
        gridLines: {
          color: "rgba(0, 0, 0, 0)",
        }
      }],
      yAxes: [
        {
          id: 'y-axis-0',
          position: 'left',
          gridLines: {
            color: "rgba(0, 0, 0, 0)",
          }
        }
      ]
    },
  };
  public lineChartColors: Color[] = [
    { // grey
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
    { // dark grey
      backgroundColor: 'rgba(77,83,96,0.2)',
      borderColor: 'rgba(77,83,96,1)',
      pointBackgroundColor: 'rgba(77,83,96,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(77,83,96,1)'
    },
    { // red
      backgroundColor: 'rgba(255,0,0,0.3)',
      borderColor: 'red',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    }
  ];
  public lineChartLegend = true;
  public lineChartType: ChartType = 'line';

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private authService: AuthenticationService,
    private userPrefsService: UserPreferencesService,
    private controllerService: ControllerService,
    private dashboardService: DashboardService,
    private particleSensorService: ParticleSensorsService,
    snackbar: MatSnackBar,
    progressBarService: ProgressBarService
  ) {
    super(snackbar, progressBarService);
    this.progressBarService.SetCurrentPage([
      { icon: 'dashboard', caption: 'Organization Dashboard' },
    ]);
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.subs.add(interval(30000).subscribe(n => this.updateReadings()));
    this.route.queryParamMap.subscribe(params => {
      if (params.has('bookmark')) {
        const selected = params.get('bookmark');
        this.preSelected = selected.length ? selected.split(',') : [];
      }
      if (params.has('style')) {
        this.displayStyle = params.get('style');
      }
    });
    this.controllerService.setCurrentController(null);

    this.subs.add(
      this.authService.OrganizationIdChanged.subscribe(orgId => {
        this.orgId = orgId;
        this.filterOrgControllers();
      })
    );
    this.subs.add(
      this.controllerService.AllControllers.subscribe(all => {
        this.allControllers = all;
        this.filterOrgControllers();
      })
    );
    this.subs.add(
      this.userPrefsService.userPrefs.subscribe(() => {
        this.updateReadings(true);
      })
    );

  }

  private filterOrgControllers() {
    if (!this.orgId || !this.allControllers || !this.allControllers.length) {
      this.orgControllers = [];
    } else {
      this.orgControllers = this.allControllers
        .filter(c => c.OrganizationId === this.orgId)
        .map(c => c.Id);
    }

    this.displayedColumns = [...this.orgControllers.filter(cid => this.orgValues.find(ov => ov.ControllerId === cid))];

    this.updateMatrix();
  }

  get DisplayedColumns(): string[] {
    switch (this.displayStyle) {
      case 'type':
        return ['label'].concat(this.displayedColumns);
      default:
        return ['label'].concat(this.displayedColumns);
    }
  }

  get Controllers(): OrgDashboardControllerResponse[] {
    if (!this.orgValues) {
      return [];
    }

    return this.orgValues.filter(ov => this.orgControllers.find(cid => cid === ov.ControllerId));
  }

  private styleReading(reading: number, pc: ParticleController): string {
    if (reading === undefined || reading === null) {
      return '--';
    }
    const particleSensor = this.particleSensorService.FindParticleSensor(pc.particle);

    if (this.particleSensorService.LowFullSensor(particleSensor)) {
      return reading === 0 ? 'LOW' : 'FULL';
    }
    if (this.particleSensorService.OnOffSensor(particleSensor)) {
      return reading === 0 ? 'OFF' : 'ON';
    }

    return reading.toString();
  }

  GetReading(pc: ParticleController, controller: string): string {
    const result = pc.controllers.filter(c => c.controller === controller);
    if (!result.length) {
      return '--';
    }

    if (result.length === 1) {
      return this.styleReading(result[0].reading, pc);
    }

    const validResults = result.filter(r => r.reading !== null && r.reading !== undefined);
    const avg = validResults.length
      ? validResults.reduce((tot, r) => (tot += r.reading), 0) / validResults.length
      : null;
    return this.styleReading(avg ? Math.round(avg * 100.0) / 100.0 : null, pc);
  }

  GetDashboardUrl(controllerId: string): string {
    const controller = this.allControllers.find(c => c.Id === controllerId);
    if (!controller || !controller.DefaultDashboardId) {
      return `/controller/${controllerId}/dashboard/generated`;
    }

    return `/controller/${controllerId}/dashboard/${controller.DefaultDashboardId}`;
  }

  bookmarkChanged(ev: MatSelectChange) {
    if (!ev.value || !ev.value.length) {
      this.updateLocation([], this.displayStyle);
      return;
    }

    const selectedIds = ev.value as string[];
    this.updateLocation(selectedIds, this.displayStyle);
    this.updateMatrix();
  }

  styleChanged(ev: MatSelectChange) {
    this.updateLocation(this.displayedColumns, ev.value);
    this.updateMatrix();
  }

  private updateLocation(controllers: string[], style: string) {
    const bookmarkFragment = controllers.length ? `bookmark=${controllers.join(',')}` : `bookmark=`;
    const styleFragment = `style=${style}`;

    this.location.go('/home', `${bookmarkFragment}&${styleFragment}`);
  }

  private updateReadings(firstRun = false): void {
    this.controllerService.getOrgDashboardReadings(firstRun).subscribe(c => {
      this.orgValues = c;

      if (this.preSelected) {
        this.displayedColumns = [...this.preSelected];
        this.preSelected = null;
      } else {
        this.orgValues.forEach(controller => {
          if (firstRun && this.orgControllers.find(cid => controller.ControllerId === cid)) {
            this.displayedColumns.push(controller.ControllerId);
          }
        });
      }

      this.updateMatrix();
    });
  }

  private updateMatrix(): void {
    const newMatrix: ParticleController[] = [];
    this.orgValues.forEach(controller => {
      if (
        !this.displayedColumns.find(cid => cid === controller.ControllerId) ||
        !this.orgControllers.find(cid => cid === controller.ControllerId)
      ) {
        return;
      }

      controller.OrgDashboardReadings.forEach(reading => {
        let existSensor = newMatrix.find(exist => {
          switch (this.displayStyle) {
            case 'type':
              return exist.particle === reading.ParticleSensor;
            default:
              return exist.name.toLowerCase().localeCompare(reading.SensorName.toLowerCase()) === 0;
          }
        });
        if (!existSensor) {
          existSensor = {
            sort: reading.SortId,
            particle: reading.ParticleSensor,
            name: reading.SensorName,
            suffix: reading.Suffix,
            label: `${
              this.displayStyle === 'type'
                ? this.particleSensorService.FindParticleSensor(reading.ParticleSensor).Description
                : reading.SensorName
              } ${reading.Suffix ? '(' + reading.Suffix + ')' : ''}`,
            controllers: [],
          };

          newMatrix.push(existSensor);
        }
        existSensor.controllers.push({
          controller: controller.ControllerId,
          reading: reading.Value,
        });
      });
    });

    newMatrix.sort((a, b) => {
      if (a.sort === b.sort) {
        return a.particle - b.particle;
      }

      return a.sort - b.sort;
    });

    this.sensorMatrix.update(newMatrix);
  }
}

class ParticleDataSource implements DataSource<ParticleController> {
  private data: BehaviorSubject<ParticleController[]>;

  constructor(initialData?: ParticleController[]) {
    this.data = new BehaviorSubject<ParticleController[]>(initialData);
  }

  get Data(): Observable<ParticleController[]> {
    return this.data.asObservable();
  }
  connect(): Observable<ParticleController[]> {
    return this.data.asObservable();
  }

  update(newData?: ParticleController[]): void {
    this.data.next(newData);
  }

  disconnect(): void {
    this.data.complete();
  }
}

class ParticleController {
  sort: number;
  particle: ParticleSensor;
  name: string;
  label: string;
  suffix: string;
  controllers: {
    controller: string;
    reading: number;
  }[];
}
