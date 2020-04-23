import { Component, OnInit, Input } from '@angular/core';
import { IProfile } from 'src/app/shared/models/profile';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-header.component.html',
  styleUrls: ['./profile-header.component.scss']
})
export class ProfileHeaderComponent implements OnInit {
  @Input() profile: IProfile;

  constructor() { }

  ngOnInit() {
  }

}
