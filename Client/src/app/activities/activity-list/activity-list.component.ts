import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { IActivity, ActivityService } from '../../shared/services/activity.service';
import { Observable } from 'rxjs';
import { Store } from '@store';

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

  constructor(private activityService: ActivityService, private store: Store) { }

  ngOnInit() {
    this.activityService.getActivities()
      .subscribe();
  }

  setActivity(id: string) {
    this.activityService.setSelectedActivity(id);
    this.store.set('editMode', false);
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
