import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ActivityService } from '../activities/shared/services/activity.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Output() showEdit = new EventEmitter<boolean>();

  constructor(private activityService: ActivityService) { }

  ngOnInit() {
  }

  onCreateClick() {
    this.activityService.setSelectedActivity(undefined);
    this.showEdit.emit(true);
  }

}
