import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, of } from 'rxjs';
import { tap, distinctUntilChanged, map, delay, filter, catchError, shareReplay } from 'rxjs/operators';
import { Store } from '@store';
import { LoadingService } from './loading.service';

const apiBase = environment.apiBase;

export interface IActivity {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  city: string;
  venue: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  constructor(private http: HttpClient, private store: Store, private loadingService: LoadingService) { }

  getActivities() {
    this.loadingService.startLoading('Loading Activities');

    return this.http.get<IActivity[]>(apiBase + 'activities')
      .pipe(
        delay(1000),
        map(res => res.map(a => {
          a.date = a.date.split('.')[0];
          return a;
        })),
        tap(activities => {
          this.store.set('activities', activities);
          this.loadingService.stopLoading();
        })
        );
  }

  getActivityDetails(id: string) {
    if (this.store.value.activity && this.store.value.activity.id === id) {
      return of(this.store.value.activity);
    }

    const activityFromStore = this.store.value.activities && this.store.value.activities.find(a => a.id === id);

    if (activityFromStore) {
      return of(activityFromStore);
    } else {
      this.loadingService.startLoading('Loading Activity');
      return this.http.get<IActivity>(apiBase + 'activities/' + id)
        .pipe(
          delay(1000),
          map(a => {
            if (a) {
              a.date = a.date.split('.')[0];
              return a;
            }
          }),
          tap(activity => {
            this.store.set('activity', activity);
            this.loadingService.stopLoading();
          }),
          catchError(() => {
            console.log('There was an error loading the activity');
            this.loadingService.stopLoading();
            return of(undefined);
          })
        );
    }
  }

  setActivity(activity?: IActivity) {
    this.store.set('activity', activity ? activity : undefined);
  }

  createActivity(activity: IActivity) {
    return this.http.post(apiBase + 'activities', activity)
      .pipe(
        delay(1000),
        tap(() => {
          this.store.set('activities', [...this.store.value.activities, { ...activity }]);
          this.store.set('activity', activity);
        })
      );
  }

  updateActivity(activity: IActivity) {
    return this.http.put(apiBase + 'activities/' + activity.id, activity)
      .pipe(
        delay(1000),
        tap(() => {
          this.store.set('activities', [...this.store.value.activities.filter(a => a.id !== activity.id), {...activity}]);
          this.store.set('activity', activity);
        })
      );
  }

  deleteActivity(id: string) {
    return this.http.delete(apiBase + 'activities/' + id)
      .pipe(
        delay(1000),
        tap(() => {
          this.store.set('activities', ([...this.store.value.activities.filter(a => a.id !== id)]));
        })
      );
  }

}
