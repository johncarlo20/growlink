import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadModule } from 'ng2-file-upload';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';

import { OrganizationalRoutingModule } from './organizational-routing.module';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseWidgetModule } from '@fuse/components/widget/widget.module';
import { CustomComponentsModule } from '../../custom-components.module';
import { OrgRulesComponent } from './org-rules/org-rules.component';
import { CalibrationReportComponent } from './calibration-report/calibration-report.component';
import { AssignRuleDialogComponent } from './org-rules/assign-rule/assign-rule-dialog.component';
import { DeleteRuleDialogComponent } from './org-rules/delete-rule/delete-rule-dialog.component';
import { EditAlertsDialogComponent } from './org-rules/edit-alert/edit-alerts-dialog.component';
import { EditSchedulesDialogComponent } from './org-rules/edit-schedule/edit-schedules-dialog.component';
import { HeatmapComponent } from './heatmap/heatmap.component';
import { HeatmapSensorDialogComponent } from './heatmap/heatmap-sensor-dialog/heatmap-sensor-dialog.component';
import { HeatmapDeviceDialogComponent } from './heatmap/heatmap-device-dialog/heatmap-device-dialog.component';
import { HeatmapGroupDialogComponent } from './heatmap/heatmap-group-dialog/heatmap-group-dialog.component';
import { HeatmapsListComponent } from './heatmaps-list/heatmaps-list.component';
import { HeatmapConfigComponent } from './heatmap/heatmap-config.component';
import { JournalDataService } from '@services';
import { OrgDashboardsComponent } from './dashboards/dashboards.component';

@NgModule({
  imports: [
    FuseSharedModule,
    CommonModule,
    MatSelectModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatListModule,
    MatDialogModule,
    MatTableModule,
    MatCardModule,
    MatCheckboxModule,
    MatSliderModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatPaginatorModule,
    MatChipsModule,
    FileUploadModule,
    OrganizationalRoutingModule,
    FuseWidgetModule,
    CustomComponentsModule
  ],
  declarations: [
    OrgRulesComponent,
    CalibrationReportComponent,
    AssignRuleDialogComponent,
    DeleteRuleDialogComponent,
    EditAlertsDialogComponent,
    EditSchedulesDialogComponent,
    HeatmapComponent,
    HeatmapSensorDialogComponent,
    HeatmapDeviceDialogComponent,
    HeatmapGroupDialogComponent,
    HeatmapsListComponent,
    HeatmapConfigComponent,
    OrgDashboardsComponent,
  ],
  providers: [JournalDataService],
})
export class OrganizationalModule { }
