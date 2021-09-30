import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SensorDisplayComponent } from './sensor-display.component';

describe('SensorDisplayComponent', () => {
  let component: SensorDisplayComponent;
  let fixture: ComponentFixture<SensorDisplayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SensorDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SensorDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
