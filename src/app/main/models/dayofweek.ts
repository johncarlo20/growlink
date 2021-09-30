import { SelectItem } from './select-item';

// import { SelectItem } from "primeng/primeng";
// tslint:disable:no-bitwise
// tslint:disable:curly

export enum DayOfWeek {
  None = 0,
  Monday = 1 << 0,
  Tuesday = 1 << 1,
  Wednesday = 1 << 2,
  Thursday = 1 << 3,
  Friday = 1 << 4,
  Saturday = 1 << 5,
  Sunday = 1 << 6,
  Everyday = Monday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday
}

export namespace DayOfWeek {
  export function getDaysOfWeekDisplay(option: DayOfWeek): string {
    if (option === DayOfWeek.Everyday) return 'Everyday';
    if (option === DayOfWeek.None) return 'None';

    let days = '';
    if (option & DayOfWeek.Monday) days += 'Monday';
    if (option & DayOfWeek.Tuesday) days += days.length === 0 ? 'Tuesday' : ', Tuesday';
    if (option & DayOfWeek.Wednesday) days += days.length === 0 ? 'Wednesday' : ', Wednesday';
    if (option & DayOfWeek.Thursday) days += days.length === 0 ? 'Thursday' : ', Thursday';
    if (option & DayOfWeek.Friday) days += days.length === 0 ? 'Friday' : ', Friday';
    if (option & DayOfWeek.Saturday) days += days.length === 0 ? 'Saturday' : ', Saturday';
    if (option & DayOfWeek.Sunday) days += days.length === 0 ? 'Sunday' : ', Sunday';

    return days;
  }

  export function getDaysOfWeekForMultiSelect(option: DayOfWeek): DayOfWeek[] {
    if (option === DayOfWeek.Everyday) return [DayOfWeek.Everyday];
    if (option === DayOfWeek.None) { return [DayOfWeek.None]; }

    const daysOfWeek = [];
    if (option & DayOfWeek.Monday) { daysOfWeek.push(DayOfWeek.Monday); }
    if (option & DayOfWeek.Tuesday) { daysOfWeek.push(DayOfWeek.Tuesday); }
    if (option & DayOfWeek.Wednesday) { daysOfWeek.push(DayOfWeek.Wednesday); }
    if (option & DayOfWeek.Thursday) { daysOfWeek.push(DayOfWeek.Thursday); }
    if (option & DayOfWeek.Friday) { daysOfWeek.push(DayOfWeek.Friday); }
    if (option & DayOfWeek.Saturday) { daysOfWeek.push(DayOfWeek.Saturday); }
    if (option & DayOfWeek.Sunday) { daysOfWeek.push(DayOfWeek.Sunday); }

    return daysOfWeek;
  }

  export function getDaysOfWeekFromMultiSelect(options: DayOfWeek[]): DayOfWeek {
    if (options.indexOf(DayOfWeek.Everyday) > -1) { return DayOfWeek.Everyday; }
    if (options.indexOf(DayOfWeek.None) > -1) { return DayOfWeek.None; }

    let dayOfWeek = DayOfWeek.None;
    if (options.indexOf(DayOfWeek.Monday) > -1) { dayOfWeek |= DayOfWeek.Monday; }
    if (options.indexOf(DayOfWeek.Tuesday) > -1) { dayOfWeek |= DayOfWeek.Tuesday; }
    if (options.indexOf(DayOfWeek.Wednesday) > -1) { dayOfWeek |= DayOfWeek.Wednesday; }
    if (options.indexOf(DayOfWeek.Thursday) > -1) { dayOfWeek |= DayOfWeek.Thursday; }
    if (options.indexOf(DayOfWeek.Friday) > -1) { dayOfWeek |= DayOfWeek.Friday; }
    if (options.indexOf(DayOfWeek.Saturday) > -1) { dayOfWeek |= DayOfWeek.Saturday; }
    if (options.indexOf(DayOfWeek.Sunday) > -1) { dayOfWeek |= DayOfWeek.Sunday; }

    return dayOfWeek;
  }

  export function getDaysOfWeekSortNumber(options: DayOfWeek[]): DayOfWeek {
    if (options.indexOf(DayOfWeek.Everyday) > -1) { return DayOfWeek.Everyday; }
    if (options.indexOf(DayOfWeek.None) > -1) { return DayOfWeek.None; }

    if (options.indexOf(DayOfWeek.Monday) > -1) { return DayOfWeek.Monday; }
    if (options.indexOf(DayOfWeek.Tuesday) > -1) { return DayOfWeek.Tuesday; }
    if (options.indexOf(DayOfWeek.Wednesday) > -1) { return DayOfWeek.Wednesday; }
    if (options.indexOf(DayOfWeek.Thursday) > -1) { return DayOfWeek.Thursday; }
    if (options.indexOf(DayOfWeek.Friday) > -1) { return DayOfWeek.Friday; }
    if (options.indexOf(DayOfWeek.Saturday) > -1) { return DayOfWeek.Saturday; }
    if (options.indexOf(DayOfWeek.Sunday) > -1) { return DayOfWeek.Sunday; }

    return DayOfWeek.None;
  }

  export function forSelectList(): SelectItem[] {
    const selectItems: SelectItem[] = [];
    // tslint:disable-next-line:forin
    for (const option in DayOfWeek) {
      const isValueProperty = parseInt(option, 10);
      if (isValueProperty && isValueProperty !== DayOfWeek.Everyday) {
        selectItems.push({ caption: DayOfWeek[isValueProperty], value: isValueProperty });
      }
    }

    selectItems.unshift({ caption: 'Everyday', value: 127 });

    return selectItems;
  }
}
