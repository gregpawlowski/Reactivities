import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IProfile, IPhoto } from '../models/profile';
import { Store } from '@store';
import { tap, finalize, catchError, delay } from 'rxjs/operators';
import { LoadingService } from './loading.service';
import { UserService } from './user.service';

const apiBase = environment.apiBase;

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(private http: HttpClient, private store: Store, private loadingService: LoadingService, private userService: UserService) { }

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

    return this.http.get<IProfile>(apiBase + 'profiles/' + username)
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

    return this.http.post<IPhoto>(apiBase + 'photos', uploadData)
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
    return this.http.post(apiBase + 'photos/' + photo.id + '/setMain', {})
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
    return this.http.delete(apiBase + 'photos/' + photo.id)
      .pipe(
        delay(1000),
        tap(() => {
          const photos = this.profile.photos.filter(p => p.id !== photo.id);
          this.profile = {...this.profile, photos};
        })
      );
  }
}
