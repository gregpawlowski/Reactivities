import { Component, OnInit } from '@angular/core';
import { ValueService } from './_services/value.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Reactivities';

  values: any[];

  constructor(private valueService: ValueService) {}

  ngOnInit() {
    this.valueService.getValues()
      .subscribe((values: any[]) => {
        this.values = values;
      }, err => {
        console.log(err);
      });
  }

}
