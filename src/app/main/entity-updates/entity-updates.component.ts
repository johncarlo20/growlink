import { Component, OnInit, Inject, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Observable, Subscription } from 'rxjs';
import { EntityUpdateService, ProgressBarService, UserPreferencesService } from '@services';
import { EntityUpdate, Controller, UserPrefs } from '@models';
import { TimeUtil } from '@util';
import * as moment from 'moment';
import 'moment-timezone';

@Component({
  selector: 'fuse-entity-updates',
  templateUrl: './entity-updates.component.html',
  styleUrls: ['./entity-updates.component.scss']
})
export class EntityUpdatesComponent implements OnInit, AfterViewInit, OnDestroy {
  updatesColumns = ['tstamp', 'field', 'oldValue', 'newValue', 'username', 'ipAddress'];
  controllerTimeFields = ['StartTime', 'EndTime', 'StartTimestamp'];
  entityId: string;
  entityName: string;
  controller: Controller;
  selectedEntry: EntityUpdate = null;
  entriesDataSource = new MatTableDataSource<EntityUpdate>();

  private subs = new Subscription();
  private userPrefs: UserPrefs;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { entityId: string, entityName: string, controller: Controller },
    public dialogRef: MatDialogRef<EntityUpdatesComponent>,
    private entityUpdatesService: EntityUpdateService,
    private userPrefService: UserPreferencesService,
    private progressBar: ProgressBarService
  ) {
    this.entityId = data.entityId;
    this.entityName = data.entityName;
    this.controller = data.controller;
  }

  ngOnInit() {
    this.subs.add(this.userPrefService.userPrefs.subscribe(prefs => this.userPrefs = prefs));
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.entriesDataSource.paginator = this.paginator;
    const timeFormat = `${TimeUtil.preferredTimeFormat(this.userPrefs.prefer24Hour, true)} z`;

    setTimeout(() => {
      this.entityUpdatesService.getEntityUpdateData(this.entityId).subscribe(entries => {
        entries.forEach(entry => {
          if (this.controllerTimeFields.includes(entry.FieldName)) {
            let utcTimeOld: moment.Moment = null;
            let utcTimeNew: moment.Moment = null;
            switch (entry.FieldName) {
              case 'StartTime':
              case 'EndTime':
                utcTimeOld = entry.OldValue ? moment.tz(entry.OldValue, 'HH:mm:ss', this.controller.TimeZoneId) : null;
                utcTimeNew = entry.NewValue ? moment.tz(entry.NewValue, 'HH:mm:ss', this.controller.TimeZoneId) : null;
                break;
              default:
                utcTimeOld = entry.OldValue ? moment.utc(entry.OldValue) : null;
                utcTimeNew = entry.NewValue ? moment.utc(entry.NewValue) : null;
                break;
            }

            if (utcTimeOld && utcTimeOld.isValid()) {
              entry.OldValue = moment(utcTimeOld).tz(this.controller.TimeZoneId).format(timeFormat);
            }
            if (utcTimeNew && utcTimeNew.isValid()) {
              entry.NewValue = moment(utcTimeNew).tz(this.controller.TimeZoneId).format(timeFormat);
            }
          }
        });
        this.entriesDataSource = new MatTableDataSource<EntityUpdate>(entries);
        this.entriesDataSource.paginator = this.paginator;
      });
    });
  }

  get loading(): Observable<boolean> {
    return this.progressBar.Loading;
  }

  selectEntry(entry: EntityUpdate) {
    this.selectedEntry = entry;
  }
}
