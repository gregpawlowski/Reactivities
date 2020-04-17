import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { NavbarComponent } from './navbar/navbar.component';
import { ActivitiesModule } from './activities/activities.module';
import { SharedModule } from './shared/shared.module';
import { HomeComponent } from './home/home.component';
import { HomeLayoutComponent } from './home-layout/home-layout.component';
import { LoginLayoutComponent } from './login-layout/login-layout.component';
import { ErrorInterceptorProvider } from './shared/services/error.interceptor';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { JwtModule } from '@auth0/angular-jwt';
import { LoginFormComponent } from './auth/login-form/login-form.component';
import { AuthModule } from './auth/auth.module';


export function tokenGetter() {
  return localStorage.getItem('jwt');
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    HomeLayoutComponent,
    LoginLayoutComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ActivitiesModule,
    SharedModule,
    AuthModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-right'
    }),
    JwtModule.forRoot({
      config: {
        tokenGetter,
        whitelistedDomains: ['localhost:5000'],
        blacklistedRoutes: ['localhost:5000/auth']
      }
    })
  ],
  providers: [ ErrorInterceptorProvider ],
  bootstrap: [AppComponent]
})
export class AppModule { }
