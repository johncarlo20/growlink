import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddLightSensorDialogComponent } from './add-light-sensor-dialog.component';

describe('AddLightSensorDialogComponent', () => {
  let component: AddLightSensorDialogComponent;
  let fixture: ComponentFixture<AddLightSensorDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddLightSensorDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLightSensorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
