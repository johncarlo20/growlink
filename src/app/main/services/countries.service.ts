import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Country, SelectItem } from '@models';
import { ProgressBarService } from './progress-bar.service';

@Injectable()
export class CountriesService {
  private countries: BehaviorSubject<Country[]> = new BehaviorSubject<Country[]>([]);

  public get Countries() {
    return this.countries.asObservable();
  }

  constructor(private http: HttpClient, private progressBarService: ProgressBarService) {
    this.loadCountries();
  }

  private loadCountries(): void {
    const cache = sessionStorage.getItem('countries');
    if (cache !== null && cache.length) {
      this.countries.next(JSON.parse(cache));
    }

    this.progressBarService.SetLoading(true);
    this.http.get<Country[]>('api/Countries').subscribe(r => {
      this.progressBarService.SetLoading(false);
      this.countries.next(r);
      sessionStorage.setItem('countries', JSON.stringify(r));
    });
  }

  forSelectList(): SelectItem[] {
    const selectItems: SelectItem[] = [];

    for (const country of this.countries.value) {
      selectItems.push({ value: country.Code, caption: country.Name });
    }

    return selectItems;
  }
}
