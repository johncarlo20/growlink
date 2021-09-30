import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSharedModule } from '@fuse/shared.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

import { BatchTanksComponent } from './batch-tanks.component';
import { AuthGuard } from '../../guards/auth.guard';
import { SubscriptionGuard } from '../../guards/subscription.guard';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import * as icons from '@carbon/icons-angular';

import { ChartsModule } from 'ng2-charts';

const routes = [
  {
    path: 'batch-tanks',
    component: BatchTanksComponent,
    canActivate: [AuthGuard, SubscriptionGuard]
  }
];

@NgModule({
  declarations: [
    BatchTanksComponent,
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
    ChartsModule,
    FuseSharedModule,
    MatSelectModule,
    MatTableModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  exports: [
    BatchTanksComponent
  ]
})

export class BatchTanksModule {
}
