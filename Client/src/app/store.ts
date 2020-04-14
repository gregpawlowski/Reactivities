import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, pluck, filter, map, shareReplay } from 'rxjs/operators';

import { IActivity } from './shared/services/activity.service';
import { Injectable } from '@angular/core';


export interface State {
  activities: IActivity[];
  loading: boolean;
  loaderContent: string;
  activity: IActivity;
}

const state: State = {
  activities: undefined,
  loading: false,
  activity: undefined,
  loaderContent: undefined
};

@Injectable({
  providedIn: 'root'
})
export class Store {
  private subject = new BehaviorSubject(state);
  private store = this.subject.asObservable()
    .pipe(
      distinctUntilChanged()
    );

  get value() {
    return this.subject.value;
  }

  select<T>(name: string): Observable<T> {
    return this.store.pipe(
      pluck(name)
    );
  }

  set(name: string, newState: any) {
    this.subject.next({
      ...this.value,
      [name]: newState
    });
  }

  activitiesByDate$() {
    return this.select<IActivity[]>('activities')
      .pipe(
        shareReplay(1),
        filter<IActivity[]>(Boolean),
        map(a => this.groupActivitiesByDate(a))
      );
  }

  groupActivitiesByDate(activities: IActivity[]) {
    const sortedActivities = activities.sort((a, b) => a.date.getTime() - b.date.getTime());

    return Object.entries(sortedActivities.reduce((acc, activity) => {

      const date = activity.date.toLocaleString().split(',')[0];

      acc[date] = acc[date] ? [...acc[date], activity] : [activity];
      return acc;
    }, {} as {[key: string]: IActivity[]}));
  }
}
