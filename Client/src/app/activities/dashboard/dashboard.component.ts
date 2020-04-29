import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ActivityService, Pagination } from '../../shared/services/activity.service';
import { LoadingService } from 'src/app/shared/services/loading.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  loadingNext = false;
  subscriptions: Subscription[] = [];
  pagination: Pagination;
  loadingActivities = this.loadingService.loadingActivities$;

  constructor(public activityService: ActivityService, private loadingService: LoadingService) { }

  ngOnInit() {
    this.loadingService.startLoadingActivities();
    this.activityService.resetActivites();
    this.subscriptions.push(this.activityService.pagination$
      .subscribe((next) => this.pagination = next));

    this.activityService.getActivities()
      .subscribe(() => this.loadingService.stopLoadingActivites(), () => this.loadingService.stopLoadingActivites());
  }

  handleNext() {
    const { page, totalPages } = this.pagination;
    if (totalPages === page + 1) {
      return;
    }
    this.loadingNext = true;
    this.activityService.pagination.next({...this.pagination, page: page + 1});
    this.activityService.getActivities()
      .subscribe(() => this.loadingNext = false);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
