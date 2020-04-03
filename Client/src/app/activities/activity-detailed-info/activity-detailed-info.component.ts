import { Component, OnInit, Input } from '@angular/core';
import { IActivity } from 'src/app/shared/services/activity.service';

@Component({
  selector: 'app-activity-detailed-info',
  templateUrl: './activity-detailed-info.component.html',
  styleUrls: ['./activity-detailed-info.component.scss']
})
export class ActivityDetailedInfoComponent implements OnInit {
  @Input() activity: IActivity;
  constructor() { }

  ngOnInit() {
  }

}
