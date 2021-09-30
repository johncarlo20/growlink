import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditManualTaskDialogComponent } from './edit-manual-task-dialog.component';

describe('EditManualTaskDialogComponentComponent', () => {
  let component: EditManualTaskDialogComponent;
  let fixture: ComponentFixture<EditManualTaskDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditManualTaskDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditManualTaskDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
