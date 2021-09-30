import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditAlertDialogComponent } from './edit-alert-dialog.component';

describe('EditAlertDialogComponent', () => {
  let component: EditAlertDialogComponent;
  let fixture: ComponentFixture<EditAlertDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditAlertDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAlertDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
