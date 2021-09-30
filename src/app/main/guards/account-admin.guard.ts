import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class AccountAdminGuard implements CanActivate {

    constructor(private router: Router, private authenticationService: AuthenticationService) { }

    canActivate() {
        if (this.authenticationService.currentUser && this.authenticationService.currentUser.IsAccountAdmin) {
            return true;
        }

        this.router.navigate(['/login']);
        return false;
    }
}
