import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivityService, IActivity } from './shared/services/activity.service';
import { Store } from '@store';
import { UserService } from './shared/services/user.service';
import { LoadingService } from './shared/services/loading.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'Reactivities';
  appLoaded = false;

  constructor(private userService: UserService, private loadingService: LoadingService) {}

  ngOnInit() {
    this.loadingService.startLoading('Loading application');

    if (localStorage.getItem('jwt')) {
      this.userService.getCurrentUser()
        .subscribe(undefined, undefined, () => {
          this.loadingService.stopLoading();
          this.appLoaded = true;
        });
    } else {
      this.loadingService.stopLoading();
      this.appLoaded = true;
    }
  }

}
