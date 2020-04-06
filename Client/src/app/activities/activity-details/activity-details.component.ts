import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { ActivityService, IActivity } from '../../shared/services/activity.service';
import { Observable, Subscription } from 'rxjs';
import { Store } from '@store';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityDetailsComponent implements OnInit {
  activity$ = this.store.select<IActivity>('activity');

  constructor(private route: ActivatedRoute, private router: Router, private activityService: ActivityService, private store: Store) { }

  ngOnInit() {
    this.activityService.getActivityDetails(this.route.snapshot.params.id)
      .subscribe(() => {}, (err) => {
        this.store.set('loading', false);
      });
  }

  onCancel() {
    this.router.navigate(['/', 'activities']);
  }

  onEdit(activity: IActivity) {
    this.router.navigate(['/', 'activities', activity.id, 'edit']);
  }

}
