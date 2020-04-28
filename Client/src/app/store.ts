import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, pluck, filter, map, shareReplay } from 'rxjs/operators';


import { Injectable } from '@angular/core';
import { IUser } from './shared/models/user';
import { IActivity } from './shared/models/activity';
import { IProfile } from './shared/models/profile';


export interface State {
  activities: IActivity[];
  loading: boolean;
  loaderContent: string;
  activity: IActivity;
  user: IUser;
  profile: IProfile;
}

const state: State = {
  activities: [],
  loading: false,
  activity: undefined,
  loaderContent: undefined,
  user: undefined,
  profile: undefined
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
}
