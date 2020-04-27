import { Component, OnInit, Input } from '@angular/core';
import { IProfile } from 'src/app/shared/models/profile';

@Component({
  // tslint:disable-next-line:component-selector
  selector: '[appProfileCard]',
  templateUrl: './profile-card.component.html',
  styles: []
})
export class ProfileCardComponent implements OnInit {
  @Input() profile: IProfile;

  constructor() { }

  ngOnInit() {
  }

}
