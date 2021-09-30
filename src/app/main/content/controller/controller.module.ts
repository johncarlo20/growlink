import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { FuseWidgetModule } from '@fuse/components/widget/widget.module';
import { FuseSharedModule } from '@fuse/shared.module';

import { ControllerRoutingModule } from './controller-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ModulesComponent } from './modules/modules.component';
import { EditModuleDialogComponent } from './modules/edit-module-dialog.component';
import { EditSensorDialogComponent } from './modules/edit-sensor-dialog.component';
import { EditDeviceDialogComponent } from './modules/edit-device-dialog.component';
import { RulesComponent } from './rules/rules.component';
import { EditSensorTriggerDialogComponent } from './rules/sensor-trigger/edit-sensor-trigger-dialog.component';
import { EditTimerDialogComponent } from './rules/timer/edit-timer-dialog.component';
import { EditScheduleDialogComponent } from './rules/schedule/edit-schedule-dialog.component';
import { EditAlertDialogComponent } from './rules/alert/edit-alert-dialog.component';
import { EditManualTaskDialogComponent } from './rules/manual-task/edit-manual-task-dialog.component';
import { UploadConfirmDialogComponent } from './upload-confirm/upload-confirm-dialog.component';
import { JournalComponent } from './journal/journal.component';
import { TrendChartComponent } from './journal/trend-chart.component';
import { ProfileComponent } from './profile/profile.component';
import { EntityUpdatesComponent } from '../../entity-updates/entity-updates.component';

import { JournalDataService, MotorModuleService } from '@services';
import { CustomComponentsModule } from '../../custom-components.module';
import { RuleGroupDialogComponent } from './rules/rulegroup/rule-group-dialog.component';
import { DosingRecipesComponent } from './dosing-recipes/dosing-recipes.component';
import { EditDosingRecipeDialogComponent } from './dosing-recipes/edit-dosing-recipe-dialog.component';
import { DeviceThrottlesComponent } from './rules/device-throttles/device-throttles.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AddModulesDialogComponent } from './modules/add-modules-dialog.component';
import { MotorControlsComponent } from './motor-controls/motor-controls.component';
import { EditMotorControlDialogComponent } from './motor-controls/edit-motor-control-dialog.component';
import { RuleGroupComponent } from './rules/rule-group.component';
import { SensorTriggerRulesComponent } from './rules/sensor-trigger/sensor-trigger-rules.component';
import { TimerRulesComponent } from './rules/timer/timer-rules.component';
import { ScheduleRulesComponent } from './rules/schedule/schedule-rules.component';
import { AlertRulesComponent } from './rules/alert/alert-rules.component';
import { ManualTaskRulesComponent } from './rules/manual-task/manual-task-rules.component';
import { ConfirmRulegroupActivationDialogComponent } from './rules/confirm-rulegroup-activation-dialog/confirm-rulegroup-activation-dialog.component';
import { CropSteeringProgramsComponent } from './rules/crop-steering/crop-steering-programs.component';
import { EditProgramDialogComponent } from './rules/crop-steering/edit-program-dialog.component';
import { SensorChartComponent } from './journal/sensor-chart.component';
import * as icons from '@carbon/icons-angular';

import { ChartsModule } from 'ng2-charts';

@NgModule({
  imports: [
    icons.AddModule,
    icons.HomeModule,
    icons.InformationFilledModule,
    icons.RainDropModule,
    icons.SettingsAdjustModule,
    icons.WarningAltFilledModule,
    icons.FlashFilledModule,
    icons.PowerModule,
    icons.AddAltModule,
    icons.SubtractAltModule,
    icons.MaximizeModule,
    icons.ChevronDownModule,
    icons.ChevronRightModule,
    icons.TimeModule,
    icons.LoopModule,
    icons.CalendarModule,
    ChartsModule,
    FuseSharedModule,
    CommonModule,
    ControllerRoutingModule,
    FuseWidgetModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatMenuModule,
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
    MatChipsModule,
    MatDatepickerModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatTooltipModule,
    NgxChartsModule,
    CustomComponentsModule,
  ],
  declarations: [
    DashboardComponent,
    ModulesComponent,
    EditModuleDialogComponent,
    EditSensorDialogComponent,
    EditDeviceDialogComponent,
    RulesComponent,
    EditSensorTriggerDialogComponent,
    EditTimerDialogComponent,
    EditScheduleDialogComponent,
    EditAlertDialogComponent,
    EditManualTaskDialogComponent,
    JournalComponent,
    TrendChartComponent,
    ProfileComponent,
    UploadConfirmDialogComponent,
    EntityUpdatesComponent,
    RuleGroupDialogComponent,
    DosingRecipesComponent,
    EditDosingRecipeDialogComponent,
    DeviceThrottlesComponent,
    AddModulesDialogComponent,
    MotorControlsComponent,
    EditMotorControlDialogComponent,
    RuleGroupComponent,
    SensorTriggerRulesComponent,
    TimerRulesComponent,
    ScheduleRulesComponent,
    AlertRulesComponent,
    ManualTaskRulesComponent,
    ConfirmRulegroupActivationDialogComponent,
    CropSteeringProgramsComponent,
    EditProgramDialogComponent,
    SensorChartComponent,
  ],
  providers: [JournalDataService, MotorModuleService],
})
export class ControllerModule {}
