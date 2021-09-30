import { Component, Input, OnDestroy, HostBinding, Optional, Self, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, NgControl, ControlValueAccessor } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { Subscription } from 'rxjs';
import { FocusMonitor } from '@angular/cdk/a11y';

@Component({
  selector: 'fuse-duration-input',
  templateUrl: './duration.component.html',
  styleUrls: ['./duration.component.scss'],
  providers: [
    { provide: MatFormFieldControl, useExisting: DurationComponent },
  ],
})
export class DurationComponent implements MatFormFieldControl<string>, ControlValueAccessor, OnDestroy {
  static nextId = 0;

  private _placeholder: string;
  private _required = false;
  private _condensed = false;
  private _disabled = false;
  private _onChange;
  private _onTouched;
  private _valSub: Subscription;
  focused = false;
  parts: FormGroup;
  stateChanges = new Subject<void>();
  @HostBinding() id = `duration-input-${DurationComponent.nextId++}`;
  controlType = 'duration-input';

  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @HostBinding('attr.aria-describedby') describedBy = '';

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }

  @Input()
  get value(): string {
    const n = this.parts.value;
    return `${n.hours}:${n.minutes}:${n.seconds}`;
  }
  set value(duration: string) {
    if (!duration || !duration.length) {
      return;
    }

    const format = /(\d+)/g;
    const result = duration.match(format);
    if (result.length !== 3) {
      return;
    }

    this.parts.setValue({ hours: parseInt(result[0], 10), minutes: parseInt(result[1], 10), seconds: parseInt(result[2], 10) });
    this.stateChanges.next();
    if (this._onChange) { this._onChange(duration); }
  }

  @Input()
  get placeholder() {
    return this._placeholder;
  }
  set placeholder(plh) {
    this._placeholder = plh;
    this.stateChanges.next();
  }

  @Input()
  get required() {
    return this._required;
  }
  set required(req) {
    this._required = (req === true);
    this.stateChanges.next();
  }

  @Input()
  get errorState() {
    return this.ngControl.dirty && this.ngControl.touched && this.ngControl.invalid;
  }

  @Input()
  get condensed() {
    return this._condensed;
  }
  set condensed(condense) {
    this._condensed = (condense === true);
    this.stateChanges.next();
  }

  @Input()
  get disabled() {
    return this._disabled;
  }
  set disabled(dis) {
    this._disabled = (dis === true);
    if (this.disabled) {
      this.parts.disable();
    } else {
      this.parts.enable();
    }
    this.stateChanges.next();
  }

  get empty() {
    return false;
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() !== 'input') {
      this.elRef.nativeElement.querySelector('input').focus();
    }
  }

  constructor(
    fb: FormBuilder,
    @Optional() @Self() public ngControl: NgControl,
    private fm: FocusMonitor,
    private elRef: ElementRef
  ) {
    if (this.ngControl !== null) { this.ngControl.valueAccessor = this; }

    this.parts = fb.group({
      'hours': { value: 0, disabled: false },
      'minutes': { value: 0, disabled: false },
      'seconds': { value: 0, disabled: false },
    });

    this.fm.monitor(this.elRef.nativeElement, true).subscribe(origin => {
      this.focused = !!origin;
      this.stateChanges.next();
      if (!origin) {
        if (this._onTouched) { this._onTouched(); }
        if (this._onChange) { this._onChange(this.value); }
      }
    });

    this._valSub = this.parts.valueChanges.subscribe(() => {
      if (this._onTouched) { this._onTouched(); }
      if (this._onChange) { this._onChange(this.value); }
    });
  }

  ngOnDestroy() {
    this._valSub.unsubscribe();
    this.stateChanges.complete();
    this.fm.stopMonitoring(this.elRef.nativeElement);
  }

  writeValue(obj: any): void {
    this.value = obj;
  }
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
