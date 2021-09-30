import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSharedModule } from '@fuse/shared.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

import { NutrientRecipeNewComponent } from './nutrient-recipe-new.component';
import { AuthGuard } from '../../../guards/auth.guard';
import { SubscriptionGuard } from '../../../guards/subscription.guard';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import * as icons from '@carbon/icons-angular';

import { ChartsModule } from 'ng2-charts';

const routes = [
  {
    path: 'nutrient/recipe-new',
    component: NutrientRecipeNewComponent,
    canActivate: [AuthGuard, SubscriptionGuard]
  }
];

@NgModule({
  declarations: [
    NutrientRecipeNewComponent
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
    MatSliderModule,
    ChartsModule,
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
    NutrientRecipeNewComponent
  ]
})

export class NutrientRecipeNewModule {
}
