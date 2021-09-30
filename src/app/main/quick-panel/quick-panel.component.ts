import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UserPrefs, UnitOfMeasure } from '@models';
import { UserPreferencesService, AuthenticationService, UnitOfMeasureService } from '@services';
import { environment } from '../../../environments/environment';
import { BaseComponent } from '@util';

@Component({
  selector: 'fuse-quick-panel',
  templateUrl: './quick-panel.component.html',
  styleUrls: ['./quick-panel.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FuseQuickPanelComponent extends BaseComponent implements OnInit {
  date: Date;
  userPrefs: UserPrefs;
  domainId: string = null;
  uomDescriptions = new Map<UnitOfMeasure, string>();

  constructor(
    private userPrefsService: UserPreferencesService,
    private authenticationService: AuthenticationService,
    private uomService: UnitOfMeasureService
  ) {
    super();

    this.date = new Date();
    this.extractUnitDescriptions();
  }

  private extractUnitDescriptions() {
    // tslint:disable-next-line:forin
    for (const option in UnitOfMeasure) {
      const optionValue = parseInt(option, 10);
      const unit = this.uomService.FindUnitOfMeasure(optionValue);
      if (unit) {
        this.uomDescriptions.set(optionValue, unit.Description);
      }
    }
  }

  ngOnInit() {
    this.subs.add(
      this.userPrefsService.userPrefs.subscribe((prefs) => {
        this.userPrefs = prefs;
      })
    );
    this.subs.add(
      this.authenticationService.User.subscribe((user) => {
        if (!user) {
          return;
        }

        this.domainId = user.DomainId;
      })
    );
    this.subs.add(
      this.uomService.unitOfMeasures.subscribe((units) => {
        this.extractUnitDescriptions();
      })
    );
  }

  unitDescription(uom: UnitOfMeasure): string {
    if (!this.uomDescriptions.has(uom)) {
      return 'UNKNOWN';
    }

    return this.uomDescriptions.get(uom);
  }

  updatePrefs(): void {
    this.userPrefsService.updatePrefs(this.userPrefs);
  }

  get daySuffix(): string {
    switch (this.date.getDate()) {
      case 1:
      case 21:
      case 31:
        return 'st';
      case 2:
      case 22:
        return 'nd';
      case 3:
      case 23:
        return 'rd';
      default:
        return 'th';
    }
  }

  get prodUrl(): string {
    return environment.prodUrl;
  }
}
