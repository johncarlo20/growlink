import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable()
export class AppSettingsService {
  constructor(private http: HttpClient) { }

  load() {
    return new Promise(resolve => {
      this.http
        .get('/assets/appSettings.php', { observe: 'response', responseType: 'text' })
        .pipe(
          map(res => {
            // if we have a php tag then we are in the local where it's not served
            if (res.body.indexOf('<?php') > -1 || res.body.indexOf('<html>') > -1) {
              return;
            } else {
              let body: { [x: string]: string; };
              // check if empty, before calling json on the result
              if (res.body) {
                body = JSON.parse(res.body);
                environment.api = body['GrowlinkApiHostname'] ? `https://${body['GrowlinkApiHostname']}/` : environment.api;
                environment.stripeApiKey = body['StripeApiKey'] ? body['StripeApiKey'] : environment.stripeApiKey;
                environment.signalR = body['GrowlinkUseSignalR'] ? body['GrowlinkUseSignalR'] === 'true' : environment.signalR;
              }

              return body || {};
            }
          })
        )
        .subscribe(() => {
          resolve(null);
        });
    });
  }
}
