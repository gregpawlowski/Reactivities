import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { IUserFormValues } from 'src/app/shared/models/user';
import { UserService } from 'src/app/shared/services/user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { SuiModal } from 'ng2-semantic-ui';
import { finalize } from 'rxjs/operators';


@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {
  loginFormValues: IUserFormValues = {
    email: '',
    password: ''
  };

  submitting = false;
  submitError;

  constructor(
    private userService: UserService,
    private router: Router,
    public modal: SuiModal<undefined>
    ) { }

  ngOnInit() {
  }

  handleSubmit(event: Event, loginForm: NgForm) {
    this.submitting = true;
    event.preventDefault();
    this.userService.login(this.loginFormValues)
      .pipe(
        finalize(() => this.submitting = false)
      )
      .subscribe(
        res => {
          this.router.navigate(['activities']);
          this.modal.approve(undefined);
        },
        (error: HttpErrorResponse) => {
          // loginForm.reset(loginForm.value);
          this.submitError = error.statusText;
          loginForm.form.markAsPristine();
        }
      );
  }

}
