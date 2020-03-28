import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { tap, distinctUntilChanged, map, delay, filter } from 'rxjs/operators';
import { Store } from '@store';

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
  // private activitiesSubject = new BehaviorSubject<IActivity[]>(undefined);
  // private selectedActivitySubject = new BehaviorSubject<IActivity>(undefined);

  // activities$ = this.activitiesSubject.asObservable()
  //   .pipe(
  //     distinctUntilChanged(),
  //     filter<IActivity[]>(Boolean),
  //     map(activities => activities.sort((a, b) => Date.parse(a.date) - Date.parse(b.date)))
  //     );

  // selectedActivity$ = this.selectedActivitySubject.asObservable()
  //   .pipe(distinctUntilChanged());

  // get activities() {
  //   return this.activitiesSubject.value;
  // }

  // get selectedActivity() {
  //   return this.selectedActivitySubject.value;
  // }

  constructor(private http: HttpClient, private store: Store) { }

  getActivities() {
    this.store.set('loading', true);

    return this.http.get<IActivity[]>(apiBase + 'activities')
      .pipe(
        delay(1000),
        map(res => res.map(a => {
          a.date = a.date.split('.')[0];
          return a;
        })),
        tap(activities => {
          this.store.set('activities', activities);
          this.store.set('loading', false);
        })
        );
  }

  getActivityDetails(id) {
    return this.http.get<IActivity>(apiBase + 'id')
      .pipe(
        delay(100)
      );
  }

  setSelectedActivity(id?: string) {
    if (id) {
      const foundActivity = this.store.value.activities.find(activity => activity.id === id);
      this.store.set('selectedActivity', foundActivity);
    } else {
      this.store.set('selectedActivity', undefined);
    }
  }

  createActivity(activity: IActivity) {
    return this.http.post(apiBase + 'activities', activity)
      .pipe(
        delay(1000),
        tap(() => {
          this.store.set('activities', [...this.store.value.activities, { ...activity }]);
          this.store.set('selectedActivity', activity);
        })
      );
  }

  updateActivity(activity: IActivity) {
    return this.http.put(apiBase + 'activities/' + activity.id, activity)
      .pipe(
        delay(1000),
        tap(() => {
          this.store.set('activities', [...this.store.value.activities.filter(a => a.id !== activity.id), {...activity}]);
          this.store.set('selectedActivity', activity);
        })
      );
  }

  deleteActivity(id: string) {
    return this.http.delete(apiBase + 'activities/' + id)
      .pipe(
        delay(1000),
        tap(() => {
          this.store.set('activities', ([...this.store.value.activities.filter(a => a.id !== id)]));

          if (this.store.value.selectedActivity && (this.store.value.selectedActivity.id === id)) {
            this.store.set('selectedActivity', undefined);
          }
        })
      );
  }

}
