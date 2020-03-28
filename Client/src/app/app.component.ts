import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivityService, IActivity } from './shared/services/activity.service';
import { Store } from '@store';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'Reactivities';
  loading$ = this.store.select<boolean>('loading');

  constructor(private store: Store) {}

  ngOnInit() {
  }

}
