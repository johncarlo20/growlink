import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { GridsterModule } from 'angular-gridster2';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseWidgetModule } from '@fuse/components/widget/widget.module';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DurationComponent } from './duration-component/duration.component';
import { ControllerTimePickerComponent } from './controller-timepicker-component/controller-timepicker.component';
import { GaugeChartComponent } from './gauge-chart/gauge-chart.component';
import { ReplaceLineBreaks } from './util/nl2br.pipe';
import { SensorDisplayComponent } from './dashboard-widgets/sensor-display/sensor-display.component';
import { SensorValueComponent } from './dashboard-widgets/sensor-value/sensor-value.component';
import { SensorGaugeComponent } from './dashboard-widgets/sensor-gauge/sensor-gauge.component';
import { SensorLightComponent } from './dashboard-widgets/sensor-light/sensor-light.component';
import { DeviceDisplayComponent } from './dashboard-widgets/device-display/device-display.component';
import { ManualTaskDisplayComponent } from './dashboard-widgets/manual-task-display/manual-task-display.component';
import { LabelDisplayComponent } from './dashboard-widgets/label-display/label-display.component';
import { CustomDashboardComponent } from './custom-dashboard-component/custom-dashboard.component';
import { AddSensorDialogComponent } from './custom-dashboard-component/add-sensor-dialog/add-sensor-dialog.component';
import { AddLightSensorDialogComponent } from './custom-dashboard-component/add-light-sensor-dialog/add-light-sensor-dialog.component';
import { AddDeviceDialogComponent } from './custom-dashboard-component/add-device-dialog/add-device-dialog.component';
import { AddManualTaskDialogComponent } from './custom-dashboard-component/add-manual-task-dialog/add-manual-task-dialog.component';
import { AddLabelDialogComponent } from './custom-dashboard-component/add-label-dialog/add-label-dialog.component';
import { EditDashboardDialogComponent } from './custom-dashboard-component/edit-dashboard-dialog/edit-dashboard-dialog.component';
import { EditItemDialogComponent } from './custom-dashboard-component/edit-item-dialog/edit-item-dialog.component';
import { SaveDashboardDialogComponent } from './custom-dashboard-component/save-dashboard-dialog/save-dashboard-dialog.component';
import { MomentDatePipe } from './util/moment-date.pipe';

@NgModule({
  imports: [
    FuseSharedModule,
    CommonModule,
    FuseWidgetModule,
    GridsterModule,
    NgxChartsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatListModule,
    MatInputModule,
    MatDialogModule,
    MatSelectModule,
    MatCardModule,
    MatSliderModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  declarations: [
    DurationComponent,
    ControllerTimePickerComponent,
    GaugeChartComponent,
    ReplaceLineBreaks,
    SensorDisplayComponent,
    SensorValueComponent,
    SensorGaugeComponent,
    SensorLightComponent,
    DeviceDisplayComponent,
    ManualTaskDisplayComponent,
    LabelDisplayComponent,
    CustomDashboardComponent,
    AddSensorDialogComponent,
    AddLightSensorDialogComponent,
    AddDeviceDialogComponent,
    AddManualTaskDialogComponent,
    AddLabelDialogComponent,
    EditDashboardDialogComponent,
    EditItemDialogComponent,
    SaveDashboardDialogComponent,
    MomentDatePipe,
  ],
  exports: [
    DurationComponent,
    ControllerTimePickerComponent,
    GaugeChartComponent,
    ReplaceLineBreaks,
    SensorDisplayComponent,
    SensorValueComponent,
    SensorGaugeComponent,
    SensorLightComponent,
    DeviceDisplayComponent,
    ManualTaskDisplayComponent,
    LabelDisplayComponent,
    CustomDashboardComponent,
    MomentDatePipe,
  ],
})
export class CustomComponentsModule {}
