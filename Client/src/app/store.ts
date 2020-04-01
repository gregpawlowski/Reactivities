import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, pluck, filter, map } from 'rxjs/operators';

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

  selectOrderedActivities() {
    return this.select<IActivity[]>('activities')
      .pipe(
        filter<IActivity[]>(Boolean),
        map(activities => activities.sort((a, b) => Date.parse(a.date) - Date.parse(b.date)))
      );
  }
}
