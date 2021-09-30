import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ProgressBarService, ControllerService } from '@services';
import { RuleGroup } from '@models';
import { BaseAPIComponent } from '@util';

@Component({
  selector: 'fuse-rule-group-dialog',
  templateUrl: './rule-group-dialog.component.html'
})
export class RuleGroupDialogComponent extends BaseAPIComponent implements OnInit {
  editRuleGroupForm: FormGroup;
  ruleGroup: RuleGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: RuleGroup,
  public dialogRef: MatDialogRef<RuleGroupDialogComponent, RuleGroup>,
  private controllerService: ControllerService,
  progressBarService: ProgressBarService,
  snackbar: MatSnackBar
) {
    super(snackbar, progressBarService);

    this.ruleGroup = data;
  }

  ngOnInit() {
    super.ngOnInit();

    this.editRuleGroupForm = new FormGroup({
      name: new FormControl(this.ruleGroup.Name, [Validators.required]),
    });

    this.subs.add(this.editRuleGroupForm.valueChanges.subscribe(() => {
      this.ruleGroup.Name = this.name.value;
    }));
  }

  get name() { return this.editRuleGroupForm.get('name'); }

  public update() {
    if (!this.ruleGroup.Id) {
      this.controllerService.addRuleGroup(this.ruleGroup).subscribe(
        newRuleGroup => {
          this.showMessage(`Added new Rule Group '${this.ruleGroup.Name}'`);
          this.dialogRef.close(newRuleGroup);
        },
        error => this.handleError(error)
      );
    } else {
      this.controllerService.updateRuleGroup(this.ruleGroup).subscribe(
        () => {
          this.showMessage(`Saved changes to Rule Group '${this.ruleGroup.Name}'`);
          this.dialogRef.close(this.ruleGroup);
        },
        error => this.handleError(error)
      );
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  protected showModelError(message: string, key: string, errors: string[]) {
    switch (key) {
      case 'Name':
        this.showServerErrors(this.name, errors);
        break;
      default:
        super.showModelError(message, key, errors);
        break;
    }
  }
}
