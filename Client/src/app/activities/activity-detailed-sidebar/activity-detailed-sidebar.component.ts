import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { IAttendee } from 'src/app/shared/models/attendee';

@Component({
  selector: 'app-activity-detailed-sidebar',
  templateUrl: './activity-detailed-sidebar.component.html',
  styleUrls: ['./activity-detailed-sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ActivityDetailedSidebarComponent implements OnInit {
  @Input() attendees: IAttendee[];

  constructor() { }

  ngOnInit() {
  }

}
