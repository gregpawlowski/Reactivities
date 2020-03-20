import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

const apiBase = environment.apiBase;

@Injectable({
  providedIn: 'root'
})
export class ValueService {

  constructor(private http: HttpClient) { }

  getValues() {
    return this.http.get(apiBase + 'values');
  }
}
