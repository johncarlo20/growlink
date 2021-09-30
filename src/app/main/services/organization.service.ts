import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { OrganizationResponse, OrganizationSubscriptionResponse, StripeBillingDetails, StripeCustomerRegistration, StripeInvoiceResponse } from '@models';
import { ProgressBarService } from './progress-bar.service';
import { StripeSubscription } from '../models/stripe-subscription';
import * as moment from 'moment';

@Injectable()
export class OrganizationService {
  private orgActiveSubscription = new BehaviorSubject<OrganizationSubscriptionResponse>(null);
  expiryShown = false;

  constructor(private http: HttpClient, private progressBarService: ProgressBarService) {
  }

  public get instanceSubscription() {
    return this.orgActiveSubscription.getValue();
  }

  public get activeSubscription() {
    return this.orgActiveSubscription.asObservable();
  }

  public get validSubscription(): boolean {
    const activeSub = this.orgActiveSubscription.getValue();
    if (!activeSub) { return true; }

    return !activeSub.IsLockedOut;
  }

  getOrganizations(): Observable<OrganizationResponse[]> {
    this.progressBarService.SetLoading(true);
    return this.http.get<OrganizationResponse[]>('api/organizations').pipe(
      finalize(() => this.progressBarService.SetLoading(false)));
  }

  getOrganizationActiveSubscription(orgId: string): Observable<OrganizationSubscriptionResponse> {
    this.progressBarService.SetLoading(true);
    return this.http.get<OrganizationSubscriptionResponse>(`api/OrganizationSubscriptions?id=${orgId}`).pipe(
      tap(orgSub => this.orgActiveSubscription.next(orgSub)),
      finalize(() => this.progressBarService.SetLoading(false)));
  }

  clearOrganizationActiveSubscription() {
    this.expiryShown = false;
    this.orgActiveSubscription.next(null);
  }

  createOrganizationStripeCustomer(customer: StripeCustomerRegistration): Observable<string> {
    this.progressBarService.SetLoading(true);
    return this.http.post<string>(`api/StripeCustomers`, customer).pipe(
      finalize(() => this.progressBarService.SetLoading(false)));
  }

  createOrganizationStripeSubscription(orgId: string, paymentId: string) {
    return this.putOrganizationStripeSubscription(orgId, 'CREATE', paymentId);
  }

  updateOrganizationStripeSubscription(orgId: string, paymentId: string) {
    return this.putOrganizationStripeSubscription(orgId, 'UPDATE', paymentId);
  }

  private putOrganizationStripeSubscription(orgId: string, method: 'CREATE' | 'UPDATE', paymentId: string) {
    this.progressBarService.SetLoading(true);
    const body = {Method: method, PaymentId: paymentId};

    return this.http.put<StripeSubscription>(`api/StripeCustomers/${orgId}`, body).pipe(
      finalize(() => this.progressBarService.SetLoading(false)));
  }

  getBillingDetails(orgId: string): Observable<StripeBillingDetails> {
    this.progressBarService.SetLoading(true);
    return this.http.get<StripeBillingDetails>(`api/StripeCustomers?id=${orgId}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false)));
  }

  getBillingHistory(orgId: string, limit = 5, after: string = null): Observable<StripeInvoiceResponse[]> {
    this.progressBarService.SetLoading(true);
    const url = `api/OrganizationSubscriptions/BillingHistory?id=${orgId}&limit=${limit}${after ? `&after=${after}` : ''}`;
    return this.http.get<StripeInvoiceResponse[]>(url).pipe(
      map(invoices => invoices.map(inv => {
        inv.Date = moment(inv.Date);
        if (inv.PaidDate) {
          inv.PaidDate = moment(inv.PaidDate);
        }
        return inv;
      })),
      finalize(() => this.progressBarService.SetLoading(false)));
  }
}
