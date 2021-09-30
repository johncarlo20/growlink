import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SensorValueComponent } from './sensor-value.component';

describe('SensorDisplayComponent', () => {
  let component: SensorValueComponent;
  let fixture: ComponentFixture<SensorValueComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SensorValueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SensorValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
