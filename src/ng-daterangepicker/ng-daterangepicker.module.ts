import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  MatInputModule, 
  MatButtonModule,
  MatIconModule 
} from '@angular/material';
import { TextMaskModule } from 'angular2-text-mask';
import { NgDateRangePickerComponent } from './ng-daterangepicker.component';

@NgModule({
  declarations: [ NgDateRangePickerComponent ],
  imports: [ 
    CommonModule, 
    FormsModule, 
    TextMaskModule, 
    MatButtonModule,
    MatInputModule,
    MatIconModule 
  ],
  exports: [ NgDateRangePickerComponent, CommonModule, FormsModule ]
})
export class NgDateRangePickerModule { }
