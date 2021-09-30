import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSharedModule } from '@fuse/shared.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { HarvestsComponent } from './harvests.component';
import { AuthGuard } from '../../guards/auth.guard';
import { SubscriptionGuard } from '../../guards/subscription.guard';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import * as icons from '@carbon/icons-angular';

import { ChartsModule } from 'ng2-charts';
import { HarvestsAddDialogComponent } from './harvests-add-dialog/harvests-add-dialog.component'
import { HarvestsPlusDialogComponent } from './harvests-plus-dialog/harvests-plus-dialog.component'

const routes = [
  {
    path: 'harvests',
    component: HarvestsComponent,
    canActivate: [AuthGuard, SubscriptionGuard]
  }
];

@NgModule({
  declarations: [
    HarvestsComponent,
    HarvestsAddDialogComponent,
    HarvestsPlusDialogComponent,
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
    icons.SearchModule,
    icons.CloseModule,
    icons.SubtractModule,
    ChartsModule,
    FuseSharedModule,
    MatSelectModule,
    MatTableModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatButtonModule
  ],
  exports: [
    HarvestsComponent,
    HarvestsAddDialogComponent,
    HarvestsPlusDialogComponent,
  ]
})

export class HarvestsModule {
}
