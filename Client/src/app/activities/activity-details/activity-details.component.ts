import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { ActivityService, IActivity } from '../../shared/services/activity.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityDetailsComponent implements OnInit {
  activity$: Observable<IActivity>;
  @Output() toggleEdit = new EventEmitter<boolean>();

  constructor(private activityService: ActivityService, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.activity$ = this.activityService.selectedActivity$;
  }

  onToggleEdit() {
    this.toggleEdit.emit(true);
  }

  onCancel() {
    this.activityService.setSelectedActivity();
  }

}
