import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EnumDetails, SoilECType, SelectItem } from '@models';

@Injectable({
  providedIn: 'root'
})
export class SoilECTypeService {
  private soilECTypes: EnumDetails[] = [];

  constructor(private http: HttpClient) {
    this.loadSoilECTypes();
  }

  private loadSoilECTypes(): void {
    const cache = sessionStorage.getItem('soilECTypes');
    if (cache !== null && cache.length) {
      this.soilECTypes = JSON.parse(cache);
    }

    this.http.get<EnumDetails[]>('api/SoilECType')
      .subscribe(r => {
        this.soilECTypes = r;
        this.soilECTypes.sort((a, b) => a.SortId - b.SortId);
        sessionStorage.setItem('soilECTypes', JSON.stringify(this.soilECTypes));
      });
  }

  public forSelectList(): SelectItem[] {
    const selectItems: SelectItem[] = [];

    for (const soilECType of this.soilECTypes) {
      if (soilECType.Id === 0) { continue; }
      selectItems.push({ value: soilECType.Id, caption: soilECType.Description });
    }

    return selectItems;
  }

  public FindGrowMedium(soilECType: SoilECType) {
    return this.soilECTypes.find(sect => sect.Id === soilECType);
  }
}
