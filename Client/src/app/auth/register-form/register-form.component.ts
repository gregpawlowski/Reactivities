import { Component, OnInit } from '@angular/core';
import { IUserFormValues } from 'src/app/shared/models/user';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from 'src/app/shared/services/user.service';
import { SuiModal } from 'ng2-semantic-ui';
import { NgForm } from '@angular/forms';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-register-form',
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.scss']
})
export class RegisterFormComponent implements OnInit {

  formValues: IUserFormValues = {
    email: '',
    password: '',
    displayName: '',
    username: ''
  };

  submitting = false;
  submitError: HttpErrorResponse;

  constructor(
    private userService: UserService,
    private router: Router,
    public modal: SuiModal<undefined>
    ) { }

  ngOnInit() {
  }

  handleSubmit(event: Event, registerForm: NgForm) {
    this.submitting = true;
    event.preventDefault();
    this.userService.register(this.formValues)
      .pipe(
        finalize(() => this.submitting = false)
      )
      .subscribe(
        () => {
          this.router.navigate(['activities']);
          this.modal.approve(undefined);
        },
        (error: HttpErrorResponse) => {
          this.submitError = error;
          registerForm.form.markAsPristine();
        }
      );
  }

  errorValues(): string[] {
    return Object.values<string>(this.submitError.error.errors).flat();
  }
}
