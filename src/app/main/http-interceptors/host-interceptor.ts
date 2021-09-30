import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable()
export class HostInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (request.url.indexOf('appSettings.php') !== -1) {
      return next.handle(request);
    }
    if (environment.api && request.url.indexOf(environment.api) === -1) {
      request = request.clone({ url: environment.api + request.url });
    }

    return next.handle(request);
  }
}
