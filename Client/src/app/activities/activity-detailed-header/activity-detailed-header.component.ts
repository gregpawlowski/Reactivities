import { Component, OnInit, Input } from '@angular/core';
import { IActivity } from 'src/app/shared/services/activity.service';

@Component({
  selector: 'app-activity-detailed-header',
  templateUrl: './activity-detailed-header.component.html',
  styleUrls: ['./activity-detailed-header.component.scss']
})
export class ActivityDetailedHeaderComponent implements OnInit {
  @Input() activity: IActivity;

  constructor() { }

  ngOnInit() {
  }

}
