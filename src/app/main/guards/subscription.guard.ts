import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { OrganizationService } from '../services/organization.service';


@Injectable()
export class SubscriptionGuard implements CanActivate {

    constructor(private orgService: OrganizationService) { }

    canActivate() {
        if (this.orgService.validSubscription) {
            return true;
        }

        return false;
    }
}
