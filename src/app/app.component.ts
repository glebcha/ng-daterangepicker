import { Component, OnInit } from '@angular/core';
import { NgDateRangePickerOptions } from '../ng-daterangepicker';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit  {
  value: string;
  options: NgDateRangePickerOptions;

  ngOnInit() {
    this.options = {
      theme: 'default',
      range: 'tm',
      ranges: ['var', 'tm', 'lm', 'lw', 'tw', 'ty', 'ly', 'yd', 'td', 'l7d', '3m', 'ytod'],
      dayNames: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      presetNames: [
        'Custom', 
        'This Month', 
        'Last Month', 
        'This Week', 
        'Last Week', 
        'This Year', 
        'Last Year', 
        'Yesterday', 
        'Today',
        'Last 7 days',
        '3 months', 
        'Year to date',
        'Start', 
        'End'
      ],
      dateFormat: 'yMd',
      outputFormat: 'DD/MM/YYYY',
      startOfWeek: 0,
      onChange: () => {}
    };
  }
}
