import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSharedModule } from '@fuse/shared.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

import { CalendarIrrigationEventComponent } from './calendar-irrigation-event.component';
import { AuthGuard } from '../../../guards/auth.guard';
import { SubscriptionGuard } from '../../../guards/subscription.guard';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { CalendarIrrigationEventDialogComponent } from '../calendar-irrigation-event-dialog/calendar-irrigation-event-dialog.component';
import { CalendarIrrigationEventChooseComponent } from '../calendar-irrigation-event-choose/calendar-irrigation-event-choose.component';

import * as icons from '@carbon/icons-angular';

const routes = [
  {
    path: 'calendar/irrigation-event-edit',
    component: CalendarIrrigationEventComponent,
    canActivate: [AuthGuard, SubscriptionGuard]
  }
];

@NgModule({
  declarations: [
    CalendarIrrigationEventComponent,
    CalendarIrrigationEventDialogComponent,
    CalendarIrrigationEventChooseComponent
  ],
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
    icons.AlarmModule,
    icons.RenewModule,
    icons.OverflowMenuHorizontalModule,
    icons.CloseModule,
    icons.TimeModule,
    icons.ChevronLeftModule,
    icons.ChevronRightModule,
    icons.CalendarModule,
    MatSliderModule,
    MatRadioModule,
    FuseSharedModule,
    MatSelectModule,
    MatTableModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSlideToggleModule
  ],
  exports: [
    CalendarIrrigationEventComponent,
    CalendarIrrigationEventDialogComponent,
    CalendarIrrigationEventChooseComponent
  ]
})

export class CalendarIrrigationEventModule {
}
