import { StripeInvoice } from './stripe-invoice';

export class StripeSubscription {
  id: string;
  status: string;
  latest_invoice: StripeInvoice;
}
