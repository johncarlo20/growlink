import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaseComponent } from '@util';
import { OrganizationService } from '@services';
import { StripeInvoiceResponse } from '@models';

@Component({
  selector: 'fuse-payment-history-dialog',
  templateUrl: './payment-history-dialog.component.html',
  styleUrls: ['./payment-history-dialog.component.scss'],
})
export class PaymentHistoryDialogComponent extends BaseComponent implements OnInit {
  history: StripeInvoiceResponse[] = [];
  orgId: string;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      organizationId: string
    },
    public dialogRef: MatDialogRef<PaymentHistoryDialogComponent>,
    private organizationService: OrganizationService,
  ) {
    super();
    this.orgId = data.organizationId;
  }

  ngOnInit() {
    setTimeout(() => {
      this.organizationService.getBillingHistory(this.orgId, 0).subscribe(
        history => {
          console.log('org billing history response', history);
          this.history = history;
        },
        error => console.log(error)
      );
    })
  }
}
