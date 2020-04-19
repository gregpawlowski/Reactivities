import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { ActivityService } from '../../shared/services/activity.service';

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ActivityListComponent implements OnInit {
  groupedActivities$ = this.activityService.activitiesByDate$();

  constructor(private activityService: ActivityService) { }

  ngOnInit() {
  }

}
