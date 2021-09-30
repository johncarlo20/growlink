import { SelectItem } from './select-item';

export enum ComparisonType {
    Above = 0,
    Below = 1
}

export namespace ComparisonType {
    export function forSelectList(): SelectItem[] {
        const selectItems: SelectItem[] = [];
        // tslint:disable-next-line:forin
        for (const option in ComparisonType) {
            const isValueProperty = parseInt(option, 10);
            if (!isNaN(isValueProperty)) {
                selectItems.push({caption: ComparisonType[isValueProperty], value: isValueProperty });
            }
        }

        selectItems.unshift({ caption: 'Select One', value: null });
        return selectItems;
    }
}
