import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserPrefs, UnitOfMeasure } from '@models';
import { AuthenticationService } from './authentication.service';
import { TimeUtil } from '@util';

@Injectable()
export class UserPreferencesService {
  private allPrefs: UserPrefs[] = [];
  private defaultPrefs: UserPrefs = {
    EmailAddress: null,
    temp: UnitOfMeasure.Fahrenheit,
    tds: UnitOfMeasure.PartsPerMillion,
    lightLevel: UnitOfMeasure.Lux,
    vpd: UnitOfMeasure.Millibars,
    dashboard: 'charts',
    prefer24Hour: TimeUtil.osTime24Hour()
  };
  private prefs = new BehaviorSubject<UserPrefs>(this.defaultPrefs);

  public userPrefs = this.prefs.asObservable();
  public get currentUserPrefs() {
    return this.prefs.value;
  }

  constructor(private authenticationService: AuthenticationService) {
    const cache = localStorage.getItem('userPrefs');
    if (cache !== null && cache.length) {
      this.allPrefs = JSON.parse(cache);
    }

    if (this.authenticationService.currentUser) {
      const p = this.allPrefs.find(
        x => x.EmailAddress === this.authenticationService.currentUser.EmailAddress
      );
      if (p !== undefined) {
        const myPrefs = Object.assign({}, this.defaultPrefs, p);
        this.prefs.next(myPrefs);
      } else {
        const usrDefault = Object.assign({}, this.defaultPrefs);
        usrDefault.EmailAddress = this.authenticationService.currentUser.EmailAddress;
        this.prefs.next(usrDefault);
      }
    }
  }

  updatePrefs(preferences: UserPrefs): void {
    preferences.temp = Number.parseInt(preferences.temp.toString(), 10);
    preferences.tds = Number.parseInt(preferences.tds.toString(), 10);
    preferences.lightLevel = Number.parseInt(preferences.lightLevel.toString(), 10);
    preferences.vpd = Number.parseInt(preferences.vpd.toString(), 10);
    const index = this.allPrefs.findIndex(x => x.EmailAddress === preferences.EmailAddress);

    // tslint:disable-next-line:no-bitwise
    if (~index) {
      this.allPrefs[index] = preferences;
    } else {
      this.allPrefs.push(preferences);
    }

    localStorage.setItem('userPrefs', JSON.stringify(this.allPrefs));
    this.prefs.next(preferences);
  }
}
