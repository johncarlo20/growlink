import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditDeviceDialogComponent } from './edit-device-dialog.component';

describe('EditDeviceDialogComponent', () => {
  let component: EditDeviceDialogComponent;
  let fixture: ComponentFixture<EditDeviceDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditDeviceDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDeviceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
