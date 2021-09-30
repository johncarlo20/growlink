import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSharedModule } from '@fuse/shared.module';

import { FuseMainComponent } from './main.component';
import { FuseContentComponent } from './content/content.component';
import { FuseFooterComponent } from './footer/footer.component';
import { FuseNavbarVerticalComponent } from './navbar/vertical/navbar-vertical.component';
import { FuseToolbarComponent } from './toolbar/toolbar.component';
import { FuseNavigationModule } from '@fuse/components/navigation/navigation.module';
import { FuseNavbarHorizontalComponent } from './navbar/horizontal/navbar-horizontal.component';
import { FuseQuickPanelComponent } from './quick-panel/quick-panel.component';
import { FuseShortcutsModule } from '@fuse/components/shortcuts/shortcuts.module';
import { FuseSearchBarModule } from '@fuse/components/search-bar/search-bar.module';
import { LoginModule } from './content/login/login.module';
import {
  CustomerService,
  ChartDataPointsService,
  HeatmapService,
  NotificationsService,
  GrowMediumService,
  SoilECTypeService,
  CountriesService,
  TimeZonesService,
  ProductTypesService,
  DeviceTypesService,
  UnitOfMeasureService,
  ParticleSensorsService,
  ParticleDevicesService,
  EntityUpdateService,
  DashboardService
} from '@services';
import { CustomerModule } from './content/customer/customer.module';
import { NoSubscriptionDialogComponent } from './dialogs/no-subscription-dialog.component';
import { ConfirmUnsavedDialogComponent } from './dialogs/confirm-unsaved-dialog.component';
import { ConfirmDeleteDialogComponent } from './dialogs/confirm-delete-dialog.component';
import { EulaDialogComponent } from './dialogs/eula-dialog.component';
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
import { MatOptionModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseSidebarModule } from '@fuse/components';
import { ConfigUpdateToastComponent } from './config-update-toast/config-update-toast.component';
import { SubscriptionExpiredDialogComponent } from './dialogs/subscription-expired-dialog.component';
import { AddModule } from '@carbon/icons-angular';

@NgModule({
  declarations: [
    FuseContentComponent,
    FuseFooterComponent,
    FuseMainComponent,
    FuseNavbarVerticalComponent,
    FuseNavbarHorizontalComponent,
    FuseToolbarComponent,
    FuseQuickPanelComponent,
    NoSubscriptionDialogComponent,
    ConfirmUnsavedDialogComponent,
    ConfirmDeleteDialogComponent,
    ConfigUpdateToastComponent,
    EulaDialogComponent,
    SubscriptionExpiredDialogComponent,
  ],
  imports: [
    AddModule,
    FuseSharedModule,
    RouterModule,
    FuseNavigationModule,
    FuseShortcutsModule,
    FuseSearchBarModule,
    FuseSidebarModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatMenuModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatButtonToggleModule,
    MatListModule,
    MatDialogModule,
    MatButtonModule,
    MatOptionModule,
    MatInputModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    LoginModule,
    CustomerModule
  ],
  exports: [
    FuseMainComponent,
    ConfigUpdateToastComponent,
  ],
  providers: [
    CustomerService,
    ChartDataPointsService,
    CountriesService,
    TimeZonesService,
    ProductTypesService,
    ParticleSensorsService,
    ParticleDevicesService,
    DeviceTypesService,
    UnitOfMeasureService,
    EntityUpdateService,
    HeatmapService,
    DashboardService,
    NotificationsService,
    GrowMediumService,
    SoilECTypeService,
  ]
})

export class FuseMainModule {
}
