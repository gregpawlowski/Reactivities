import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from './loading/loading.component';
import { SuiDatepickerModule, SuiSelectModule } from 'ng2-semantic-ui';



@NgModule({
  declarations: [ LoadingComponent ],
  imports: [
    CommonModule,
    SuiDatepickerModule,
  ],
  exports: [
    LoadingComponent,
    SuiDatepickerModule,
    SuiSelectModule
  ]
})
export class SharedModule { }
