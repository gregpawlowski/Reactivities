import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivityService, IActivity } from '../../shared/services/activity.service';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Store } from '@store';

@Component({
  selector: 'app-activity-form',
  templateUrl: './activity-form.component.html',
  styleUrls: ['./activity-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityFormComponent implements OnInit, OnDestroy {
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
  subscription: Subscription;

  constructor(private activityService: ActivityService, private store: Store, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.subscription = this.store.select<IActivity>('selectedActivity').subscribe(
      activity => {
        if (activity) {
              this.activity = {...activity};
            } else {
              this.activity = {
                id: '',
                title: '',
                description: '',
                date: '',
                category: '',
                city: '',
                venue: '',
              };
            }
        this.cd.markForCheck();
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  handleSubmit(form: NgForm) {
    this.submitting = true;

    if (this.activity.id.length === 0) {
      const id = uuid();
      this.activityService.createActivity({...this.activity, id})
        .subscribe(() => {
          this.submitting = false;
          this.store.set('editMode', false);
        });
    } else {
      this.activityService.updateActivity(this.activity)
        .subscribe(() => {
          this.submitting = false;
          this.store.set('editMode', false);
        });
    }
  }

  handleCancel() {
    this.store.set('editMode', false);
  }

}
