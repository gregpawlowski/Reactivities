import { Component, OnInit, Input } from '@angular/core';
import { Store } from '@store';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit {
  @Input() content: string;
  @Input() inverted = true;

  loading$ = this.store.select<boolean>('loading');
  loaderContent$ = this.store.select<string>('loaderContent');

  constructor(private store: Store) { }

  ngOnInit() {
  }

}
