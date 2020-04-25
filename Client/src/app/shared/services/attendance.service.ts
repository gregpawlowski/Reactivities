import { Injectable } from '@angular/core';
import { IUser } from '../models/user';
import { IAttendee } from '../models/attendee';
import { Store } from '@store';
import { ActivityDetailedChatComponent } from 'src/app/activities/activity-detailed-chat/activity-detailed-chat.component';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { LoadingService } from './loading.service';
import { catchError, tap, finalize, delay } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { throwError } from 'rxjs';

const baseUrl = environment.apiBaseUrl + 'api/';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  constructor(private store: Store, private http: HttpClient, private loading: LoadingService, private toastr: ToastrService) { }

  attendActivity(id: string) {
    const attendee = this.createAttendee(this.store.value.user);
    const activity = {...this.store.value.activity};

    return this.http.post(baseUrl + 'activities/' + id + '/attend', {})
      .pipe(
        delay(1000),
        tap(() => {
          activity.isGoing = true;
          activity.attendees.push(attendee);
          this.store.set('activity', activity);
        }),
        catchError(err => {
          this.toastr.error('Problem signing up for activity');
          return throwError(err);
        })
      );
  }

  cancelAttendance(id: string) {
    const activity = { ...this.store.value.activity };

    return this.http.delete(baseUrl + 'activities/' + id + '/attend')
    .pipe(
      delay(1000),
      tap(() => {
        activity.isGoing = false;
        activity.attendees = activity.attendees.filter(attendee => attendee.username !== this.store.value.user.username);
        this.store.set('activity', activity);
      }),
      catchError(err => {
        this.toastr.error('Problem cancelling attendance');
        return throwError(err);
      })
      );
  }


  createAttendee(user: IUser): IAttendee {
     return {
       displayName: user.displayName,
       isHost: false,
       username: user.username,
       image: user.image
     };
  }
}
