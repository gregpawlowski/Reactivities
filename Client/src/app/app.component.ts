import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivityService, IActivity } from './shared/services/activity.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'Reactivities';
  editMode = false;
  loading = true;
  activities: IActivity[];

  constructor(private activityService: ActivityService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.activityService.getActivities()
      .subscribe(() => {
        this.loading = false;
      });
  }

  onShowEdit(bool: boolean) {
    this.editMode = bool;
  }

}
