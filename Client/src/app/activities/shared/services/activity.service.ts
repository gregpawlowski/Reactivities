import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { tap, distinctUntilChanged, map } from 'rxjs/operators';

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
  private activitiesSubject = new BehaviorSubject<IActivity[]>(undefined);
  private selectedActivitySubject = new BehaviorSubject<IActivity>(undefined);

  activities$ = this.activitiesSubject.asObservable()
    .pipe(distinctUntilChanged());

  selectedActivity$ = this.selectedActivitySubject.asObservable()
    .pipe(distinctUntilChanged());

  get activities() {
    return this.activitiesSubject.value;
  }

  get selectedActivity() {
    return this.selectedActivitySubject.value;
  }

  constructor(private http: HttpClient) { }

  getActivities() {
    return this.http.get<IActivity[]>(apiBase + 'activities')
      .pipe(
        map(res => res.map(a => {
          a.date = a.date.split('.')[0];
          return a;
        })),
        tap(activities => this.activitiesSubject.next(activities))
        );
  }

  setSelectedActivity(id?: string) {
    if (id) {
      const foundActivity = this.activities.find(activity => activity.id === id);
      this.selectedActivitySubject.next({...foundActivity});
    } else {
      this.selectedActivitySubject.next(undefined);
    }
  }

  createActivity(activity: IActivity) {
    this.activitiesSubject.next([...this.activities, {...activity}]);
    this.selectedActivitySubject.next(activity);
  }

  editActivity(activity: IActivity) {
    this.activitiesSubject.next([...this.activities.filter(a => a.id !== activity.id), {...activity}]);
  }

  deleteActivity(id: string) {
    this.activitiesSubject.next([...this.activities.filter(a => a.id !== id)]);
  }

}
