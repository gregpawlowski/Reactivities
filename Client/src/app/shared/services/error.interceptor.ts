import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse, HTTP_INTERCEPTORS, HttpRequest, HttpEvent, HttpHandler, HttpInterceptor } from '@angular/common/http';
import { throwError, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserService } from './user.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private router: Router, private toastr: ToastrService, private userService: UserService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0) {
          this.toastr.error('Network error - make sure API is running');
        }
        if (error.status === 404 && req.method === 'GET') {
          this.router.navigate(['activities', 'notfound']);
          return throwError(error.error);
        }
        if (
          error.status === 401
          && error.headers.get('www-authenticate')
          && error.headers.get('www-authenticate').startsWith('Bearer error="invalid_token", error_description="The token expired')
        ) {
          this.userService.logout();
          this.router.navigate(['/']);
          this.toastr.error('Your session has expired, please login');
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
