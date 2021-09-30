import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditSensorTriggerDialogComponent } from './edit-sensor-trigger-dialog.component';

describe('EditSensorTriggerDialogComponent', () => {
  let component: EditSensorTriggerDialogComponent;
  let fixture: ComponentFixture<EditSensorTriggerDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditSensorTriggerDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSensorTriggerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
