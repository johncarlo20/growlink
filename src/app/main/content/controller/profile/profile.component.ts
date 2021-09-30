import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent } from '@angular/material/chips';
import { fuseAnimations } from '@fuse/animations';
import { tap } from 'rxjs/operators';
import {
  AuthenticationService,
  ControllerService,
  ProgressBarService,
  CountriesService,
  TimeZonesService,
  ProductTypesService,
} from '@services';
import {
  DayNightOption,
  Controller,
  ProductTypeResponse,
  UnitOfMeasure,
  SelectItem,
  ControllerResponse,
  DeviceTypes,
} from '@models';
import { BaseAPIComponent, TimeUtil } from '@util';
import * as moment from 'moment';
import 'moment-timezone';

@Component({
  selector: 'fuse-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
})
export class ProfileComponent extends BaseAPIComponent implements OnInit {
  isReadOnly = true;
  isTimeChanged = false;
  controller: Controller = new Controller();
  allControllers: ControllerResponse[] = [];
  controllerResponse: ControllerResponse = null;
  productType: ProductTypeResponse = new ProductTypeResponse();
  tempUnit: UnitOfMeasure;

  profileForm: FormGroup;
  countries: SelectItem[] = [];
  timeZoneIds: SelectItem[] = [];
  dayNightOptions: SelectItem[] = [];
  timezoneAbbr: string;
  email: FormControl = null;

  constructor(
    private authenticationService: AuthenticationService,
    private controllerService: ControllerService,
    private countriesService: CountriesService,
    private timeZonesService: TimeZonesService,
    private productService: ProductTypesService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);
    this.dayNightOptions = DayNightOption.forSelectList(true);
  }

  ngOnInit() {
    super.ngOnInit();

    this.subs.add(
      this.authenticationService.User.subscribe(u => {
        this.isReadOnly = u.IsReadOnlyAdmin;
      })
    );
    this.subs.add(
      this.countriesService.Countries.subscribe(c => {
        this.countries = this.countriesService.forSelectList();
      })
    );

    this.profileForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      country: new FormControl('', [Validators.required]),
      timezone: new FormControl('', [Validators.required]),
      dayStartTime: new FormControl('', [Validators.required]),
      dayEndTime: new FormControl('', [Validators.required]),
      shutdown: new FormControl(''),
      ledDayNight: new FormControl('', [Validators.required]),
      ledBrightness: new FormControl('', [Validators.required]),
      analogInput: new FormControl('', [Validators.required]),
      emails: new FormControl([]),
      dosingRunTime: new FormControl(''),
      dosingWaitTime: new FormControl(''),
    });

    this.email = new FormControl('', [Validators.email]);

    this.subs.add(
      this.progressBarService.Loading.subscribe(loading => {
        if (loading) {
          this.profileForm.disable();
        } else {
          this.profileForm.enable();
        }
      })
    );
    this.subs.add(this.country.valueChanges.subscribe(changes => this.countryChanges(changes)));
    this.subs.add(
      this.timezone.valueChanges.subscribe(changes => {
        if (moment.tz(changes)) {
          this.timezoneAbbr = TimeUtil.getTimezoneAbbr(changes);
        }
      })
    );
    this.subs.add(
      this.controllerService.currentContainer.subscribe(r => {
        this.updateController(r);
        this.updateControllerResponse();
      })
    );
    this.subs.add(
      this.controllerService.AllControllers.subscribe(r => {
        this.allControllers = r;
        this.updateControllerResponse();
      })
    );
    this.isTimeChanged = false;
    this.tempUnit = this.controller.Units.temp;
  }

  get name() {
    return this.profileForm.get('name');
  }
  get country() {
    return this.profileForm.get('country');
  }
  get timezone() {
    return this.profileForm.get('timezone');
  }
  get dayStartTime() {
    return this.profileForm.get('dayStartTime');
  }
  get dayEndTime() {
    return this.profileForm.get('dayEndTime');
  }
  get shutdown() {
    return this.profileForm.get('shutdown');
  }
  get ledDayNight() {
    return this.profileForm.get('ledDayNight');
  }
  get ledBrightness() {
    return this.profileForm.get('ledBrightness');
  }
  get analogInput() {
    return this.profileForm.get('analogInput');
  }
  get emails() {
    return this.profileForm.get('emails');
  }
  get dosingRunTime() {
    return this.profileForm.get('dosingRunTime');
  }
  get dosingWaitTime() {
    return this.profileForm.get('dosingWaitTime');
  }

  get ShutdownTemperatureSuffix() {
    switch (this.tempUnit) {
      case UnitOfMeasure.Celsius:
        return 'C';
      case UnitOfMeasure.Fahrenheit:
        return 'F';
      default:
        return '';
    }
  }

  get validNutrientModule(): boolean {
    if (!this.controller || !this.controller.Modules.length || this.controller.EnableInlineDosing) {
      return false;
    }

    const fwVer = this.controller.FirmwareVersion ? this.controller.FirmwareVersion : 0;
    if (fwVer < 155 || (fwVer > 199 && fwVer < 204)) {
      return false;
    }

    const hasDosingPump = this.controller.Modules.some(m => m.Devices.some(d => d.DeviceType === DeviceTypes.DosingPump));

    return hasDosingPump;
  }

  countryChanges(newCountry: string) {
    if (!newCountry || newCountry.length < 2 || newCountry === this.controller.CountryCode) {
      return;
    }

    this.controller.CountryCode = newCountry;
    this.refreshTimeZones().subscribe();
  }

  updateControllerResponse() {
    if (!this.controller) {
      this.controllerResponse = null;
      return;
    }

    this.controllerResponse = this.allControllers.find(controller => controller.Id === this.controller.Guid);
  }

  addEmail(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our email
    if ((value || '').trim() && this.email.valid) {
      const currentEmails: string[] = this.emails.value.map(addr => addr);
      currentEmails.push(value.trim());
      this.emails.setValue(currentEmails);
    }

    // Reset the input value
    if (input && this.email.valid) {
      this.email.setValue(null);
    }
  }

  removeEmail(email: string): void {
    const index = this.emails.value.indexOf(email);

    if (index >= 0) {
      const currentEmails: string[] = this.emails.value.map(addr => addr);
      currentEmails.splice(index, 1);
      this.emails.setValue(currentEmails);
    }
  }

  update() {
    const startTime = moment.tz(this.dayStartTime.value, 'HH:mm:ss', this.timezone.value);
    const endTime = moment.tz(this.dayEndTime.value, 'HH:mm:ss', this.timezone.value);
    const notificationEMails = this.emails.value as string[];
    const dosingRunTimeMoment = moment(this.dosingRunTime.value, 'HH:mm:ss');
    const dosingWaitTimeMoment = moment(this.dosingWaitTime.value, 'HH:mm:ss');
    let configUpdate = false;
    const updateConfigField = (fieldName: string, value: any, nullEqual: any = null) => {
      if (this.controller[fieldName] === undefined && value === nullEqual) {
        return;
      }

      if (this.controller[fieldName] !== value) {
        configUpdate = true;
        newController[fieldName] = value;
      }
    };

    const newController = { ...this.controller };
    newController.Name = this.name.value;
    newController.NotificationEmailAddresses = notificationEMails.length
      ? notificationEMails.join(',')
      : '';
    updateConfigField('CountryCode', this.country.value);
    updateConfigField('DayStartTime', startTime.format('HH:mm:ss'));
    updateConfigField('DayEndTime', endTime.format('HH:mm:ss'));
    updateConfigField('ShutdownTemperature', this.shutdown.value != null ? this.shutdown.value : null);
    updateConfigField('LedDayNightOption', this.ledDayNight.value);
    updateConfigField('LedBrightness', this.ledBrightness.value);
    updateConfigField('EnableAnalogLightingOverride', this.analogInput.value);
    updateConfigField('NutrientDosingRunTime', dosingRunTimeMoment.isValid()
      ? dosingRunTimeMoment.format('HH:mm:ss')
      : '00:00:00', '00:00:00');
    updateConfigField('NutrientDosingWaitTime', dosingWaitTimeMoment.isValid()
      ? dosingWaitTimeMoment.format('HH:mm:ss')
      : '00:00:00', '00:00:00');

    this.timeZonesService.getTimeZoneInfo(this.timezone.value).subscribe(
      tzInfo => {
        updateConfigField('TimeZoneId', tzInfo.Id);
        updateConfigField('TimeZoneObservesDaylightSaving', tzInfo.ObservesDaylightSavingTime);
        updateConfigField('TimeZoneOffset', tzInfo.UtcOffset);
        this.controllerService.updateSettings(newController, this.tempUnit).subscribe(
          () => {
            this.profileForm.reset();
            this.updateController(newController);
            this.showMessage(`Successfully saved profile`);
            if (configUpdate) {
              this.controllerService.updateConfig().subscribe(
                () => {
                  this.showMessage(`Successfully update configuration`);
                },
                error => {
                  this.handleError(error);
                }
              );
            }
          },
          error => {
            this.handleError(error);
          }
        );
      },
      _error => this.showError('Timezone not found on server!')
    );
  }

  protected showModelError(message: string, key: string, errors: string[]) {
    switch (key) {
      case 'Name':
        this.showServerErrors(this.name, errors);
        break;
      case 'DayStartTime':
        this.showServerErrors(this.dayStartTime, errors);
        break;
      case 'DayEndTime':
        this.showServerErrors(this.dayEndTime, errors);
        break;
      case 'CountryCode':
        this.showServerErrors(this.country, errors);
        break;
      case 'TimeZoneId':
        this.showServerErrors(this.timezone, errors);
        break;
      case 'ShutdownTemperature':
        this.showServerErrors(this.shutdown, errors);
        break;
      default:
        super.showModelError(message, key, errors);
        break;
    }
  }

  private updateController(controller: Controller): void {
    this.progressBarService.SetCurrentPage([
      {
        icon: 'business',
        caption: controller.Name,
        url: ['controller', controller.Guid, 'dashboard'],
      },
      { icon: 'settings', caption: 'Profile' },
    ]);

    if (!controller || !controller.Guid) {
      return;
    }

    this.controller = { ...controller };
    const productType = controller.Modules.filter(
      m => m.SerialNumber === this.controller.DeviceId
    )[0].ProductType;
    this.productType = this.productService.FindProductType(productType);
    this.refreshTimeZones().subscribe(() => {
      this.timezone.setValue(controller.TimeZoneId);
    });

    this.name.setValue(controller.Name);
    this.country.setValue(controller.CountryCode);
    if (moment.tz(controller.TimeZoneId)) {
      this.dayStartTime.setValue(
        moment.tz(controller.DayStartTime, 'HH:mm:ss', controller.TimeZoneId).format('HH:mm:ss')
      );
      this.dayEndTime.setValue(
        moment.tz(controller.DayEndTime, 'HH:mm:ss', controller.TimeZoneId).format('HH:mm:ss')
      );
    }
    this.shutdown.setValue(controller.ShutdownTemperature);
    this.ledDayNight.setValue(controller.LedDayNightOption);
    this.ledBrightness.setValue(controller.LedBrightness);
    this.analogInput.setValue(controller.EnableAnalogLightingOverride);
    this.emails.setValue(
      controller.NotificationEmailAddresses ? controller.NotificationEmailAddresses.split(',') : []
    );
    this.dosingRunTime.setValue(controller.NutrientDosingRunTime);
    this.dosingWaitTime.setValue(controller.NutrientDosingWaitTime);

    if (this.productType.SupportsDayRangeSettings) {
      this.dayStartTime.setValidators([Validators.required]);
      this.dayEndTime.setValidators([Validators.required]);
    } else {
      this.dayStartTime.clearValidators();
      this.dayEndTime.clearValidators();
    }
    if (this.productType.SupportsLedSettings) {
      this.ledDayNight.setValidators([Validators.required]);
      this.ledBrightness.setValidators([Validators.required]);
    } else {
      this.ledDayNight.clearValidators();
      this.ledBrightness.clearValidators();
    }
    if (this.productType.IsLightingController) {
      this.analogInput.setValidators([Validators.required]);
    } else {
      this.analogInput.clearValidators();
    }
  }

  private refreshTimeZones() {
    return this.timeZonesService
      .forSelectList(this.controller.CountryCode)
      .pipe(tap(zones => (this.timeZoneIds = zones)));
  }
}
