/* "Barrel" of Http Interceptors */
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { HostInterceptor } from './host-interceptor';
import { AuthInterceptor } from './auth-interceptor';
import { UnitOfMeasureInterceptor } from './unit-of-measure-interceptor';
import { UnauthorizedInterceptor } from './unauthorized-interceptor';

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: UnauthorizedInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: HostInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: UnitOfMeasureInterceptor, multi: true }
];
