import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivityService, IActivity } from '../../shared/services/activity.service';
import { Store } from '@store';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  editMode$ = this.store.select<boolean>('editMode');

  constructor(private store: Store) { }

  ngOnInit() {
  }

}
