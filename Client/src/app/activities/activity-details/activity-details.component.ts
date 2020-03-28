import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { ActivityService, IActivity } from '../../shared/services/activity.service';
import { Observable, Subscription } from 'rxjs';
import { Store } from '@store';

@Component({
  selector: 'app-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityDetailsComponent implements OnInit {
  activity$ = this.store.select<IActivity>('selectedActivity');

  @Output() toggleEdit = new EventEmitter<boolean>();

  constructor(private activityService: ActivityService, private cd: ChangeDetectorRef, private store: Store) { }

  ngOnInit() {
  }

  onToggleEdit() {
    this.store.set('editMode', true);
  }

  onCancel() {
    this.activityService.setSelectedActivity();
  }

}
