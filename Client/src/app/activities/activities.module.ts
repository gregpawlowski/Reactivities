import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ActivityListComponent } from './activity-list/activity-list.component';
import { ActivityDetailsComponent } from './activity-details/activity-details.component';
import { ActivityFormComponent } from './activity-form/activity-form.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { ActivitiesRoutingModule } from './activities-routing.module';
import { ActivityListItemComponent } from './activity-list-item/activity-list-item.component';
import { ActivityDetailedHeaderComponent } from './activity-detailed-header/activity-detailed-header.component';
import { ActivityDetailedInfoComponent } from './activity-detailed-info/activity-detailed-info.component';
import { ActivityDetailedChatComponent } from './activity-detailed-chat/activity-detailed-chat.component';
import { ActivityDetailedSidebarComponent } from './activity-detailed-sidebar/activity-detailed-sidebar.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ActivityFiltersComponent } from './activity-filters/activity-filters.component';
import { MatDatepickerModule } from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';



@NgModule({
  declarations: [
    DashboardComponent,
    ActivityListComponent,
    ActivityDetailsComponent,
    ActivityFormComponent,
    ActivityListItemComponent,
    ActivityDetailedHeaderComponent,
    ActivityDetailedInfoComponent,
    ActivityDetailedChatComponent,
    ActivityDetailedSidebarComponent,
    NotFoundComponent,
    ActivityFiltersComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ActivitiesRoutingModule,
    InfiniteScrollModule,
    MatDatepickerModule,
    MatMomentDateModule
  ],
  exports: []
})
export class ActivitiesModule { }
