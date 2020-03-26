import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { IActivity, ActivityService } from '../../shared/services/activity.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityListComponent implements OnInit {
  activities$ = this.activityService.activities$;
  submitting = false;
  targetId = '';
  @Output() toggleEdit = new EventEmitter<boolean>();

  constructor(private activityService: ActivityService) { }

  ngOnInit() {
  }

  setActivity(id: string) {
    this.activityService.setSelectedActivity(id);
    this.toggleEdit.emit(false);
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
