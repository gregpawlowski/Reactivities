import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ActivityService } from '../shared/services/activity.service';
import { Store } from '@store';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  constructor(private store: Store) { }

  ngOnInit() {
  }

}
