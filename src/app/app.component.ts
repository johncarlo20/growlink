import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { FuseSplashScreenService } from '@fuse/services/splash-screen.service';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseNavigationModel } from './navigation/navigation.model';
import { ControllerService, AuthenticationService, ProgressBarService, SignalRService, OrganizationService } from '@services';
import { BaseAPIComponent } from './main/util/base-api-component';
import { NoSubscriptionDialogComponent } from './main/dialogs/no-subscription-dialog.component';

import * as moment from 'moment';
import 'moment/min/locales';

@Component({
  selector: 'fuse-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends BaseAPIComponent implements OnInit {
  ngOnInit(): void {
    super.ngOnInit();

    this.authenticationService.updatedToken.subscribe(() => {
      this.authenticationService.updateLoggedInUser();
    });

    this.setIdleTimeout(60000, () => this.signalR.SetIdle(true), () => this.signalR.SetIdle(false));
  }

  constructor(
    private fuseNavigationService: FuseNavigationService,
    private controllerService: ControllerService,
    private organizationService: OrganizationService,
    private router: Router,
    private authenticationService: AuthenticationService,
    private signalR: SignalRService,
    snackbar: MatSnackBar,
    progressBarService: ProgressBarService,
    public fuseSplash: FuseSplashScreenService,
    public dialog: MatDialog
  ) {
    super(snackbar, progressBarService);

    // Set the navigation model
    this.fuseNavigationService.register('main', [{
      id: 'orgName',
      title: 'Organization',
      type: 'group'}]);
    this.fuseNavigationService.setCurrentNavigation('main');

    const model = new FuseNavigationModel(this.controllerService, this.fuseNavigationService,
      this.authenticationService, this.organizationService);
    this.fuseNavigationService.updateNavigationItem('orgName', model.model[0]);

    // Set the moment locale
    if (window.navigator && window.navigator.languages) {
      moment.locale(window.navigator.languages as string[]);
    }

    this.authenticationService.updatedToken.subscribe(token => {
      if (!token) {
        return;
      }

      this.controllerService.loadControllers().subscribe(controllers => {
        const any = controllers.length > 0;

        if (!any) {
          const dialogRef = this.dialog.open(NoSubscriptionDialogComponent, { panelClass: 'edit-module-panel' });

          dialogRef.afterClosed().subscribe(() => {
            window.setTimeout(() => {
              this.authenticationService.logout();
              this.router.navigate(['login']);
            }, 50);
          });
        }
      }, error => this.handleError(error));

      this.signalR.reconnect();
    });
  }

  setIdleTimeout(idleMs: number, onIdle: () => void, onUnidle: () => void) {
    let timeout = 0;
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    startTimer();

    function startTimer() {
        timeout = window.setTimeout(onExpires, idleMs);
        events.forEach(name => document.addEventListener(name, onActivity, true));
    }

    function onExpires() {
        timeout = 0;
        onIdle();
    }

    function onActivity() {
        if (timeout) { clearTimeout(timeout); }
        else { onUnidle(); }

        events.forEach(name => document.removeEventListener(name, onActivity, true));
        setTimeout(startTimer, 1000);
    }
  }
}
