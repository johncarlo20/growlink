import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SensorGaugeComponent } from './sensor-gauge.component';

describe('SensorGaugeComponent', () => {
  let component: SensorGaugeComponent;
  let fixture: ComponentFixture<SensorGaugeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SensorGaugeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SensorGaugeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
