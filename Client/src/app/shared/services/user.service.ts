import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, of } from 'rxjs';
import { tap, distinctUntilChanged, map, delay, filter, catchError, shareReplay } from 'rxjs/operators';
import { Store } from '@store';
import { LoadingService } from './loading.service';
import { IUserFormValues, IUser } from '../models/user';

const apiBase = environment.apiBaseUrl + 'api/';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  get isLoggedIn() {
     return !!this.store.value.user;
  }

  get user() {
    return this.store.value.user;
  }

  set user(user: IUser) {
    this.store.set('user', user);
  }

  get user$() {
    return this.store.select<IUser>('user');
  }

  constructor(private http: HttpClient, private store: Store, private loadingService: LoadingService) { }

  getCurrentUser() {
    return this.http.get<IUser>(apiBase + 'user')
      .pipe(
        delay(1000),
        tap(user => {
          this.store.set('user', user);
        })
      );
  }

  login(values: IUserFormValues) {
    return this.http.post<IUser>(apiBase + 'user/login', values)
      .pipe(
        tap(user => {
          this.store.set('user', user);
          this.setToken(user.token);
        })
      );
  }

  register(values: IUserFormValues) {
    return this.http.post<IUser>(apiBase + 'user/register', values)
      .pipe(
        tap(user => {
          this.store.set('user', user);
          this.setToken(user.token);
        })
      );
  }

  private setToken(token?: string) {
    if (token) {
      localStorage.setItem('jwt', token);
    } else {
      localStorage.removeItem('jwt');
    }
  }

  logout() {
    this.setToken();
    this.store.set('user', undefined);
  }
}
