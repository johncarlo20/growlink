import { SelectItem } from '@models';
import * as moment from 'moment';

export namespace TimeUtil {

  export function UtcToLocalDate(d: string): Date {
    const lDate = new Date();

    lDate.setFullYear(numFromStr(d.substr(0, 4)), numFromStr(d.substr(5, 2)) - 1, numFromStr(d.substr(8, 2)));
    lDate.setHours(numFromStr(d.substr(11, 2)));
    lDate.setMinutes(numFromStr(d.substr(14, 2)));
    lDate.setSeconds(numFromStr(d.substr(17, 2)));
    return lDate;
  }

  export function getDateId(date: Date): string {
    let monthDay = `0${date.getDate()}`;
    monthDay = monthDay.substr(monthDay.length - 2);
    let month = `0${date.getMonth() + 1}`;
    month = month.substr(month.length - 2);


    return `${date.getFullYear()}${month}${monthDay}`;
  }

  const tzOverrides = {
    'Pacific/Tahiti': 'TAHT'
  };

  export function getTimezoneAbbr(tzId: string): string {
    const override = tzOverrides[tzId];
    if (override !== undefined) {
      return override;
    }

    let timezoneAbbr = moment.tz(tzId).format('z');
    if (timezoneAbbr[0] === '+' || timezoneAbbr[0] === '-') {
      timezoneAbbr = `UTC${timezoneAbbr}`;
    }

    return timezoneAbbr;
  }

  export function osTime24Hour(): boolean {
    let timeFormatted = new Date().toLocaleTimeString().toUpperCase();
    if (window.navigator && window.navigator.languages) {
      timeFormatted = new Date().toLocaleTimeString(window.navigator.languages as string[]).toUpperCase();
    }

    return timeFormatted.endsWith('AM') || timeFormatted.endsWith('PM') ? false : true;
  }

  export function preferredTimeFormat(prefer24Hours: boolean, includeSeconds = true): string {
    if (!includeSeconds) {
      return !prefer24Hours ? 'h:mm A' : 'HH:mm';
    }
    return !prefer24Hours ? 'h:mm:ss A' : 'HH:mm:ss';
  }

  function numFromStr(s: string): number {
    // console.log(s);
    return s.length ? parseInt(s, 10) : 0;
  }

  export function localTimestamp(ts: number): Date {
    const mDate = moment.unix(ts).utc();
    const cDate = moment([mDate.year(), mDate.month(), mDate.date(), mDate.hour(), mDate.minute(), mDate.second()]).toDate();

    return cDate;
  }

  export function loadSearchRanges(): SelectItem[] {
    const currentDate = new Date();
    currentDate.setHours(0);
    currentDate.setMinutes(0);
    currentDate.setSeconds(0);
    const endToday = new Date(currentDate);
    endToday.setHours(23, 59, 59);
    const lastMonthDate = new Date();
    lastMonthDate.setDate(1);
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

    const searchRanges: SelectItem[] = [];
    searchRanges.push({ caption: 'Custom', value: { startDate: null, endDate: null } });
    searchRanges.push({
      caption: 'Today',
      value: { startDate: currentDate, endDate: endToday }
    });
    searchRanges.push({
      caption: 'Yesterday',
      value: {
        startDate: new Date(new Date(currentDate).setDate(currentDate.getDate() - 1)),
        endDate: new Date(new Date(endToday).setDate(currentDate.getDate() - 1))
      }
    });
    searchRanges.push({
      caption: 'Last 7 days',
      value: {
        startDate: new Date(new Date(currentDate).setDate(currentDate.getDate() - 7)),
        endDate: endToday
      }
    });
    searchRanges.push({
      caption: 'Last 14 days',
      value: {
        startDate: new Date(new Date(currentDate).setDate(currentDate.getDate() - 14)),
        endDate: endToday
      }
    });
    searchRanges.push({
      caption: 'Last 30 days',
      value: {
        startDate: new Date(new Date(currentDate).setDate(currentDate.getDate() - 30)),
        endDate: endToday
      }
    });
    searchRanges.push({
      caption: 'This week(Sun - Today)',
      value: {
        startDate: new Date(new Date(currentDate).setDate(currentDate.getDate() - currentDate.getDay())),
        endDate: endToday
      }
    });
    searchRanges.push({
      caption: 'This week (Mon - Today)',
      value: {
        startDate: new Date(new Date(currentDate).setDate(currentDate.getDate() - currentDate.getDay() + 1)),
        endDate: endToday
      }
    });
    searchRanges.push({
      caption: 'Last week(Sun - Sat)',
      value: {
        startDate: new Date(new Date(currentDate).setDate(currentDate.getDate() - currentDate.getDay() - 7)),
        endDate: new Date(new Date(endToday).setDate(currentDate.getDate() - currentDate.getDay() - 1)),
      }
    });
    searchRanges.push({
      caption: 'Last week(Mon - Sun)',
      value: {
        startDate: new Date(new Date(currentDate).setDate(currentDate.getDate() - currentDate.getDay() - 6)),
        endDate: new Date(new Date(endToday).setDate(currentDate.getDate() - currentDate.getDay()))
      }
    });
    searchRanges.push({
      caption: 'This month',
      value: {
        startDate: new Date(new Date(currentDate).setDate(1)),
        endDate: endToday
      }
    });
    searchRanges.push({
      caption: 'Last month',
      value: {
        startDate: lastMonthDate,
        endDate: new Date(new Date(endToday).setDate(0))
      }
    });

    return searchRanges;
  }

  export function getHumanReadableDuration(duration: any): string {
    return moment(duration, 'HH:mm:ss').format('HH:mm:ss');
  }

}
