import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivityService } from './shared/services/activity.service';
import { Store } from '@store';
import { UserService } from './shared/services/user.service';
import { LoadingService } from './shared/services/loading.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'Reactivities';
  appLoaded = false;

  constructor(private userService: UserService, private loadingService: LoadingService, private router: Router) {}

  ngOnInit() {
    this.loadingService.startLoading('Loading Application...');

    if (localStorage.getItem('jwt')) {
      this.userService.getCurrentUser()
        .pipe(
          finalize(() => {
            this.loadingService.stopLoading();
            this.appLoaded = true;
        }))
        .subscribe(undefined, (error) => {
          this.router.navigate(['']);
        });
    } else {
      this.loadingService.stopLoading();
      this.appLoaded = true;
    }
  }

}
