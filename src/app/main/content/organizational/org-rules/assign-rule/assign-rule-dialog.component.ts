import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MappedRule } from '../org-rules.models';
import { Controller } from '@models';
import { BaseComponent } from '@util';

@Component({
  selector: 'fuse-assign-rule-dialog',
  templateUrl: './assign-rule-dialog.component.html',
  styleUrls: ['./assign-rule-dialog.component.scss']
})
export class AssignRuleDialogComponent extends BaseComponent implements OnInit {
  rule: MappedRule;
  existRuleControllers: Controller[] = [];
  controllers: Controller[] = [];
  assignRuleForm: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { rule: MappedRule, controllers: Controller[] },
    public dialogRef: MatDialogRef<AssignRuleDialogComponent>) {
    super();

    this.rule = data.rule;
    this.controllers = [...data.controllers]
      .filter(c => !this.rule.HasController(c))
      .sort((a, b) => a.Name.localeCompare(b.Name));
    this.existRuleControllers = [...this.rule.Controllers];
  }

  ngOnInit() {
    this.assignRuleForm = new FormGroup({
      selectedControllers: new FormControl([], [Validators.required]),
    });

    this.subs.add(this.assignRuleForm.valueChanges.subscribe(() => {
      this.rule.Controllers = [
        ...this.existRuleControllers,
        ...this.controllers.filter(c => this.selectedControllers.value.find(selected => selected === c.Guid))
      ];
    }));
  }

  get selectedControllers() { return this.assignRuleForm.get('selectedControllers') as FormControl; }

  update() {
    this.dialogRef.close(this.rule);
  }
}
