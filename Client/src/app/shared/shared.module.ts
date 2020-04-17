import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from './loading/loading.component';
import { SuiDatepickerModule, SuiSelectModule, SuiDropdownModule, SuiModalModule, SuiMessageModule } from 'ng2-semantic-ui';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';



@NgModule({
  declarations: [ LoadingComponent ],
  imports: [
    CommonModule,
  ],
  exports: [
    LoadingComponent,
    SuiDatepickerModule,
    SuiSelectModule,
    SuiDropdownModule,
    SuiModalModule,
    SuiMessageModule,
    FormsModule
  ]
})
export class SharedModule { }
