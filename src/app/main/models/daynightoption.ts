import { SelectItem } from './select-item';

export enum DayNightOption {
  TwentyFourHours = 0,
  DayOnly = 1,
  NightOnly = 2,
  CustomTime = 3
}

export namespace DayNightOption {
  export function forSelectList(noCustom = false): SelectItem[] {
    const selectItems: SelectItem[] = [];
    // tslint:disable-next-line:forin
    for (const option in DayNightOption) {
      const isValueProperty = parseInt(option, 10);
      if (!isNaN(isValueProperty) && (!noCustom || isValueProperty !== 3)) {
        selectItems.push({ caption: toHumanReadable(isValueProperty), value: isValueProperty });
      }
    }

    return selectItems;
  }

  export function toHumanReadable(option: DayNightOption): string {
    switch (option) {
      case DayNightOption.TwentyFourHours:
        return 'All Day';

      case DayNightOption.DayOnly:
        return 'Day Only';

      case DayNightOption.NightOnly:
        return 'Night Only';

      case DayNightOption.CustomTime:
        return 'Custom Time';

      default:
        return 'Unknown';
    }
  }
}
