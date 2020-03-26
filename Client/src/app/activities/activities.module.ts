import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ActivityListComponent } from './activity-list/activity-list.component';
import { ActivityDetailsComponent } from './activity-details/activity-details.component';
import { ActivityFormComponent } from './activity-form/activity-form.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [DashboardComponent, ActivityListComponent, ActivityDetailsComponent, ActivityFormComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule
  ],
  exports: [DashboardComponent]
})
export class ActivitiesModule { }
