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

export interface NgDateRangePickerOptions {
  theme: 'default' | 'green' | 'teal' | 'cyan' | 'grape' | 'red' | 'gray';
  range: 'tm' | 'lm' | 'lw' | 'tw' | 'ty' | 'ly' | 'yd' | 'td';
  dayNames: string[];
  presetNames: string[];
  dateFormat: string;
  outputFormat: string;
  startOfWeek: number;
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
  nextDate: Date;
  totalDays: number;
  dayNames: string[];
  days: IDay[];
  nextDays: IDay[];
  dateFns: object;
  range: 'tm' | 'lm' | 'lw' | 'tw' | 'ty' | 'ly' | 'yd' | 'td' | 'var';
  ranges = ['tm', 'lm', 'lw', 'tw', 'ty', 'ly', 'yd', 'td', 'var'];
  defaultOptions: NgDateRangePickerOptions = {
    theme: 'default',
    range: 'tm',
    dayNames: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    presetNames: [
      'This Month', 
      'Last Month', 
      'This Week', 
      'Last Week', 
      'This Year', 
      'Last Year', 
      'Yesterday', 
      'Today', 
      'Custom', 
      'Start', 
      'End'
    ],
    dateFormat: 'yMd',
    outputFormat: 'DD/MM/YYYY',
    startOfWeek: 0
  };
  prevFrom = 0;
  prevTo = 0;

  public dateInputFrom = '';
  public dateInputTo = '';
  public mask = [
    /[0-1]/, /\d/, '/', /[0-3]/, /\d/, '/', /\d/, /\d/, /\d/, /\d/, ' ', 
    /[0-1]/, /\d/, ':', /[0-5]/, /[0-9]/, ' ', /[A-Z]/, /[A-Z]/
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
    this.opened = false;
    this.date = dateFns.startOfDay(new Date());
    this.nextDate = dateFns.addMonths(this.date, 1),
    this.options = this.options || this.defaultOptions;
    this.totalDays = dateFns.differenceInDays(this.dateTo, this.dateFrom);
    this.initNames();
    this.selectRange(this.options.range);
  }

  ngAfterViewInit() {
    this.dateInputFrom = dateFns.format(this.dateFrom, this.options.dateFormat);
    this.dateInputTo = dateFns.format(this.dateTo, this.options.dateFormat);
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
    this.days = [];
    this.nextDays = [];
    let start: Date = dateFns.startOfMonth(this.date);
    let end: Date = dateFns.endOfMonth(this.date);

    let days: IDay[] = dateFns.eachDay(start, end).map(d => {
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
        isWithinRange: dateFns.isWithinRange(d, this.dateFrom, this.dateTo)
      };
    });

    let nextDays: IDay[] = dateFns.eachDay(dateFns.addMonths(start, 1), dateFns.addMonths(end, 1)).map(d => {
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
        isWithinRange: dateFns.isWithinRange(d, this.dateFrom, this.dateTo)
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

    this.totalDays = dateFns.differenceInDays(this.dateTo, this.dateFrom);
    this.days = prevMonthDays.concat(days);
    this.nextDays = nextDays;
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

  closeCalendar(e: MouseEvent): void {
    this.opened = false;
  }

  selectDate(e: MouseEvent, index: number, isNext?: boolean): void {
    e.preventDefault();
    let selectedDate: Date = this.days[index].date;
    let selectedNextDate: Date = this.nextDays[index].date;
    let date = isNext ? selectedNextDate : selectedDate;

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
    this.nextDate = dateFns.subMonths(this.nextDate, 1);

    this.generateCalendar();
  }

  nextMonth(): void {
    this.date = dateFns.addMonths(this.date, 1);
    this.nextDate = dateFns.addMonths(this.nextDate, 1);

    this.generateCalendar();
  }

  selectRange(range: 'tm' | 'lm' | 'lw' | 'tw' | 'ty' | 'ly' | 'yd' | 'td' | 'var'): void {
    let today = dateFns.startOfDay(new Date());

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
    const isWithinRange = isValidDate && dateFns.isWithinRange(value, this.dateFrom, this.dateTo);

    if (isWithinRange) {
      if (isFrom) {
        this.dateFrom = value;
        this.dateFromError = null;
      } else {
        this.dateTo = value;
        this.dateToError = null;
      }
      
      this.range = 'var';
      this.generateCalendar();
    } else {
      if (isFrom) {
        this.dateFromError = 'Please, correct start date format';
      } else {
        this.dateToError = 'Please, correct end date format';
      }
      console.log('error date')
    }

  }

  onTimeChange(e, isFrom = true) {
    const {value} = e;
    let newValue = 0;

    if (isFrom) {
      if (value > this.prevFrom) {
        newValue = value - this.prevFrom;
        this.dateFrom = dateFns.addMinutes(this.dateFrom, newValue);
      } else {
        newValue = this.prevFrom - value;
        this.dateFrom = dateFns.subMinutes(this.dateFrom, newValue);
      }

      this.prevFrom = value;
      this.dateInputFrom = dateFns.format(this.dateFrom, this.options.outputFormat);
      console.log(this.dateInputFrom);
    } else {
      if (value > this.prevTo) {
        newValue = value - this.prevTo;
        this.dateTo = dateFns.addMinutes(this.dateTo, newValue);
      } else {
        newValue = this.prevTo - value;
        this.dateTo = dateFns.subMinutes(this.dateTo, newValue);
      }

      this.prevTo = value;
      this.dateInputTo = dateFns.format(this.dateTo, this.options.outputFormat);
    }

    this.generateCalendar();

  }

  @HostListener('document:click', ['$event'])
  handleBlurClick(e: MouseEvent) {
    let target = e.srcElement || e.target;
    if (!this.elementRef.nativeElement.contains(e.target) && !(<Element>target).classList.contains('day-num')) {
      this.opened = false;
    }
  }
}
