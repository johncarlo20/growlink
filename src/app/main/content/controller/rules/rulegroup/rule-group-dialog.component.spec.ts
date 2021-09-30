import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RuleGroupDialogComponent } from './rule-group-dialog.component';

describe('RuleGroupDialogComponent', () => {
  let component: RuleGroupDialogComponent;
  let fixture: ComponentFixture<RuleGroupDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RuleGroupDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RuleGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
