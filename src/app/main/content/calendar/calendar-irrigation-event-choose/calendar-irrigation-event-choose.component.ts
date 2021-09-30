import { Component, OnInit } from '@angular/core';
import { Time } from 'gantt-schedule-timeline-calendar/dist/api/time';
import * as moment from 'moment';

export interface DialogData {
  type: string;
}


@Component({
  selector: 'calendar-irrigation-event-choose',
  templateUrl: './calendar-irrigation-event-choose.component.html',
  styleUrls: ['./calendar-irrigation-event-choose.component.scss'],
})
export class CalendarIrrigationEventChooseComponent implements OnInit {
  dates: Array<any> = []
  chooseTime: boolean = false
  value: string = ''
  date: any = moment()
  
  dateChoosen: any = moment().startOf('day')
  time: string = ''

  times: Array<string> = [
    '12:00 AM',
    '12:30 AM',
    '01:00 AM',
    '01:30 AM',
    '02:00 AM',
    '02:30 AM',
    '03:00 AM',
    '03:30 AM',
    '04:00 AM',
    '04:30 AM',
    '05:00 AM',
    '05:30 AM',
    '06:00 AM',
    '06:30 AM',
    '07:00 AM',
    '07:30 AM',
    '08:00 AM',
    '08:30 AM',
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 PM',
    '12:30 PM',
    '01:00 PM',
    '01:30 PM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
    '04:30 PM',
    '05:00 PM',
    '05:30 PM',
    '06:00 PM',
    '06:30 PM',
    '07:00 PM',
    '07:30 PM',
    '08:00 PM',
    '08:30 PM',
    '09:00 PM',
    '09:30 PM',
    '10:00 PM',
    '10:30 PM',
    '11:00 PM',
    '11:30 PM',
  ]

  constructor() {}

  ngOnInit () {
    this.nextDate()
  }

  isTime(time, dateChoosen) {
    if (dateChoosen.isSame(this.dateChoosen)) {
      return this.time === time
    }

    return false
  }

  setDate(d, time): void {
    this.value = d.date.format('DD dddd, YYYY - ') + time
    this.chooseTime = false

    this.time = time
    this.dateChoosen = d.date.startOf('day')
  }

  nowDate() {
    let date = moment()

    this.dates = []

    for (let i = 0; i < 5; i++) {
      const newDate = moment(date).add(1, 'days')
      this.dates.push({
        day: newDate.format('ddd'),
        value: newDate.format('DD'),
        date: newDate.startOf('day')
      })
      date = newDate
    }

    this.date = date
  }

  nextDate () {
    let date = this.date

    this.dates = []

    for (let i = 0; i < 5; i++) {
      const newDate = moment(date).add(1, 'days')
      this.dates.push({
        day: newDate.format('ddd'),
        value: newDate.format('DD'),
        date: newDate.startOf('day')
      })
      date = newDate
    }

    this.date = date
  }

  prevDate () {
    let date = this.dates[0].date

    this.dates = []

    for (let i = 0; i < 5; i++) {
      const newDate = moment(date).subtract(1, 'days')
      this.dates.push({
        day: newDate.format('ddd'),
        value: newDate.format('DD'),
        date: newDate
      })
      date = newDate
    }

    this.date = this.dates[0].date

    this.dates = this.dates.reverse()
  }
}
