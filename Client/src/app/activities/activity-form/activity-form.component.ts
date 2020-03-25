import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { ActivityService, IActivity } from '../shared/services/activity.service';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-activity-form',
  templateUrl: './activity-form.component.html',
  styleUrls: ['./activity-form.component.scss']
})
export class ActivityFormComponent implements OnInit, OnDestroy {
  @Output() toggleEdit = new EventEmitter<boolean>();

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

  constructor(private activityService: ActivityService) { }

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.subscription = this.activityService.selectedActivity$.subscribe(
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
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  handleSubmit(form: NgForm) {
    if (this.activity.id.length === 0) {
      const id = uuid();
      this.activityService.createActivity({...this.activity, id});
      this.toggleEdit.emit(false);
      this.activityService.setSelectedActivity(id);
    } else {
      this.activityService.editActivity(this.activity);
      this.toggleEdit.emit(false);
      this.activityService.setSelectedActivity(this.activity.id);
    }
  }

  handleCancel() {
    this.toggleEdit.emit(false);
  }

}
