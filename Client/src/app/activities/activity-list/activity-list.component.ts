import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IActivity, ActivityService } from '../shared/services/activity.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss']
})
export class ActivityListComponent implements OnInit {
  activities$: Observable<IActivity[]>;
  @Output() toggleEdit = new EventEmitter<boolean>();

  constructor(private activityService: ActivityService) { }

  ngOnInit() {
    this.activities$ = this.activityService.activities$;
    this.activityService.getActivities().subscribe();
  }

  setActivity(id: string) {
    this.activityService.setSelectedActivity(id);
    this.toggleEdit.emit(false);
  }

  deleteActivity(id: string) {
    this.activityService.deleteActivity(id);
  }

}
