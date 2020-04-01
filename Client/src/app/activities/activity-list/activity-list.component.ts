import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { IActivity, ActivityService } from '../../shared/services/activity.service';
import { Observable } from 'rxjs';
import { Store } from '@store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityListComponent implements OnInit {
  activities$ = this.store.selectOrderedActivities();
  submitting = false;
  targetId = '';

  constructor(private activityService: ActivityService, private store: Store, private router: Router) { }

  ngOnInit() {
  }

  onViewClick(activity: IActivity) {
    this.activityService.setActivity(activity);
    this.router.navigate(['activities', activity.id]);
  }

  deleteActivity(id: string) {
    this.submitting = true;
    this.targetId = id;
    this.activityService.deleteActivity(id)
      .subscribe(() => {
        this.submitting = false;
        this.targetId = '';
      });
  }

}
