import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSliderModule, MatInputModule, MatButtonModule } from '@angular/material';
import { TextMaskModule } from 'angular2-text-mask';
import { NgDateRangePickerComponent } from './ng-daterangepicker.component';

@NgModule({
  declarations: [ NgDateRangePickerComponent ],
  imports: [ 
    CommonModule, 
    FormsModule, 
    MatSliderModule, 
    TextMaskModule, 
    MatButtonModule,
    MatInputModule 
  ],
  exports: [ NgDateRangePickerComponent, CommonModule, FormsModule ]
})
export class NgDateRangePickerModule { }
