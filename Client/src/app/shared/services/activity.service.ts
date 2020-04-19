import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { tap, distinctUntilChanged, map, delay, filter, catchError, shareReplay } from 'rxjs/operators';
import { Store } from '@store';
import { LoadingService } from './loading.service';
import { IActivity } from '../models/activity';
import { IUser } from '../models/user';
import { AttendanceService } from './attendance.service';

const apiBase = environment.apiBase;

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

  getActivities() {
    this.loadingService.startLoading('Loading Activities');
    const user = this.store.value.user;

    return this.http.get<IActivity[]>(apiBase + 'activities')
      .pipe(
        delay(1000),
        map(activites => activites.map(activity => this.setActivityProps(activity, user))),
        tap(activities => {
          this.store.set('activities', activities);
          this.loadingService.stopLoading();
        }),
        catchError(err => {
          this.loadingService.stopLoading();
          return throwError(err);
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
      const user = this.store.value.user;
      return this.http.get<IActivity>(apiBase + 'activities/' + id)
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
    return this.http.post(apiBase + 'activities', activity)
      .pipe(
        delay(1000),
        tap(() => {
          const attendee = this.attendanceService.createAttendee(this.store.value.user);
          attendee.isHost = true;
          activity.attendees = [attendee];
          activity.isHost = true;

          if (this.store.value.activities) {
            this.store.set('activities', [...this.store.value.activities, activity]);
          }

          this.store.set('activity', activity);
        })
      );
  }

  updateActivity(activity: IActivity) {
    return this.http.put(apiBase + 'activities/' + activity.id, activity)
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
    return this.http.delete(apiBase + 'activities/' + id)
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
    }, {} as {[key: string]: IActivity[]}));
  }

  setActivityProps(activity: IActivity, user: IUser) {
      activity.date = new Date(activity.date);
      activity.isGoing = activity.attendees.some(attendee => attendee.username === user.username);
      activity.isHost = activity.attendees.some(attendee => attendee.username === user.username && attendee.isHost);
      return activity;
  }

}
