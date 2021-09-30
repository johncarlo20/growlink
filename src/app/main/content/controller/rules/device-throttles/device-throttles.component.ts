import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { DeviceWithThrottle, InterfaceType } from '@models';
import { BaseComponent } from '@util';

@Component({
  selector: 'fuse-device-throttles',
  templateUrl: './device-throttles.component.html',
  styleUrls: ['./device-throttles.component.scss']
})
export class DeviceThrottlesComponent extends BaseComponent implements OnInit, OnChanges {
  @Input() editForm: FormGroup;
  @Input() selectedDeviceThrottles: DeviceWithThrottle[] = [];

  public static CheckDirty(throttles: DeviceWithThrottle[], editForm: FormGroup): boolean {
    for (const dt of throttles) {
      let controlKey = `throttle-${dt.Guid}`;
      if (editForm.contains(controlKey) && editForm.get(controlKey).dirty) {
        return true;
      }

      controlKey = `bacnet-${dt.Guid}`;
      if (editForm.contains(controlKey) && editForm.get(controlKey).dirty) {
        return true;
      }
    }

    return false;
  }

  constructor() {
    super();
  }

  ngOnInit() {
    this.subs.add(
      this.devices.valueChanges.subscribe(() => this.updateSelectedDevices())
    );
    this.subs.add(
      this.editForm.valueChanges.subscribe(() => {
        this.selectedDeviceThrottles.forEach(throttle => {
          if (this.editForm.contains(`throttle-${throttle.Guid}`)) {
            const slider = this.editForm.get(`throttle-${throttle.Guid}`);
            throttle.Throttle = slider.value;
          }
          if (this.editForm.contains(`bacnet-${throttle.Guid}`)) {
            const bacnet = this.editForm.get(`bacnet-${throttle.Guid}`);
            throttle.BACNetValue = bacnet.value;
          }
        });
      })
    );
    this.updateSelectedDevices();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateSelectedDevices();
  }

  get devices() {
    return this.editForm.get('devices');
  }

  get deviceThrottles() {
    return this.selectedDeviceThrottles.filter(throttle => throttle.AllowsThrottle || throttle.IsBACNet || throttle.InterfaceType === InterfaceType.PercentageSlider);
  }

  private updateSelectedDevices() {
    this.selectedDeviceThrottles
      .filter(throttle => throttle.AllowsThrottle || throttle.InterfaceType === InterfaceType.PercentageSlider)
      .forEach(throttle => {
        const controlKey = `throttle-${throttle.Guid}`;
        if (!this.editForm.contains(controlKey)) {
          this.editForm.addControl(controlKey, new FormControl(throttle.Throttle));
        }
      });

    this.selectedDeviceThrottles
      .filter(throttle => throttle.IsBACNet && throttle.InterfaceType === InterfaceType.Default)
      .forEach(throttle => {
        const controlKey = `bacnet-${throttle.Guid}`;
        if (!this.editForm.contains(controlKey)) {
          this.editForm.addControl(controlKey, new FormControl(throttle.BACNetValue));
        }
      });
  }
}
