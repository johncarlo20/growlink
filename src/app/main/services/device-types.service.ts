import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DeviceTypeResponse, DeviceTypes, ProductTypeResponse, SelectItem } from '@models';
import { ProgressBarService } from './progress-bar.service';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class DeviceTypesService {
  private deviceTypes = new BehaviorSubject<DeviceTypeResponse[]>([]);

  constructor(private http: HttpClient, private progressBarService: ProgressBarService) {
    this.loadDeviceTypes();
  }

  public get DeviceTypes() {
    return this.deviceTypes.asObservable();
  }

  private loadDeviceTypes(): void {
    const cache = sessionStorage.getItem('deviceTypes');
    if (cache !== null && cache.length) {
      this.deviceTypes.next(JSON.parse(cache));
    }

    this.progressBarService.SetLoading(true);
    this.http.get<DeviceTypeResponse[]>('api/DeviceTypes').subscribe((r) => {
        this.progressBarService.SetLoading(false);
        this.deviceTypes.next(r);
        sessionStorage.setItem('deviceTypes', JSON.stringify(r));
      });
  }

  public isDosingModule(moduleProductType: ProductTypeResponse) {
    return (
      moduleProductType.Name === 'DosingPumpSingle' ||
      moduleProductType.Name === 'DosingPumpHighFlow' ||
      moduleProductType.Name === 'DosingPumpEightChannelExpansion' ||
      moduleProductType.Name === 'CurrentLoopExpansionModule'
    );
  }

  public forSelectList(availDevicesList: number[]): SelectItem[] {
    if (!availDevicesList) {
      return [];
    }

    const selectItems = this.deviceTypes.value
      .filter(
        (dt) =>
          availDevicesList.some((ad) => ad === dt.Id) &&
          dt.Id !== DeviceTypes.None &&
          dt.Id !== DeviceTypes.NotInUse
      )
      .map((dt) => ({ caption: dt.Description, value: dt.Id }));

    selectItems.sort(function (a, b) {
      return a.caption > b.caption ? 1 : b.caption > a.caption ? -1 : 0;
    });

    selectItems.unshift({ caption: 'None', value: 0 });
    selectItems.unshift({ caption: 'Not In Use', value: 16 });

    return selectItems;
  }

  public forMotorControlSelectList(): SelectItem[] {
    const selectItems = this.deviceTypes.value
      .filter((dt) => dt.IsMotor && dt.Id !== 0)
      .map((dt) => ({ caption: dt.Description, value: dt.Id }));

    selectItems.sort(function (a, b) {
      return a.caption > b.caption ? 1 : b.caption > a.caption ? -1 : 0;
    });

    selectItems.unshift({ caption: 'None', value: 0 });

    return selectItems;
  }

  public FindDeviceType(deviceType: DeviceTypes) {
    return this.deviceTypes.value.find((dt) => dt.Id === deviceType);
  }
}
