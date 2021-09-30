import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ManualTaskDisplayComponent } from './manual-task-display.component';

describe('DeviceDisplayComponent', () => {
  let component: ManualTaskDisplayComponent;
  let fixture: ComponentFixture<ManualTaskDisplayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ManualTaskDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManualTaskDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
