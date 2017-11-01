import { 
  Component, 
  OnInit,
  AfterViewInit, 
  HostListener, 
  ElementRef, 
  Renderer,
  forwardRef, 
  Input, 
  OnChanges, 
  SimpleChange,
  ViewChild 
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import * as dateFns from 'date-fns';
import matrix from './calendarMatrix';

export interface NgDateRangePickerOptions {
  theme: 'default' | 'green' | 'teal' | 'cyan' | 'grape' | 'red' | 'gray';
  range: 'var' | 'tm' | 'lm' | 'lw' | 'tw' | 'ty' | 'ly' | 'yd' | 'td' | 'l7d' | '3m' | 'ytod';
  ranges: Array<string>;
  dayNames: string[];
  presetNames: string[];
  dateFormat: string;
  outputFormat: string;
  startOfWeek: number;
  onChange: Function;
}

export interface IDay {
  date: Date;
  day: number;
  weekday: number;
  today: boolean;
  firstMonthDay: boolean;
  lastMonthDay: boolean;
  visible: boolean;
  from: boolean;
  to: boolean;
  isWithinRange: boolean;
}

export let DATERANGEPICKER_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NgDateRangePickerComponent),
  multi: true
};

@Component({
  selector: 'ng-daterangepicker',
  templateUrl: 'ng-daterangepicker.component.html',
  styleUrls: ['ng-daterangepicker.sass'],
  providers: [ DATERANGEPICKER_VALUE_ACCESSOR ]
})
export class NgDateRangePickerComponent implements ControlValueAccessor, OnInit, AfterViewInit, OnChanges {
  @Input() options: NgDateRangePickerOptions;

  modelValue: string;
  opened: false | 'from' | 'to';
  date: Date;
  dateFrom: Date;
  dateTo: Date;
  dateFromError: string;
  dateToError: string;
  prevDate: Date;
  totalTime: number;
  dayNames: string[];
  days: IDay[];
  prevDays: IDay[];
  dateFns: any;
  range:  'var' | 'tm' | 'lm' | 'lw' | 'tw' | 'ty' | 'ly' | 'yd' | 'td' | 'l7d' | '3m' | 'ytod';
  defaultOptions: NgDateRangePickerOptions = {
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
  prevFrom = 0;
  prevTo = 0;

  public dateInputFrom = '';
  public dateInputTo = '';
  public fullMask = [
    /[0-1]/, /\d/, '/', /[0-3]/, /\d/, '/', /\d/, /\d/, /\d/, /\d/, ' ', 
    /[0-1]/, /\d/, ':', /[0-5]/, /[0-9]/, ' ', /[A-Za-z]/, /[A-Za-z]/
  ];
  public mask = [
    /[0-1]/, /\d/, '/', /[0-3]/, /\d/, '/', /\d/, /\d/, /\d/, /\d/
  ];

  private onTouchedCallback: () => void = () => { };
  private onChangeCallback: (_: any) => void = () => { };

  constructor(
    private elementRef: ElementRef, 
    private renderer: Renderer,
  ) {
    this.dateFns = dateFns;
  }

  get value(): string {
    return this.modelValue;
  }

  get currentRange() {
    const {options: {presetNames, range, ranges}} = this;
    const current = this.range || range;
    const result = {
      data: '',
      valid: true
    };

    if (current && current === 'var') {
      result.valid = false;
    } else {
      result.data = presetNames[ranges.indexOf(current)];
    }

    return result;
  }

  set value(value: string) {
    if (!value) { return; }
    this.modelValue = value;
    this.onChangeCallback(value);
  }

  writeValue(value: string) {
    if (!value) { return; }
    this.modelValue = value;
  }

  registerOnChange(fn: any) {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }

  ngOnInit() {
    const {options:{onChange}} = this;

    this.opened = false;
    this.date = dateFns.startOfDay(new Date());
    this.prevDate = dateFns.subMonths(this.date, 1),
    this.options = this.options || this.defaultOptions;
    this.initNames();
    this.selectRange(this.options.range);

    if (this.range === 'td') {
      this.totalTime = dateFns.differenceInHours(this.dateTo, this.dateFrom);
    } else {
      this.totalTime = dateFns.differenceInDays(this.dateTo, this.dateFrom);
    }

    onChange && onChange(this.dateFrom, this.dateTo);
  }

  ngAfterViewInit() {
    this.dateInputFrom = dateFns.format(this.dateFrom, this.options.outputFormat);
    this.dateInputTo = dateFns.format(this.dateTo, this.options.outputFormat);
  }

  ngOnChanges(changes: {[propName: string]: SimpleChange}) {
    this.options = this.options || this.defaultOptions;
  }

  convertMinutesToTime(minutes, isFull = false) {
    const hh = Math.trunc(minutes/60);
    const mm = minutes % 60;
    const fullHH = hh % 12 < 10 ? `0${hh % 12}` : hh % 12;
    const fullMM = mm < 10 ? `0${mm}` : mm;
    const abbr = hh >= 12 ? 'pm' : 'am';
    const result = `${ 
      !isFull ? fullHH : hh 
    }:${ 
      fullMM
    } ${ 
      !isFull ? abbr : ''
     }`;

    return result;
  }

  initNames(): void {
    this.dayNames = this.options.dayNames;
  }

  generateCalendar(): void {
    const {onChange} = this.options;

    this.days = [];
    this.prevDays = [];
    let start: Date = dateFns.startOfMonth(this.date);
    let end: Date = dateFns.endOfMonth(this.date);

    let days: IDay[] = matrix({month: dateFns.getMonth(this.date)})
    .reduce((arr, acc) => arr.concat(acc), [])
    .map(d => {
      return {
        date: d,
        day: dateFns.getDate(d),
        weekday: dateFns.getDay(d),
        today: dateFns.isToday(d),
        yesterday: dateFns.isYesterday(d),
        firstMonthDay: dateFns.isFirstDayOfMonth(d),
        lastMonthDay: dateFns.isLastDayOfMonth(d),
        visible: true,
        from: dateFns.isSameDay(this.dateFrom, d),
        to: dateFns.isSameDay(this.dateTo, d),
        isWithinRange: dateFns.isWithinRange(d, this.dateFrom, this.dateTo),
        isInMonth: dateFns.isSameMonth(d, this.date),
        isFutureDate: dateFns.isAfter(d, this.dateTo)
      };
    });

    let prevDays: IDay[] = matrix({month: dateFns.subMonths(this.date, 1).getMonth()})
    .reduce((arr, acc) => arr.concat(acc), [])
    .map(d => {
      return {
        date: d,
        day: dateFns.getDate(d),
        weekday: dateFns.getDay(d),
        today: dateFns.isToday(d),
        yesterday: dateFns.isYesterday(d),
        firstMonthDay: dateFns.isFirstDayOfMonth(d),
        lastMonthDay: dateFns.isLastDayOfMonth(d),
        visible: true,
        from: dateFns.isSameDay(this.dateFrom, d),
        to: dateFns.isSameDay(this.dateTo, d),
        isWithinRange: dateFns.isWithinRange(d, this.dateFrom, this.dateTo),
        isInMonth: dateFns.isSameMonth(d, this.prevDate),
        isFutureDate: dateFns.isAfter(d, this.dateTo)
      };
    });

    let prevMonthDayNum = dateFns.getDay(start) - 1;
    let prevMonthDays: IDay[] = [];
    if (prevMonthDayNum > 0) {
      prevMonthDays = Array.from(Array(prevMonthDayNum).keys()).map(i => {
        let d = dateFns.subDays(start, prevMonthDayNum - i);
        return {
          date: d,
          day: dateFns.getDate(d),
          weekday: dateFns.getDay(d),
          firstMonthDay: dateFns.isFirstDayOfMonth(d),
          lastMonthDay: dateFns.isLastDayOfMonth(d),
          today: false,
          visible: false,
          from: false,
          to: false,
          isWithinRange: false
        };
      });
    }

    if (this.range === 'td') {
      this.totalTime = dateFns.differenceInHours(this.dateTo, this.dateFrom);
    } else {
      this.totalTime = dateFns.differenceInDays(this.dateTo, this.dateFrom);
    }

    this.days = prevMonthDays.concat(days);
    this.prevDays = prevDays;
    this.value = `${
      dateFns.format(this.dateFrom, this.options.outputFormat)
    }-${
      dateFns.format(this.dateTo, this.options.outputFormat)
    }`;
  }

  toggleCalendar(e: MouseEvent, selection: 'from' | 'to'): void {
    if (this.opened && this.opened !== selection) {
      this.opened = selection;
    } else {
      this.opened = this.opened ? false : selection;
    }
  }

  closeCalendar(e?: MouseEvent): void {
    this.opened = false;
  }

  selectDate(e: MouseEvent, index: number, isPrev?: boolean): void {
    e.preventDefault();
    let selectedDate: Date = this.days[index].date;
    let selectedPrevDate: Date = this.prevDays[index] ? this.prevDays[index].date : this.prevDays[index - 1].date;
    let date = isPrev ? selectedPrevDate : selectedDate;

    if ((this.opened === 'from' && dateFns.isAfter(date, this.dateTo)) ||
      (this.opened === 'to' && dateFns.isBefore(date, this.dateFrom))) {
      return;
    }

    if (this.opened === 'from') {
      this.dateFrom = date;
      this.dateInputFrom = dateFns.format(date, this.options.outputFormat);
      this.opened = 'to';
    } else if (this.opened === 'to') {
      this.dateTo = date;
      this.dateInputTo = dateFns.format(date, this.options.outputFormat);
      this.opened = 'from';
    }

    this.range = 'var';
    this.generateCalendar();
  }

  prevMonth(): void {
    this.date = dateFns.subMonths(this.date, 1);
    this.prevDate = dateFns.subMonths(this.prevDate, 1);

    this.generateCalendar();
  }

  nextMonth(): void {
    this.date = dateFns.addMonths(this.date, 1);
    this.prevDate = dateFns.addMonths(this.prevDate, 1);

    this.generateCalendar();
  }

  selectRange(range: 'var' | 'tm' | 'lm' | 'lw' | 'tw' | 'ty' | 'ly' | 'yd' | 'td' | 'l7d' | '3m' | 'ytod'): void {
    let today = dateFns.startOfDay(new Date());
    this.range = range;
    this.dateFromError = null;
    this.dateToError = null;

    switch (range) {
      case 'tm':
        this.dateFrom = dateFns.startOfMonth(today);
        this.dateTo = dateFns.endOfMonth(today);
        break;
      case 'lm':
        today = dateFns.subMonths(today, 1);
        this.dateFrom = dateFns.startOfMonth(today);
        this.dateTo = dateFns.endOfMonth(today);
        break;
      case 'lw':
        today = dateFns.subWeeks(today, 1);
        this.dateFrom = dateFns.startOfWeek(today, {weekStartsOn: this.options.startOfWeek});
        this.dateTo = dateFns.endOfWeek(today, {weekStartsOn: this.options.startOfWeek});
        break;
      case 'tw':
        this.dateFrom = dateFns.startOfWeek(today, {weekStartsOn: this.options.startOfWeek});
        this.dateTo = dateFns.endOfWeek(today, {weekStartsOn: this.options.startOfWeek});
        break;
      case 'ty':
        this.dateFrom = dateFns.startOfYear(today);
        this.dateTo = dateFns.endOfYear(today);
        break;
      case 'ly':
        today = dateFns.subYears(today, 1);
        this.dateFrom = dateFns.startOfYear(today);
        this.dateTo = dateFns.endOfYear(today);
        break;
      case 'yd':
        this.dateFrom = dateFns.startOfYesterday();
        this.dateTo = dateFns.endOfYesterday();
        break;
      case 'td':
        this.dateFrom = dateFns.startOfToday();
        this.dateTo = dateFns.endOfToday();

        setTimeout(() => {
          this.dateInputFrom = dateFns.format(this.dateFrom, this.options.dateFormat);
          this.dateInputTo = dateFns.format(this.dateTo, this.options.dateFormat); 
        }, 0);

        break;
      case 'l7d':
        this.dateFrom = dateFns.subWeeks(today, 1);
        this.dateTo = today;
        break;
      case '3m':
        this.dateFrom = dateFns.subMonths(today, 3);
        this.dateTo = today;
        break;
      case 'ytod':
        this.dateFrom = dateFns.subYears(today, 1);
        this.dateTo = today;
        break;
    }

    this.dateInputFrom = dateFns.format(this.dateFrom, this.options.outputFormat);
    this.dateInputTo = dateFns.format(this.dateTo, this.options.outputFormat);
    this.range = range;
    this.generateCalendar();
  }

  onInputChange = (date: string, isFrom = true) => {
    const value = dateFns.parse(date);
    const isValidDate = dateFns.isValid(value);
    const isNotFuture = isValidDate && !dateFns.isFuture(value);

    if (isNotFuture) {
      if (isFrom) {
        this.dateFrom = value;
        this.dateFromError = null;
      } else {
        this.dateTo = value;
        this.dateToError = null;
      }
      
      if (this.range !== 'td') {
        this.range = 'var';
      }

      this.generateCalendar();
    } else {
      if (isFrom) {
        this.dateFromError = 'Please, correct start date format';
      } else {
        this.dateToError = 'Please, correct end date format';
      }
    }

  }

  resetCalendar(e: MouseEvent) {
    const {options:{onChange}} = this;
        
    this.selectRange(this.options.range);
    onChange && onChange(this.dateFrom, this.dateTo);
  }

  onConfirm() {
    const {options:{onChange}} = this;

    this.opened = false;
    onChange && onChange(this.dateFrom, this.dateTo);
  }

  @HostListener('document:click', ['$event'])
  handleBlurClick(e: MouseEvent) {
    const target = e.srcElement || e.target;

    if (!this.elementRef.nativeElement.contains(target) && !(<Element>target).classList.contains('day-num')) {
      this.closeCalendar();
    }
  }
}
