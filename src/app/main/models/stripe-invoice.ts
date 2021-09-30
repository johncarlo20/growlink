import { StripePaymentIntent } from './stripe-payment-intent';

export class StripeInvoice {
  id: string;
  status: string;
  payment_intent: StripePaymentIntent;
}
