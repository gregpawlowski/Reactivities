import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { IActivity, ActivityService } from '../../shared/services/activity.service';
import { Observable } from 'rxjs';
import { Store } from '@store';
import { Router } from '@angular/router';

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
