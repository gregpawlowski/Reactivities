import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivityService, IActivity } from '../../shared/services/activity.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  @Input() editMode: boolean;
  @Output() toggleEdit = new EventEmitter();


  constructor() { }

  ngOnInit() {
  }

  onToggleEdit(event) {
    this.toggleEdit.emit(event);
  }

}
