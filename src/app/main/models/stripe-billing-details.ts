export class StripeBillingDetails {
  email: string;
  name: string;
  phone: string;
  state: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
  };
}
