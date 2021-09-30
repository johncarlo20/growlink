import * as moment from 'moment';
import { IStringDictionary } from './string-dictionary';

export class OrganizationSubscription {
  Id: string;
  OrganizationId: string;
  BillingPeriodType: string;
  EffectiveTimestamp: string | moment.Moment;
  PricePerController: number;
  PricePerModule: number;
  PricePerSite: number;
  PricePerUser: number;
}

export class OrganizationSubscriptionResponse {
  NextBillingDate: string | moment.Moment;
  NextBillingAmount: number;
  NumControllers: number;
  NumModules: number;
  NumUsers: number;
  NumBacnetSensors: number;
  NumEsm1Modules: number;
  NumIrrigationProbes: number;
  Subscriptions: OrganizationSubscription[];
  PaymentType: string;
  CardType: string;
  CardLast4: string;
  CardExpiry: string;
  CardActionRequired: boolean;
  IsLockedOut: boolean;
  PriceDetails: IStringDictionary;
}
