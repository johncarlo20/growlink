import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditMotorControlDialogComponent } from './edit-motor-control-dialog.component';

describe('EditMotorControlDialogComponent', () => {
  let component: EditMotorControlDialogComponent;
  let fixture: ComponentFixture<EditMotorControlDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditMotorControlDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditMotorControlDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
