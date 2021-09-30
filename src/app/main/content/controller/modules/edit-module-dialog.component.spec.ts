import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditModuleDialogComponent } from './edit-module-dialog.component';

describe('EditModuleDialogComponent', () => {
  let component: EditModuleDialogComponent;
  let fixture: ComponentFixture<EditModuleDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditModuleDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditModuleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
