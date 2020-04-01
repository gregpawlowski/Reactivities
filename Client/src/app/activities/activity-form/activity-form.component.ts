import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivityService, IActivity } from '../../shared/services/activity.service';
import { NgForm } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { Store } from '@store';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-activity-form',
  templateUrl: './activity-form.component.html',
  styleUrls: ['./activity-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityFormComponent implements OnInit {
  submitting = false;

  activity: IActivity = {
    id: '',
    title: '',
    description: '',
    date: '',
    category: '',
    city: '',
    venue: '',
  };

  constructor(
    private activityService: ActivityService,
    private store: Store,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef
    ) { }

  ngOnInit() {
    // ID exists so we want to populate the activity information
    if (this.route.snapshot.params.id) {
      this.activityService.getActivityDetails(this.route.snapshot.params.id)
        .subscribe(() => {
          this.activity = this.store.value.activity;
          this.cd.markForCheck();
        });
    }
  }

  handleSubmit(form: NgForm) {
    this.submitting = true;

    if (this.activity.id.length === 0) {
      const id = uuid();
      this.activityService.createActivity({...this.activity, id})
        .subscribe(() => {
          this.submitting = false;
        });
    } else {
      this.activityService.updateActivity(this.activity)
        .subscribe(() => {
          this.submitting = false;
        });
    }
  }

  onCancel() {
    const id = this.route.snapshot.params.id;
    if (id) {
      this.router.navigate(['activities', id]);
    } else {
      this.router.navigate(['activities']);
    }
  }

}
