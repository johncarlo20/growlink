import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
  AuthenticationService,
  OrganizationService,
  ProgressBarService,
  SignalRService,
} from '@services';
import { BaseAPIComponent } from '@util';
import { CustomerResponse, IStringDictionary, OrganizationSubscription, OrganizationSubscriptionResponse, StripeInvoiceResponse } from '@models';
import { PaymentMethodDialogComponent } from './payment-method-dialog/payment-method-dialog.component';
import { PaymentHistoryDialogComponent } from './payment-history-dialog/payment-history-dialog.component';
import { capitalize } from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'fuse-subscription-management',
  templateUrl: './subscription-management.component.html',
  styleUrls: ['./subscription-management.component.scss']
})
export class SubscriptionManagementComponent extends BaseAPIComponent implements OnInit {

  private orgId: string;
  private currencyFormat = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
  orgSub: OrganizationSubscriptionResponse;
  currentUser: CustomerResponse;
  history = new Array<StripeInvoiceResponse>();

  @ViewChild('cardElement') cardElement: ElementRef;

  constructor(
    private authenticationService: AuthenticationService,
    private organizationService: OrganizationService,
    private signalR: SignalRService,
    public dialog: MatDialog,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);
    this.progressBarService.SetCurrentPage([
      { icon: 'attach_money', caption: 'Subscription Management' },
    ]);
  }

  ngOnInit() {
    super.ngOnInit();

    this.subs.add(
      this.authenticationService.User.subscribe(user => {
        this.orgId = user.OrganizationId;
        this.currentUser = user;
        this.updateSubscription();
      })
    );

    this.subs.add(
      this.signalR.OrganizationSubscription.subscribe(organizationId => {
        if (this.orgId !== organizationId) {
          return;
        }

        this.updateSubscription();
      })
    );
  }

  get IsStripeCustomer(): boolean {
    if (!this.currentUser) { return false; }

    return this.currentUser.StripeCustomerId && this.currentUser.StripeCustomerId.length > 0;
  }

  get IsStripeSubscriber(): boolean {
    if (!this.currentUser) { return false; }

    return this.currentUser.StripeSubscriptionId && this.currentUser.StripeSubscriptionId.length > 0;
  }

  get Status(): string {
    if (!this.orgSub) {
      return 'N/A';
    }

    const nextDate = moment(this.NextBillingDate);

    if (!nextDate.isValid()) {
      return 'No Expiry';
    }
    if (nextDate.isBefore(moment().add(2, 'days'))) {
      return 'Due for payment';
    }
    return nextDate.isBefore(moment()) ? 'Expired' : 'Active';
  }
  get NextBillingDate(): string {
    if (!this.orgSub) {
      return 'N/A';
    }

    let nextDate = moment(this.orgSub.NextBillingDate);
    if (nextDate.isValid() && nextDate.year() < 2000) {
      nextDate = moment();
    }

    return nextDate.isValid ? nextDate.format('LL') : 'N/A';
  }
  get NextBillingAmount(): string {
    if (!this.orgSub) {
      return 'N/A';
    }

    const nextAmount = this.currencyFormat.format(this.orgSub.NextBillingAmount);

    return nextAmount;
  }
  get PaymentMethod(): string {
    if (!this.orgSub) {
      return 'N/A';
    }

    return capitalize(this.orgSub.PaymentType);
  }
  get CardType(): string {
    if (!this.orgSub) {
      return 'N/A';
    }

    return capitalize(this.orgSub.CardType);
  }
  get Last4Digits(): string {
    if (!this.orgSub) {
      return 'N/A';
    }

    return `XXXX-XXXX-XXXX-${this.orgSub.CardLast4}`;
  }
  get Expiry(): string {
    if (!this.orgSub) {
      return 'N/A';
    }

    return this.orgSub.CardExpiry;
  }

  get ActiveSubscription(): OrganizationSubscription {
    if (!this.orgSub || !this.orgSub.Subscriptions || this.orgSub.Subscriptions.length < 1) {
      return null;
    }

    return this.orgSub.Subscriptions[0];
  }


  get BillingCycle(): string {
    if (!this.ActiveSubscription) {
      return 'N/A';
    }

    return this.ActiveSubscription.BillingPeriodType;
  }

  get BillingCycleSingle(): string {
    if (!this.ActiveSubscription) {
      return 'N/A';
    }

    return this.ActiveSubscription.BillingPeriodType === 'Monthly' ? 'Monthly' : 'Annual';
  }

  get Prices(): string[] {
    if (!this.orgSub) {
      return [];
    }

    return Object.keys(this.orgSub.PriceDetails);
  }

  get PriceDetails(): IStringDictionary {
    if (!this.orgSub) {
      return {};
    }

    const keys = Object.keys(this.orgSub.PriceDetails);
    const result = {};
    keys.forEach(price => {
      result[price] = this.orgSub.PriceDetails[price].replace(/(\d+.\d+)(USD)/g, '$$$1');
    });

    return result;
  }

  editPaymentMethod() {
    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { orgSub: this.orgSub },
    };

    const dialogRef = this.dialog.open(PaymentMethodDialogComponent, config);
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        return;
      }

      this.updateSubscription();
    });
  }

  fullPaymentHistory() {
    const config: MatDialogConfig = {
      panelClass: 'entity-updates-panel',
      data: { organizationId: this.orgId },
    };

    const dialogRef = this.dialog.open(PaymentHistoryDialogComponent, config);
    dialogRef.afterClosed().subscribe(() => { });
  }

  private updateSubscription(): void {
    setTimeout(() => {
      this.organizationService.getOrganizationActiveSubscription(this.orgId).subscribe(
        orgSub => {
          console.log('org sub response', orgSub);
          this.orgSub = orgSub;
        },
        error => this.handleError(error)
      );
      this.organizationService.getBillingHistory(this.orgId).subscribe(
        history => {
          console.log('org billing history response', history);
          this.history = history;
        },
        error => this.handleError(error)
      );
    });
  }
}
