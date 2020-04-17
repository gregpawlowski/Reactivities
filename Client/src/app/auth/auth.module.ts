import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginFormComponent } from './login-form/login-form.component';
import { SharedModule } from '../shared/shared.module';
import { RegisterFormComponent } from './register-form/register-form.component';


@NgModule({
  declarations: [LoginFormComponent, RegisterFormComponent],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [],
  entryComponents: [LoginFormComponent, RegisterFormComponent]
})
export class AuthModule { }
