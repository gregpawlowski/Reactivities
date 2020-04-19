import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivityService } from '../../shared/services/activity.service';
import { Store } from '@store';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

  constructor(private activityService: ActivityService) { }

  ngOnInit() {
    this.activityService.getActivities()
      .subscribe();
  }

}
