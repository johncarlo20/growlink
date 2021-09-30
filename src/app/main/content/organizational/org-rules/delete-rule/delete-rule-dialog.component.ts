import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MappedRule } from '../org-rules.models';
import { Controller } from '@models';

@Component({
  selector: 'fuse-delete-rule-dialog',
  templateUrl: './delete-rule-dialog.component.html',
  styleUrls: ['./delete-rule-dialog.component.scss']
})
export class DeleteRuleDialogComponent implements OnInit {
  rule: MappedRule;
  controllers: Controller[] = [];
  deleteRuleForm: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { rule: MappedRule },
    public dialogRef: MatDialogRef<DeleteRuleDialogComponent>) {
    this.rule = data.rule;
    this.controllers = [...this.rule.Controllers]
      .sort((a, b) => a.Name.localeCompare(b.Name));
  }

  ngOnInit() {
    this.deleteRuleForm = new FormGroup({
      selectedControllers: new FormControl([], [Validators.required]),
    });
  }

  get selectedControllers() { return this.deleteRuleForm.get('selectedControllers') as FormControl; }

  update() {
    this.dialogRef.close(this.selectedControllers.value);
  }

  removeAll() {
    this.dialogRef.close(this.controllers.map(c => c.Guid));
  }
}
