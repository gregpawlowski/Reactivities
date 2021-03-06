import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { UserService } from '../shared/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit {
  user$ = this.userService.user$;

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit() {
  }

  onLogout() {
    this.userService.logout();
    this.router.navigate(['/']);
  }

}
