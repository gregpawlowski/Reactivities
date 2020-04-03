import { Component, OnInit, Input, ViewEncapsulation, Directive } from '@angular/core';
import { IActivity, ActivityService } from 'src/app/shared/services/activity.service';
import { Router } from '@angular/router';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'app-activity-list-item',
  templateUrl: './activity-list-item.component.html',
  styleUrls: ['./activity-list-item.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ActivityListItemComponent implements OnInit {
  @Input() activity: IActivity;

  constructor(private activityService: ActivityService, private router: Router) { }

  ngOnInit() {
  }

  onViewClick(activity: IActivity) {
    this.activityService.setActivity(activity);
    this.router.navigate(['activities', activity.id]);
  }

  // deleteActivity(id: string) {
  //   this.submitting = true;
  //   this.targetId = id;
  //   this.activityService.deleteActivity(id)
  //     .subscribe(() => {
  //       this.submitting = false;
  //       this.targetId = '';
  //     });
  // }

}
