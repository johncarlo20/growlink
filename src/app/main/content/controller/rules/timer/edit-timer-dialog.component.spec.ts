import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditTimerDialogComponent } from './edit-timer-dialog.component';

describe('EditTimerDialogComponentComponent', () => {
  let component: EditTimerDialogComponent;
  let fixture: ComponentFixture<EditTimerDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditTimerDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTimerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
