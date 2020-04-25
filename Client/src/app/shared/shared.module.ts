import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from './loading/loading.component';
import { SuiDatepickerModule,
  SuiSelectModule,
  SuiDropdownModule,
  SuiModalModule,
  SuiMessageModule,
  SuiPopupModule,
  SuiTabsModule
} from 'ng2-semantic-ui';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TimeAgoPipe } from 'time-ago-pipe';



@NgModule({
  declarations: [ LoadingComponent, TimeAgoPipe],
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
    SuiPopupModule,
    SuiTabsModule,
    FormsModule,
    ReactiveFormsModule,
    TimeAgoPipe
  ]
})
export class SharedModule { }
