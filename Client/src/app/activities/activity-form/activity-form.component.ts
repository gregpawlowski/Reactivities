import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivityService, IActivity } from '../../shared/services/activity.service';
import { NgForm } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { Store } from '@store';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';


interface IActivityFormValues extends IActivity {
  time: Date;
}
@Component({
  selector: 'app-activity-form',
  templateUrl: './activity-form.component.html',
  styleUrls: ['./activity-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityFormComponent implements OnInit {
  submitting = false;

  activityFormValues: IActivityFormValues = {
    id: undefined,
    title: '',
    description: '',
    date: null,
    time: null,
    category: '',
    city: '',
    venue: '',
  };

  categories = [
    { label: 'Drinks', value: 'drinks'},
    { label: 'Culture', value: 'culture'},
    { label: 'Film', value: 'film'},
    { label: 'Food', value: 'food'},
    { label: 'Music', value: 'music'},
    { label: 'Travel', value: 'travel'}
  ];

  constructor(
    private activityService: ActivityService,
    private store: Store,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef,
    private toast: ToastrService
    ) { }

  ngOnInit() {
    // ID exists so we want to populate the activity information
    if (this.route.snapshot.params.id) {
      this.activityService.getActivityDetails(this.route.snapshot.params.id)
        .subscribe(() => {
          this.activityFormValues = { ...this.store.value.activity, time: this.store.value.activity.date };
          this.cd.markForCheck();
        });
    }
  }

  handleSubmit(form: NgForm) {
    this.submitting = true;

    const {date, time, ...activityWithoutDate} = this.activityFormValues;
    const activity: IActivity = { ...activityWithoutDate, date: this.combineDateAndTime(date, time) };

    if (!this.activityFormValues.id) {
      const id = uuid();
      this.activityService.createActivity({...activity, id })
        .subscribe(() => {
          this.submitting = false;
          this.router.navigate(['/activities', id]);
        }, (err) => {
          console.log(this);
          this.submitting = false;
          this.toast.error('Problem Submitting Data');
          this.cd.markForCheck();
        });
    } else {
      this.activityService.updateActivity(activity)
        .subscribe(() => {
          this.submitting = false;
          this.router.navigate(['/activities', this.activityFormValues.id]);
        }, (err) => {
          this.submitting = false;
          this.toast.error('Problem Submitting Data');
          this.cd.markForCheck();
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

  combineDateAndTime(date: Date, time: Date) {
    const timeString = time.getHours() + ':' + time.getMinutes() + ':00';

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const dateString = `${year}-${month}-${day}`;

    return new Date(dateString + ' ' + timeString);
  }
}
