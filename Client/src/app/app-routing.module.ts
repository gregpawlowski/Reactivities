import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { HomeLayoutComponent } from './home-layout/home-layout.component';
import { LoginLayoutComponent } from './login-layout/login-layout.component';
import { NotFoundComponent } from './activities/not-found/not-found.component';


const routes: Routes = [
  { path: '', component: HomeLayoutComponent, pathMatch: 'full', children: [
    { path: '', component: HomeComponent }
  ]},
  { path: '', component: LoginLayoutComponent, children: [
    { path: 'activities', loadChildren: () => import('./activities/activities.module').then(m => m.ActivitiesModule) }
  ]},
  { path: '**', component: NotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
