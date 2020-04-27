import { Component, OnInit, Input } from '@angular/core';
import { IProfile } from 'src/app/shared/models/profile';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-header.component.html',
  styleUrls: ['./profile-header.component.scss']
})
export class ProfileHeaderComponent implements OnInit {
  @Input() profile: IProfile;
  loading = false;

  constructor(public profileService: ProfileService) { }

  ngOnInit() {
  }

  onFollowingClick(type: string, username: string) {
    this.loading = true;

    if (type === 'follow') {
      this.profileService.followUser(username)
        .pipe(finalize(() => this.loading = false))
        .subscribe();
    }

    if (type === 'unfollow') {
      this.profileService.unFollowUser(username)
        .pipe(finalize(() => this.loading = false))
        .subscribe();
    }
  }

}
