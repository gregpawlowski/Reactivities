import { Component, OnInit } from '@angular/core';
import { ProfileService } from 'src/app/shared/services/profile.service';

@Component({
  selector: 'app-profile-about',
  templateUrl: './profile-about.component.html',
  styles: []
})
export class ProfileAboutComponent implements OnInit {
  editMode = false;

  constructor(public profileService: ProfileService) { }

  ngOnInit() {
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
  }

}
