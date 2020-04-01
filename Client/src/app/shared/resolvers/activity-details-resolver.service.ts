import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot, Router } from '@angular/router';
import { IActivity, ActivityService } from '../services/activity.service';
import { Observable, EMPTY, of } from 'rxjs';
import {  mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ActivityDetailsResolverService implements Resolve<IActivity> {

  constructor(private router: Router, private activityService: ActivityService) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): IActivity | Observable<IActivity> | Promise<IActivity> {
    const id = route.params.id;

    return this.activityService.getActivityDetails(id)
      .pipe(
        mergeMap(activity => {
          if (activity) {
            return of(activity);
          } else {
            this.router.navigate(['/', 'activities']);
            return EMPTY;
          }
        })
      );
  }
}
