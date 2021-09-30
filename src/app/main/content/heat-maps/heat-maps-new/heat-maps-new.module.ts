import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSharedModule } from '@fuse/shared.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


import { HeatMapsNewComponent } from './heat-maps-new.component';
import { AuthGuard } from '../../../guards/auth.guard';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RangeSliderComponent } from '../range-slider/range-slider.component';
import * as icons from '@carbon/icons-angular';

import { ChartsModule } from 'ng2-charts';

import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';

const routes = [
  {
    path: 'heat-maps/new',
    component: HeatMapsNewComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    HeatMapsNewComponent,
    RangeSliderComponent
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
    icons.TrashCanModule,
    ChartsModule,
    FuseSharedModule,
    MatSelectModule,
    MatSlideToggleModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    MatSliderModule,
    MatDividerModule,
    MatListModule,
  ],
  exports: [
    HeatMapsNewComponent
  ]
})

export class HeatMapsNewModule {
}