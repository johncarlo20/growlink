import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrgRulesComponent } from './org-rules/org-rules.component';
import { CalibrationReportComponent } from './calibration-report/calibration-report.component';
import { HeatmapComponent } from './heatmap/heatmap.component';
import { HeatmapsListComponent } from './heatmaps-list/heatmaps-list.component';
import { HeatmapConfigComponent } from './heatmap/heatmap-config.component';
import { CanDeactivateGuard } from '../../guards/can-deactivate.guard';
import { OrgDashboardsComponent } from './dashboards/dashboards.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'rules',
        component: OrgRulesComponent,
      },
      {
        path: 'heatmaps',
        children: [
          {
            path: '',
            component: HeatmapsListComponent,
          },
          {
            path: 'config',
            component: HeatmapConfigComponent,
            canDeactivate: [CanDeactivateGuard]
          },
          {
            path: 'config/:id',
            component: HeatmapConfigComponent,
            canDeactivate: [CanDeactivateGuard]
          },
          {
            path: ':id',
            component: HeatmapComponent,
          },
        ],
      },
      {
        path: 'dashboards',
        component: OrgDashboardsComponent,
      },
      {
        path: 'dashboards/:guid',
        component: OrgDashboardsComponent,
      },
      {
        path: 'reports',
        children: [
          {
            path: 'calibration',
            component: CalibrationReportComponent,
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationalRoutingModule { }
