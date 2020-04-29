import { Component, OnInit, OnDestroy } from '@angular/core';
import { Moment } from 'moment';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { LoadingService } from 'src/app/shared/services/loading.service';

@Component({
  selector: 'app-activity-filters',
  templateUrl: './activity-filters.component.html',
  styles: []
})
export class ActivityFiltersComponent implements OnInit, OnDestroy {
  predicate = this.activityService.predicate;

  constructor(private activityService: ActivityService, private loadingService: LoadingService) { }

  ngOnInit() {
  }

  dateChanged() {
    this.loadingService.startLoadingActivities();
    this.activityService.resetActivites();
    this.activityService.getActivities()
      .subscribe(() => this.loadingService.stopLoadingActivites());
  }

  ngOnDestroy() {
    // Remove all predicates
    // this.activityService.predicate.clear();
  }

  predicateChange(predicate) {
    this.loadingService.startLoadingActivities();
    switch (predicate) {
      case 'all':
        this.predicate.isGoing = false;
        this.predicate.isHost = false;
        break;
      case 'isGoing':
        this.predicate.isGoing = true;
        this.predicate.isHost = false;
        break;
      case 'isHost':
        this.predicate.isHost = true;
        this.predicate.isGoing = false;
        break;
    }

    this.activityService.resetActivites();
    this.activityService.getActivities()
      .subscribe(() => this.loadingService.stopLoadingActivites());
  }
}
