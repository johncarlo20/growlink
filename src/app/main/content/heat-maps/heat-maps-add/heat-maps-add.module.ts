import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSharedModule } from '@fuse/shared.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


import { HeatMapsAddComponent } from './heat-maps-add.component';
import { AuthGuard } from '../../../guards/auth.guard';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import * as icons from '@carbon/icons-angular';

import { ChartsModule } from 'ng2-charts';

const routes = [
  {
    path: 'heat-maps/add',
    component: HeatMapsAddComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    HeatMapsAddComponent,
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
    ChartsModule,
    FuseSharedModule,
    MatSelectModule,
    MatTableModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatButtonModule
  ],
  exports: [
    HeatMapsAddComponent
  ]
})

export class HeatMapsAddModule {
}