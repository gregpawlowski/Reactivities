import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  profile$ = this.profileService.profile$;
  username: string;

  constructor(private profileService: ProfileService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.profileService.getProfile(params.username)
        .subscribe();
    });
  }

  ngOnDestroy() {
    this.profileService.profile = undefined;
  }

}
