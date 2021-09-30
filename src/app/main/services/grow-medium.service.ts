import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EnumDetails, GrowMedium, SelectItem } from '@models';

@Injectable({
  providedIn: 'root'
})
export class GrowMediumService {
  private growMediums: EnumDetails[] = [];

  constructor(private http: HttpClient) {
    this.loadGrowMediums();
  }

  private loadGrowMediums(): void {
    const cache = sessionStorage.getItem('growMediums');
    if (cache !== null && cache.length) {
      this.growMediums = JSON.parse(cache);
    }

    this.http.get<EnumDetails[]>('api/GrowMedium')
      .subscribe(r => {
        this.growMediums = r;
        this.growMediums.sort((a, b) => a.SortId - b.SortId);
        sessionStorage.setItem('growMediums', JSON.stringify(this.growMediums));
      });
  }

  public forSelectList(): SelectItem[] {
    const selectItems: SelectItem[] = [];

    for (const growMedium of this.growMediums) {
      if (growMedium.Id === 0) { continue; }
      selectItems.push({ value: growMedium.Id, caption: growMedium.Description });
    }

    return selectItems;
  }

  public FindGrowMedium(growMedium: GrowMedium) {
    return this.growMediums.find(gm => gm.Id === growMedium);
  }
}
