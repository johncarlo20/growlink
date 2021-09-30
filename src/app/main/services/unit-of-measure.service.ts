import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { UnitOfMeasureResponse } from '@models';
import { AuthenticationService } from './authentication.service';
import { ProgressBarService } from './progress-bar.service';

@Injectable()
export class UnitOfMeasureService {

  private allUnitOfMeasures: UnitOfMeasureResponse[] = [];
  private units = new BehaviorSubject<UnitOfMeasureResponse[]>([]);
  public unitOfMeasures = this.units.asObservable();

  constructor(private http: HttpClient, private authenticationService: AuthenticationService, private progressBarService: ProgressBarService) {
    this.authenticationService.User.subscribe((user) => {
      if (!user || !user.EmailAddress) {
        return;
      }

      this.loadMeasures();
    });
  }

  private loadMeasures(): void {
    const cache = sessionStorage.getItem('UnitOfMeasures');
    if (cache !== null && cache.length) {
      this.allUnitOfMeasures = JSON.parse(cache);
      this.units.next(this.allUnitOfMeasures);
      return;
    }

    this.progressBarService.SetLoading(true);
    this.http.get<UnitOfMeasureResponse[]>('api/UnitOfMeasures')
      .subscribe(r => {
        this.progressBarService.SetLoading(false);
        this.allUnitOfMeasures = r;
        this.units.next(this.allUnitOfMeasures);
        sessionStorage.setItem('UnitOfMeasures', JSON.stringify(r));
      });
  }

  public FindUnitOfMeasure(uomId: number) {
    return this.allUnitOfMeasures.find(uom => uom.Id === uomId);
  }
}
