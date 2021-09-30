import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSharedModule } from '@fuse/shared.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


import { HeatMapsComponent } from './heat-maps.component';
import { AuthGuard } from '../../guards/auth.guard';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import * as icons from '@carbon/icons-angular';

import { ChartsModule } from 'ng2-charts';
import { HeatMapsAddModule } from './heat-maps-add/heat-maps-add.module';
import { HeatMapsNewModule } from './heat-maps-new/heat-maps-new.module';
import { HeatMapsAddSensorDialogComponent } from './heat-maps-add-sensor-dialog/heat-maps-add-sensor-dialog.component';

const routes = [
  {
    path: 'heat-maps',
    component: HeatMapsComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    HeatMapsComponent,
    HeatMapsAddSensorDialogComponent,
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
    icons.CheckmarkModule,
    icons.FilterModule,
    icons.CaretSortModule,
    icons.ChevronSortModule,
    icons.EditModule,
    icons.OverflowMenuHorizontalModule,
    icons.CaretDownModule,
    icons.CaretUpModule,
    icons.CheckmarkOutlineModule,
    icons.CalendarModule,
    icons.CloseModule,
    icons.RequestQuoteModule,
    ChartsModule,
    FuseSharedModule,
    MatSelectModule,
    MatTableModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatButtonModule,
    HeatMapsAddModule,
    HeatMapsNewModule,
    MatDialogModule
  ],
  exports: [
    HeatMapsComponent
  ]
})

export class HeatMapsModule {
}