import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { HomeLayoutComponent } from './home-layout/home-layout.component';
import { LoginLayoutComponent } from './login-layout/login-layout.component';
import { NotFoundComponent } from './activities/not-found/not-found.component';
import { AuthGuard } from './auth/auth.guard';


const routes: Routes = [
  { path: '', component: HomeLayoutComponent, children: [
    { path: '', component: HomeComponent },
  ]},
  { path: '', component: LoginLayoutComponent, children: [
    { path: 'activities', canLoad: [AuthGuard], loadChildren: () => import('./activities/activities.module').then(m => m.ActivitiesModule) }
  ]},
  { path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
