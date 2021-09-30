import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditDosingRecipeDialogComponent } from './edit-dosing-recipe-dialog.component';

describe('EditDosingRecipeDialogComponent', () => {
  let component: EditDosingRecipeDialogComponent;
  let fixture: ComponentFixture<EditDosingRecipeDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditDosingRecipeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDosingRecipeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
