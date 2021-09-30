import { StripeAddress } from './stripe-address';

export class StripeCustomerRegistration {
  OrganizationId: string;
  Name: string;
  Email: string;
  Phone: string;
  Contact: string;
  Address: StripeAddress;
}
