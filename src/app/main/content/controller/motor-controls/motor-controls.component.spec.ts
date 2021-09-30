import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MotorControlsComponent } from './motor-controls.component';

describe('MotorControlsComponent', () => {
  let component: MotorControlsComponent;
  let fixture: ComponentFixture<MotorControlsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MotorControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MotorControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
