import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IProfile, IPhoto } from '../models/profile';
import { Store } from '@store';
import { tap, finalize, catchError, delay, debounce } from 'rxjs/operators';
import { LoadingService } from './loading.service';
import { UserService } from './user.service';
import { ToastrService } from 'ngx-toastr';
import { IUserActivity } from '../models/userActivity';
import { of } from 'rxjs';

const baseURL = environment.apiBaseUrl + 'api/';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(
    private http: HttpClient,
    private store: Store,
    private loadingService: LoadingService,
    private userService: UserService,
    private toastr: ToastrService
  ) { }

  get profile$() {
    return this.store.select<IProfile>('profile');
  }

  set profile(profile: IProfile) {
    this.store.set('profile', profile);
  }

  get profile() {
    return this.store.value.profile;
  }

  getProfile(username) {
    this.loadingService.startLoading('Loading profile...');

    return this.http.get<IProfile>(baseURL + 'profiles/' + username)
      .pipe(
        delay(1000),
        tap(profile => this.store.set('profile', profile)),
        finalize(() => this.loadingService.stopLoading())
        // catchError(err => console.log(err)),
      );
  }

  isCurrentUser() {
      return this.userService.user.username === this.profile.username;
  }

  uploadPhoto(file: Blob) {
    const uploadData = new FormData();
    uploadData.append('File', file);

    return this.http.post<IPhoto>(baseURL + 'photos', uploadData)
      .pipe(
        tap(photoFromApi => {
          const profile = this.profile;
          profile.photos.push(photoFromApi);
          this.profile = profile;
          if (photoFromApi.isMain) {
            this.userService.user.image = photoFromApi.url;
            this.profile.image = photoFromApi.url;
          }
        })
      );
  }

  setMainPhoto(photo: IPhoto) {
    return this.http.post(baseURL + 'photos/' + photo.id + '/setMain', {})
      .pipe(
        delay(1000),
        tap(() => {
          const photos = this.profile.photos.map(p => {
            if (p.isMain) {
              p.isMain = false;
            }
            if (p.id === photo.id) {
              p.isMain = true;
            }
            return p;
          });

          const newProfile = { ...this.profile, photos, image: photo.url };
          this.profile = newProfile;

          const newUser = { ...this.userService.user, image: photo.url };
          this.userService.user = newUser;
        })
      );
  }

  deletePhoto(photo: IPhoto) {
    return this.http.delete(baseURL + 'photos/' + photo.id)
      .pipe(
        delay(1000),
        tap(() => {
          const photos = this.profile.photos.filter(p => p.id !== photo.id);
          this.profile = {...this.profile, photos};
        })
      );
  }

  updateProfile(values: { displayName: string, bio: string }) {
    return this.http.put(baseURL + 'profiles', values)
      .pipe(
        delay(1000),
        tap(() => {
          const currentProfile = this.profile;
          this.profile = {...currentProfile, ...values};
          const currentUser = this.userService.user;
          this.userService.user = { ...currentUser, displayName: values.displayName };
        })
      );
  }

  unFollowUser(username: string) {
    return this.http.delete(baseURL + 'profiles/' + username + '/follow')
      .pipe(
        delay(1000),
        tap(() => {
          const currentProfile = {...this.profile};
          currentProfile.following = false;
          currentProfile.followersCount -= 1;

          this.profile = currentProfile;
        }),
        catchError((error) => {
          this.toastr.error('Problem following user');
          return error;
        })
      );
  }

  followUser(username: string) {
    return this.http.post(baseURL + 'profiles/' + username + '/follow', {})
      .pipe(
        delay(1000),
        tap(() => {
          const currentProfile = {...this.profile};
          currentProfile.following = true;
          currentProfile.followersCount += 1;

          this.profile = currentProfile;
        }),
        catchError((error) => {
          this.toastr.error('Problem following user');
          return error;
        })
      );
  }

  getFollowingList(predicate: string, username: string) {
    let params = new HttpParams();
    params = params.set('predicate', predicate);

    return this.http.get<IProfile[]>(baseURL + 'profiles/' + username + '/follow', {params})
      .pipe(delay(1000));
  }

  getUserActivities(username, predicate) {
    let params = new HttpParams();
    params = params.append('predicate', predicate);

    return this.http.get<IUserActivity[]>(baseURL + 'profiles/' + username + '/activities', {params})
      .pipe(
        delay(1000)
      );
  }
}
