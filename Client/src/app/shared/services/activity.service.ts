import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { tap, distinctUntilChanged, map, delay, filter, catchError, shareReplay, pluck } from 'rxjs/operators';
import { Store } from '@store';
import { LoadingService } from './loading.service';
import { IActivity } from '../models/activity';
import { IUser } from '../models/user';
import { AttendanceService } from './attendance.service';

const baseUrl = environment.apiBaseUrl + 'api/';

export interface Pagination {
  page: number;
  limit: number;
  count: number;
  totalPages: number;
}

const defaultPagination = {
    page: 0,
    count: undefined,
    totalPages: undefined,
    limit: 3
};

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  constructor(
    private http: HttpClient,
    private store: Store,
    private loadingService: LoadingService,
    private attendanceService: AttendanceService
  ) { }

  get activity() {
    return this.store.value.activity;
  }

  set activity(value: IActivity) {
    this.store.set('activity', value);
  }

  get activity$() {
    return this.store.select<IActivity>('activity');
  }

  set activities(value: IActivity[]) {
    this.store.set('activities', value);
  }

  pagination = new BehaviorSubject<Pagination>(defaultPagination);
  pagination$ = this.pagination.asObservable();

  predicate = {
    startDate: new Date(),
    isHost: false,
    isGoing: false,
  };

  resetPagination() {
    this.pagination.next(defaultPagination);
  }

  getActivities() {
    const user = this.store.value.user;

    const {page, limit} = this.pagination.value;
    const offset = limit * page;

    const predicates = this.predicate;

    let params = new HttpParams();
    params = params.append('limit', limit.toString());
    params = params.append('offset', offset.toString());

    for (const [key, value] of Object.entries(predicates)) {
      if (key === 'startDate') {
        params = params.append(key, (value as Date).toISOString());
      } else if (value) {
        params = params.append(key, value.toString());
      }
    }

    return this.http.get<{ activites: IActivity[], activityCount: number }>(baseUrl + 'activities', {params})
      .pipe(
        delay(1000),
        tap(res => {
          this.pagination.next(
            {...this.pagination.value,
              count: res.activityCount,
              totalPages: Math.ceil(res.activityCount / this.pagination.value.limit)
            });
        }),
        pluck('activites'),
        map(activites => activites.map(activity => this.setActivityProps(activity, user))),
        tap(activities => {
          this.store.set('activities', [...this.store.value.activities, ...activities]);
        }),
        catchError(err => {
          return throwError(err);
        })
      );
  }

  resetActivites() {
    this.activities = [];
    this.resetPagination();
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
      const user = this.store.value.user;
      return this.http.get<IActivity>(baseUrl + 'activities/' + id)
        .pipe(
          delay(1000),
          map(activity => this.setActivityProps(activity, user)),
          tap(activity => {
            this.store.set('activity', activity);
            this.loadingService.stopLoading();
          })
        );
    }
  }

  setActivity(activity?: IActivity) {
    this.store.set('activity', activity ? activity : undefined);
  }

  createActivity(activity: IActivity) {
    return this.http.post(baseUrl + 'activities', activity)
      .pipe(
        delay(1000),
        tap(() => {
          const attendee = this.attendanceService.createAttendee(this.store.value.user);
          attendee.isHost = true;
          activity.attendees = [attendee];
          activity.isHost = true;
          activity.comments = [];

          if (this.store.value.activities) {
            this.store.set('activities', [...this.store.value.activities, activity]);
          }

          this.store.set('activity', activity);
        })
      );
  }

  updateActivity(activity: IActivity) {
    return this.http.put(baseUrl + 'activities/' + activity.id, activity)
      .pipe(
        delay(1000),
        tap(() => {
          if (this.store.value.activities) {
            this.store.set('activities', [...this.store.value.activities.filter(a => a.id !== activity.id), activity]);
          }
          this.store.set('activity', activity);
        })
      );
  }

  deleteActivity(id: string) {
    return this.http.delete(baseUrl + 'activities/' + id)
      .pipe(
        delay(1000),
        tap(() => {
          this.store.set('activities', ([...this.store.value.activities.filter(a => a.id !== id)]));
        })
      );
  }

  activitiesByDate$() {
    return this.store.select<IActivity[]>('activities')
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
    }, {} as { [key: string]: IActivity[] }));
  }

  setActivityProps(activity: IActivity, user: IUser) {
    activity.date = new Date(activity.date);
    activity.isGoing = activity.attendees.some(attendee => attendee.username === user.username);
    activity.isHost = activity.attendees.some(attendee => attendee.username === user.username && attendee.isHost);
    return activity;
  }

}
