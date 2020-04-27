import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { IProfile } from 'src/app/shared/models/profile';
import { Observable, Subscription } from 'rxjs';
import { switchMap, distinctUntilChanged, finalize, delay } from 'rxjs/operators';

@Component({
  selector: 'app-profile-followings',
  templateUrl: './profile-followings.component.html',
  styles: []
})
export class ProfileFollowingsComponent implements OnInit, OnDestroy {
  @Input() type: string;

  @Output() loading = new EventEmitter<boolean>();

  profile: IProfile;
  followings: IProfile[];

  subscription: Subscription;

  constructor(public profileService: ProfileService) { }

  ngOnInit() {
    this.subscription = this.profileService.profile$
      .pipe(
        distinctUntilChanged(),
        switchMap(profile => {
          this.profile = profile;
          return this.profileService.getFollowingList(this.type, this.profile.username);
        })
        )
      .subscribe(followings => {
        this.followings = followings;
        this.loading.emit(false);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
