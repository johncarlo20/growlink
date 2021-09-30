import * as moment from 'moment';

export class StripeInvoiceResponse {
  Id: string;
  Status: string;
  Date: string | moment.Moment;
  Paid: boolean;
  PaidDate?: string | moment.Moment;
  Number: string;
  Total: number;
  PdfUrl: string;
}
