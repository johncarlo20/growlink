import { UnitOfMeasure } from './unitofmeasure';

export type DashboardView = 'charts' | 'gauges';

export class UserPrefs {
  EmailAddress: string;
  temp: UnitOfMeasure;
  tds: UnitOfMeasure;
  lightLevel: UnitOfMeasure;
  vpd: UnitOfMeasure;

  dashboard: DashboardView;
  prefer24Hour: boolean;
}
