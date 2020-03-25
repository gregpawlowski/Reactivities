import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivityService, IActivity } from '../shared/services/activity.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @Input() editMode: boolean;
  @Output() toggleEdit = new EventEmitter();

  activities$: Observable<IActivity[]>;

  constructor(private activityService: ActivityService) { }

  ngOnInit() {
    this.activities$ = this.activityService.getActivities();
  }

  onToggleEdit(event) {
    this.toggleEdit.emit(event);
  }

}
