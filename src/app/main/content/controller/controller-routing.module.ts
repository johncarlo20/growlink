import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ModulesComponent } from './modules/modules.component';
import { RulesComponent } from './rules/rules.component';
import { JournalComponent } from './journal/journal.component';
import { ProfileComponent } from './profile/profile.component';
import { DosingRecipesComponent } from './dosing-recipes/dosing-recipes.component';
import { CanDeactivateGuard } from '../../guards/can-deactivate.guard';
import { MotorControlsComponent } from './motor-controls/motor-controls.component';

const routes: Routes = [
  {
    path: 'dashboard/:guid',
    component: DashboardComponent
  },
  {
    path: 'modules',
    component: ModulesComponent,
    canDeactivate: [CanDeactivateGuard]
  },
  {
    path: 'rules',
    component: RulesComponent,
    canDeactivate: [CanDeactivateGuard]
  },
  {
    path: 'journal',
    component: JournalComponent
  },
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'dosing-recipes',
    component: DosingRecipesComponent,
    canDeactivate: [CanDeactivateGuard]
  },
  {
    path: 'motor-controls',
    component: MotorControlsComponent,
    canDeactivate: [CanDeactivateGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ControllerRoutingModule { }
