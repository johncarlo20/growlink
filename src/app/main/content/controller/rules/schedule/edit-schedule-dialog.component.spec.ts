import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditScheduleDialogComponent } from './edit-schedule-dialog.component';

describe('EditScheduleDialogComponent', () => {
  let component: EditScheduleDialogComponent;
  let fixture: ComponentFixture<EditScheduleDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditScheduleDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditScheduleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
