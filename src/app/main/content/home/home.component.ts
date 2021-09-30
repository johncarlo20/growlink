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
  selector: 'fuse-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends BaseAPIComponent implements OnInit {

  items: Array<any> = [
    {
      room: 'Flower 01',
      stageDays: 'Veg / 21',
      plantCount: 200,
      activeRecipe: 'Gelato',
      lightStatus: 'On',
      temp: 82,
      humidity: 55,
      vpd: 1.6,
      co2: 700,
      lightLevel: '600 ppfd',
      soilWc: '65%',
      soilEc: 6.5,
      soilTemp: 72
    }
  ];

  displayedColumns: string[] = [
    'room', 
    'stageDays',
    'plantCount',
    'activeRecipe',
    'lightStatus',
    'temp',
    'humidity',
    'vpd',
    'lightLevel',
    'soilWc',
    'soilEc',
    'soilTemp'
  ];

  constructor(
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
  }
}
