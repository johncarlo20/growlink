import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DosingRecipesComponent } from './dosing-recipes.component';

describe('DosingRecipesComponent', () => {
  let component: DosingRecipesComponent;
  let fixture: ComponentFixture<DosingRecipesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DosingRecipesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DosingRecipesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
