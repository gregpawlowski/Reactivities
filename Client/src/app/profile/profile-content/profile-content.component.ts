import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profile-content',
  templateUrl: './profile-content.component.html',
  styles: []
})
export class ProfileContentComponent implements OnInit {
  aboutActive: boolean;
  photoActive: boolean;
  followingsActive: boolean;
  followersActive: boolean;
  loading = false;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(
      () => {
        this.aboutActive = true;
      }
    );
  }

  componentLoaded(event: boolean) {
    this.loading = event;
  }

}
