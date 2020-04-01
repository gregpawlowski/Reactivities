import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ActivityFormComponent } from './activity-form/activity-form.component';
import { ActivityDetailsComponent } from './activity-details/activity-details.component';
import { ActivityDetailsResolverService } from '../shared/resolvers/activity-details-resolver.service';

const routes: Routes = [
  { path: '', component: DashboardComponent},
  { path: 'new', component: ActivityFormComponent },
  { path: ':id', component: ActivityDetailsComponent },
  { path: ':id/edit', component: ActivityFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActivitiesRoutingModule { }
