import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes, Router } from '@angular/router';
import { FuseModule } from '@fuse/fuse.module';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseProgressBarModule, FuseSidebarModule, FuseThemeOptionsModule, FuseNavigationModule } from '@fuse/components';
import { fuseConfig } from 'app/fuse-config';
import { AppComponent } from './app.component';
import { FuseMainModule } from './main/main.module';
import { FuseSplashScreenService } from '@fuse/services/splash-screen.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { HomeModule } from './main/content/home/home.module';
import { RoomModule } from './main/content/room/room.module';
import { HarvestsModule } from './main/content/harvests/harvests.module';
import { BatchTanksModule } from './main/content/batch-tanks/batch-tanks.module';
import { BatchTanksNewModule } from './main/content/batch-tanks/batch-tanks-new/batch-tanks-new.module';
import { NutrientModule } from './main/content/nutrient/nutrient.module'
import { NutrientRecipeNewModule } from './main/content/nutrient/nutrient-recipe-new/nutrient-recipe-new.module';
import { TaskModule } from './main/content/task/task.module';
import { CalendarModule } from './main/content/calendar/calendar.module';
import { CalendarIrrigationEventModule } from './main/content/calendar/calendar-irrigation-event/calendar-irrigation-event.module';
import { HeatMapsModule } from './main/content/heat-maps//heat-maps.module';
import { RecipeModule } from './main/content/recipe/recipe.module';
import { RecipeTimelineModule } from './main/content/recipe-timeline/recipe-timeline.module';
import { TranslateModule } from '@ngx-translate/core';
import { AuthenticationService, ControllerService, UserPreferencesService, OrganizationService, ProgressBarService, SignalRService, ActiveControllerService } from '@services';
import { httpInterceptorProviders } from './main/http-interceptors';
import { AuthGuard } from './main/guards/auth.guard';
import { SubscriptionGuard } from './main/guards/subscription.guard';
import { CanDeactivateGuard } from './main/guards/can-deactivate.guard';
import { AccountAdminGuard } from './main/guards/account-admin.guard';
import { AppSettingsService } from './main/services/app-settings.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { NgxGoogleAnalyticsModule, NgxGoogleAnalyticsRouterModule } from 'ngx-google-analytics';

const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'controller/:guid',
    loadChildren: () => import('./main/content/controller/controller.module')
      .then(m => m.ControllerModule),
    resolve: {
      data: ControllerService
    },
    canActivate: [AuthGuard, SubscriptionGuard]
  },
  {
    path: 'org',
    loadChildren: () => import('./main/content/organizational/organizational.module')
      .then(m => m.OrganizationalModule),
    resolve: {
      data: ControllerService
    },
    canActivate: [AuthGuard, SubscriptionGuard]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    NgxGoogleAnalyticsModule.forRoot('G-JGWBV9XDVX'),
    NgxGoogleAnalyticsRouterModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    FuseModule.forRoot(fuseConfig),
    FuseProgressBarModule,
    FuseSharedModule,
    FuseSidebarModule,
    FuseThemeOptionsModule,
    FuseMainModule,
    FuseNavigationModule,
    MatSnackBarModule,
    MatNativeDateModule,
    HomeModule,
    RoomModule,
    HarvestsModule,
    TaskModule,
    HeatMapsModule,
    MatTableModule,
    RecipeModule,
    RecipeTimelineModule,
    CalendarModule,
    CalendarIrrigationEventModule,
    BatchTanksModule,
    BatchTanksNewModule,
    NutrientModule,
    NutrientRecipeNewModule,
    TranslateModule.forRoot(),
    RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' }),
  ],
  providers: [
    FuseSplashScreenService,
    FuseConfigService,
    FuseNavigationService,
    FuseProgressBarService,
    httpInterceptorProviders,
    AuthenticationService,
    SignalRService,
    ProgressBarService,
    AuthGuard,
    SubscriptionGuard,
    CanDeactivateGuard,
    AccountAdminGuard,
    ControllerService,
    UserPreferencesService,
    OrganizationService,
    ActiveControllerService,
    AppSettingsService,
    {
      provide: APP_INITIALIZER,
      useFactory: configLoader,
      deps: [AppSettingsService],
      multi: true
    },
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }

export function configLoader(appSettingsService: AppSettingsService) {
  return () => appSettingsService.load();
}
