import { Component, OnInit } from '@angular/core';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { IUserActivity } from 'src/app/shared/models/userActivity';

@Component({
  selector: 'app-profile-activities',
  templateUrl: './profile-activities.component.html',
  styles: []
})
export class ProfileActivitiesComponent implements OnInit {
  userActivites: IUserActivity[];
  predicate = 'future';
  loading = true;

  constructor(private profileService: ProfileService) { }

  ngOnInit() {
    this.loadUserActivites();
  }

  loadUserActivites() {
    this.userActivites = [];
    this.loading = true;
    this.profileService.getUserActivities(this.profileService.profile.username, this.predicate)
      .subscribe(activites => {
        this.userActivites = activites;
        this.loading = false;
      });
  }

}
