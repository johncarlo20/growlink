import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DeviceStates, SignalRService } from '@services';
import { DeviceTypes, DeviceModel, InterfaceType } from '@models';

@Component({
  selector: 'fuse-device-display',
  templateUrl: './device-display.component.html',
  styleUrls: ['./device-display.component.scss']
})
export class DeviceDisplayComponent implements OnInit, OnDestroy {

  @Input() device: DeviceModel;
  @Input() custom = false;
  @Input() customName: string;
  @Output() stateChanged = new EventEmitter<DeviceModel>();
  @Output() error = new EventEmitter<any>();

  get state(): string { return this._state; }

  get throttleAllowed(): boolean {
    if (this.device.interfaceType === InterfaceType.Default && this.device.allowManualThrottle) {
      return true;
    }

    return this.device.interfaceType === InterfaceType.PercentageSlider;
  }

  get throttleVisible(): boolean {
    if (this.throttleAllowed) {
      return false;
    }

    return (this._state === 'Auto-On' || this._state === 'Manual-On') &&
      (this.device.deviceType === DeviceTypes.DosingPump || this.device.deviceType === DeviceTypes.DosingPumpInline);
  }

  get throttleDisabled(): boolean {
    return (!this._state) || (this._state === 'Auto-On') || (this._state === 'Auto-Off');
  }

  get moduleName(): string {
    return this.device.module.name;
  }

  get bacNet(): boolean {
    return this.device.interfaceType === InterfaceType.Default
      && (this.device.productType.Name === 'BacnetGateway' || this.device.productType.Name === 'BacnetMstp');
  }

  get noControl(): boolean {
    if (this.device.interfaceType === InterfaceType.Default) {
      return this.bacNet;
    }

    return this.device.interfaceType === InterfaceType.None;
  }

  get isReadOnly(): boolean {
    return !this.device || this.device.isReadOnly;
  }

  get bacNetValue(): string {
    return this.device.value !== undefined && this.device.value !== null ? this.device.value : '';
  }

  private _state: string;
  private _stateSub: Subscription;
  private _throttle: Subject<number>;
  private _throttleSub: Subscription;
  public updating = new BehaviorSubject<boolean>(false);

  constructor(private signalR: SignalRService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.device.image = DeviceTypes.getDeviceImage(this.device.deviceType);
    this.device.stateImages = this.getDeviceStateImages();
    this._throttle = new Subject<number>();
    this._throttleSub = this._throttle.pipe(debounceTime(1000))
      .subscribe(newValue => this.updateDeviceState(this.device, newValue));
    this._stateSub = this.device.currentState.subscribe(state => {
      this._state = state;
      this.updating.next(state === 'Loading');
      this.device.stateImages = this.getDeviceStateImages();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this._throttleSub.unsubscribe();
    this._stateSub.unsubscribe();
  }

  updateThrottle(newVal: number) {
    if ((this._state === 'Loading') || (newVal === this.device.throttle)) { return; }

    this._throttle.next(newVal);
  }

  updateDeviceState(device: DeviceModel, cmd: DeviceStates): void {
    if (device.isReadOnly) {
      window.alert('Read-only users cannot manually control devices');
      return;
    }

    this.updating.next(true);
    const controllerId = this.device.controller.DeviceId;
    this.signalR.UpdateDeviceState(controllerId, device.moduleSerialNumber, device.particleDevice.valueOf(), cmd)
    .done(() => {
      const supportsStreaming = this.device.controller.SupportsStreaming;
        if (!supportsStreaming) {
          this.device._ignoreUpdates = 2;
        }
        switch (cmd) {
          case 'auto':
            this.device.pendingState = 'Auto-Off';
            break;
          case 'false':
            this.device.pendingState = 'Manual-Off';
            break;
          default:
            this.device.pendingState = 'Manual-On';
            break;
        }
        this.device.stateImages = this.getDeviceStateImages(!supportsStreaming ? this.device.pendingState : undefined);
        this.stateChanged.emit(this.device);
    })
    .fail(error => {
      console.error('UpdateDeviceState ERROR:', error);
      this.updating.next(false);
      this.error.emit(`Could not control device ${this.device.name}`);
    });
  }

  private getDeviceStateImages(state?: string): string[] {
    const imageUrl = 'assets/images/';

    let off = 'offinactive.png';
    let auto = 'neutralauto.png';
    let on = 'oninactive.png';

    switch (state || this._state) {
      case 'Auto-Off':
        auto = 'offauto.png';
        break;
      case 'Manual-Off':
        off = 'offactive.png';
        break;
      case 'Auto-On':
        auto = 'onauto.png';
        break;
      case 'Manual-On':
        on = 'onactive.png';
        break;
    }

    return [`${imageUrl}${off}`, `${imageUrl}${auto}`, `${imageUrl}${on}`];
  }
}
