import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin, Observable } from 'rxjs';

export class ConfirmRulegroupActivationDialogOptions {
  message: string;
  hasLights: boolean;
  currentDescs: Observable<string>[];
  newDescs: Observable<string>[];
}

@Component({
  selector: 'fuse-confirm-rulegroup-activation-dialog',
  templateUrl: './confirm-rulegroup-activation-dialog.component.html',
  styleUrls: ['./confirm-rulegroup-activation-dialog.component.scss']
})
export class ConfirmRulegroupActivationDialogComponent implements OnInit {
  CurrentDescriptions: string[] = [];
  NewDescriptions: string[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmRulegroupActivationDialogOptions,
    public dialogRef: MatDialogRef<ConfirmRulegroupActivationDialogComponent, boolean>) { }

  ngOnInit() {
    if (this.data.hasLights) {
      if (this.data.currentDescs) {
        forkJoin(this.data.currentDescs).subscribe((descs) => this.CurrentDescriptions = descs);
      }
      if (this.data.newDescs) {
        forkJoin(this.data.newDescs).subscribe((descs) => this.NewDescriptions = descs);
      }
    }
  }

  onConfirm() {
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
