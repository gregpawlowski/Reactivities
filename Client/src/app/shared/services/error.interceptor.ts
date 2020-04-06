import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse, HTTP_INTERCEPTORS, HttpRequest, HttpEvent, HttpHandler, HttpInterceptor } from '@angular/common/http';
import { throwError, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private router: Router, private toastr: ToastrService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('Error:', error);
        console.log('Request', req);

        if (error.status === 0) {
          this.toastr.error('Network error - make sure API is running');
        }
        if (error.status === 404) {
          this.router.navigate(['activities', 'notfound']);
          return throwError(error.error);
        }
        if (error.status === 400 && req.method === 'GET' && error.error.errors.hasOwnProperty('id')) {
          this.router.navigate(['activities', 'notfound']);
        }
        if (error.status === 500) {
          this.toastr.error('Server error - check the terminal for more info!');
        }
        return throwError(error);
      })
    );
  }
}

// This will need to be provided in the providers in the app.
export const ErrorInterceptorProvider = {
  // Need to use HTTP_INTERCEPTORS token so that our interceptor is added to the array of angular interceptors
  provide: HTTP_INTERCEPTORS,
  // Which class to use, use the one above.
  useClass: ErrorInterceptor,
  // multi means we don't want to replace the existing array instead add to it.
  multi: true
};
