import * as dateFns from 'date-fns';

export default function ({
  year = dateFns.getYear(new Date()), 
  month = dateFns.getMonth(new Date()), 
  weekStartsOn = 0
}: {year?: number, month?: number, weekStartsOn?: number}) {
  const matrix = [];
  const rows = range(6);
  const cols = range(7);
  const date = new Date(year, month);

  let curDate = dateFns.startOfWeek(date, { weekStartsOn });

  rows.forEach(row => {
    const week = [];

    cols.forEach(col => {
      week.push(curDate);
      curDate = dateFns.addDays(curDate, 1);
    })

    matrix.push(week);
  })

  return matrix;
}


function range (n) {
  return Array.apply(null, {length: n}).map(Number.call, Number);
}