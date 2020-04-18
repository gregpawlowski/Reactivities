import { Injectable } from '@angular/core';
import { UserService } from '../shared/services/user.service';
import { CanLoad, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanLoad {
  constructor(private userService: UserService, private router: Router) {}

  canLoad() {
    if (localStorage.getItem('jwt')) {
      return true;
    } else {
      this.router.navigate(['']);
      return false;
    }
  }
}
