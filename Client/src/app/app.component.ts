import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'Reactivities';
  editMode = false;

  constructor() {}

  ngOnInit() {
  }

  onShowEdit(bool: boolean) {
    this.editMode = bool;
  }

}
