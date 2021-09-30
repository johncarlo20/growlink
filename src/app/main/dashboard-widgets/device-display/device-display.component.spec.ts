import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DeviceDisplayComponent } from './device-display.component';

describe('DeviceDisplayComponent', () => {
  let component: DeviceDisplayComponent;
  let fixture: ComponentFixture<DeviceDisplayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
