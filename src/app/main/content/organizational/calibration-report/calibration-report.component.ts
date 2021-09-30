import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Observable, Subject, of } from 'rxjs';
import { distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators';
import { ProgressBarService, ControllerService, EntityUpdateService, ParticleSensorsService } from '@services';
import { SelectItem, CalibrationReportResponse } from '@models';
import { BaseAPIComponent, TimeUtil } from '@util';

@Component({
  selector: 'fuse-calibration-report',
  templateUrl: './calibration-report.component.html',
  styleUrls: ['./calibration-report.component.scss'],
})
export class CalibrationReportComponent extends BaseAPIComponent implements OnInit, AfterViewInit {
  updatesColumns = [
    'tstamp',
    'controller',
    'module',
    'sensor',
    'fieldName',
    'oldValue',
    'newValue',
    'username',
    'ipAddress',
  ];
  searchForm: FormGroup;
  searchRanges: SelectItem[] = [];
  sensorTypes: SelectItem[] = [];
  allControllers: SelectItem[] = [];
  selectedEntry: CalibrationReportResponse = null;

  entriesDataSource = new MatTableDataSource<CalibrationReportResponse>();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  public calibrationData: Observable<CalibrationReportResponse[]>;
  private searchTerms = new Subject<ReportSearchTerm>();

  constructor(
    private controllerService: ControllerService,
    private entityUpdatesService: EntityUpdateService,
    private particleSensorService: ParticleSensorsService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);

    this.searchRanges = TimeUtil.loadSearchRanges();
    this.sensorTypes = this.particleSensorService.CalibrationSelectList();
    this.progressBarService.SetCurrentPage([
      { icon: 'insert_chart', caption: 'Calibration Report' },
    ]);
  }

  ngOnInit() {
    super.ngOnInit();

    this.searchForm = new FormGroup({
      startDate: new FormControl('', [Validators.required]),
      endDate: new FormControl('', [Validators.required]),
      range: new FormControl('', [Validators.required]),
      sensors: new FormControl(0, [Validators.required]),
      controllers: new FormControl('', [Validators.required]),
    });

    this.subs.add(
      this.controllerService.AllControllers.subscribe(all => {
        this.allControllers = all.map(c => ({ caption: c.Name, value: c.Id }));
        this.allControllers.unshift({ caption: 'All', value: '0' });
      })
    );

    this.calibrationData = this.searchTerms.pipe(
      distinctUntilChanged(),
      switchMap(term =>
        term
          ? this.entityUpdatesService.getCalibrationReport(
            term.controllerId,
            term.sensorType,
            term.startDate,
            term.endDate
          )
          : of([])
      ),
      catchError(() => of([])),
      map((lines: CalibrationReportResponse[]) =>
        lines.sort((a, b) => {
          if (a.ControllerName !== b.ControllerName) {
            return a.ControllerName.localeCompare(b.ControllerName);
          }
          if (a.ModuleName !== b.ModuleName) {
            return a.ModuleName.localeCompare(b.ModuleName);
          }
          if (a.SensorName !== b.SensorName) {
            return a.SensorName.localeCompare(b.SensorName);
          }
          return a.Timestamp.isBefore(b.Timestamp) ? -1 : 1;
        })
      )
    );

    this.subs.add(this.range.valueChanges.subscribe(r => this.setDates(r)));
    this.subs.add(this.controllers.valueChanges.subscribe(cid => {
      if (cid === '0') {
        this.sensorTypes = this.particleSensorService.CalibrationSelectList();
        return;
      }

      const controller = this.controllerService.findController(cid);
      if (!controller.FirmwareVersion) {
        this.sensorTypes = this.particleSensorService.CalibrationSelectList();
        return;
      }

      this.particleSensorService.LoadControllerParticleSensors(controller).subscribe(result => {
        this.sensorTypes = this.particleSensorService.CalibrationSelectList(result);
      });
    }));
    this.range.setValue(this.searchRanges[3].value);
    this.controllers.setValue('0');
  }
  ngAfterViewInit() {
    this.entriesDataSource.paginator = this.paginator;

    setTimeout(() => {
      this.subs.add(
        this.calibrationData.subscribe(entries => {
          this.entriesDataSource = new MatTableDataSource<CalibrationReportResponse>(entries);
          this.entriesDataSource.paginator = this.paginator;
        })
      );
    });
  }

  get startDate() {
    return this.searchForm.get('startDate');
  }
  get endDate() {
    return this.searchForm.get('endDate');
  }
  get range() {
    return this.searchForm.get('range');
  }
  get sensors() {
    return this.searchForm.get('sensors');
  }
  get controllers() {
    return this.searchForm.get('controllers');
  }

  setDates(e: { startDate: Date; endDate: Date }): void {
    if (e === null) {
      return;
    }

    this.startDate.setValue(e.startDate);
    this.endDate.setValue(e.endDate);
  }

  search() {
    if (!this.searchForm.valid) {
      return;
    }

    const searchTerm: ReportSearchTerm = {
      controllerId: this.controllers.value !== '0' ? this.controllers.value : null,
      sensorType: this.sensors.value !== 0 ? this.sensors.value : null,
      startDate: this.startDate.value,
      endDate: this.endDate.value,
    };

    this.searchTerms.next(searchTerm);
  }

  selectEntry(entry: CalibrationReportResponse) {
    this.selectedEntry = entry;
  }

  export(filename: string, fileContents: string): void {
    fileContents = fileContents.replace(/[^\x00-\x7F]/g, '');
    if (window.navigator.msSaveOrOpenBlob) {
      const blob = new Blob([fileContents], { type: 'text/csv;charset=utf-8;' });
      window.navigator.msSaveBlob(blob, filename);
    } else {
      const a = document.createElement('a');
      const dataURI = 'data:text/csv;charset=utf-8,' + encodeURIComponent(fileContents);
      a.href = dataURI;
      a['download'] = filename;
      a.click();
    }
  }

  exportCalibrationData(): void {
    const dateTimeOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    };
    const exportData = [];
    const header = [
      'Controller',
      'Module',
      'Sensor',
      'Field',
      'Time',
      'OldValue',
      'NewValue',
      'User',
      'IP Address',
    ];
    exportData.push(header);
    for (const dta of this.entriesDataSource.data) {
      const av: Date = dta.Timestamp.toDate();
      const rowDte = av.toLocaleTimeString('en-us', dateTimeOptions).replace(',', '');
      exportData.push([
        `"${dta.ControllerName}"`,
        `"${dta.ModuleName}"`,
        `"${dta.SensorName}"`,
        `"${dta.FieldName}"`,
        rowDte,
        dta.OldValue,
        dta.NewValue,
        `"${dta.UserName}"`,
        `"${dta.IpAddress}"`,
      ]);
    }

    this.export('CalibrationReport.csv', exportData.join('\r\n'));
  }
}

class ReportSearchTerm {
  controllerId: string;
  sensorType: number;
  startDate: Date;
  endDate: Date;
}
