import { Injectable } from '@angular/core';
import { Store } from '@store';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  constructor(private store: Store) { }

  startLoading(content?: string) {
    this.store.set('loading', true);

    if (content) {
      this.store.set('loaderContent', content);
    }
  }

  stopLoading() {
    this.store.set('loading', false);
    this.store.set('loaderContent', undefined);
  }
}
