import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { Observable, interval, Subscription } from 'rxjs';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import {
  AuthenticationService,
  ProgressBarService,
  OrganizationService,
  Breadcrumb,
  NotificationsService,
  SignalRService,
  ControllerService,
} from '@services';
import { OrganizationResponse } from '@models';
import { EulaDialogComponent } from '../dialogs/eula-dialog.component';
import { SubscriptionExpiredDialogComponent } from '../dialogs/subscription-expired-dialog.component';
import * as moment from 'moment';

@Component({
  selector: 'fuse-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class FuseToolbarComponent implements OnInit, OnDestroy {
  username: string;
  isAdmin: boolean;
  isSubscriptionCustomer: boolean;
  isAccountAdmin: boolean;
  isDomainAdmin: boolean;
  hasProSupport: boolean;
  horizontalNav: boolean;
  selectedOrg: string;
  orgs: OrganizationResponse[] = [];
  subscriptions = new Subscription();

  constructor(
    private router: Router,
    private fuseConfig: FuseConfigService,
    private fuseSidebars: FuseSidebarService,
    private authenticationService: AuthenticationService,
    private organizationService: OrganizationService,
    private notificationsService: NotificationsService,
    private signalR: SignalRService,
    private controllerService: ControllerService,
    private progressBarService: ProgressBarService,
    public dialog: MatDialog,
    public active: ActivatedRoute
  ) {}

  public get NavHeadings(): Observable<Breadcrumb[]> {
    return this.progressBarService.CurrentPage;
  }

  public get ValidSubscription(): boolean {
    return this.organizationService.validSubscription;
  }

  ngOnInit(): void {
    this.fuseConfig.config.subscribe((settings) => {
      this.horizontalNav = settings.layout.navigation === 'top';
    });

    this.subscriptions.add(
      this.authenticationService.User.subscribe((user) => {
        if (!user) {
          return;
        }

        this.username = user.EmailAddress;
        this.isAdmin = user.IsDomainAdmin || user.IsOrganizationAdmin || user.IsAccountAdmin;
        this.isDomainAdmin = user.IsDomainAdmin;
        this.isAccountAdmin = user.IsAccountAdmin;
        this.selectedOrg = user.OrganizationId;
        if (this.isDomainAdmin) {
          this.organizationService.getOrganizations().subscribe((o) => {
            this.orgs = o;
          });
        }

        this.refreshOrgSubscription();
      })
    );

    this.subscriptions.add(
      this.controllerService.AllControllers.subscribe((all) => {
        this.hasProSupport = all.some((controller) => controller.ShowProSupportNumber);
      })
    );

    this.subscriptions.add(
      this.signalR.Connected.subscribe((connected) => {
        if (connected) {
          this.getUnreadNotifications();
        }

        const banner = document.getElementById('server-banner');
        if (!connected && this.signalR.Active) {
          banner.style.display = 'block';
        } else {
          banner.style.display = 'none';
        }
      })
    );

    this.subscriptions.add(
      interval(10000).subscribe(() => this.getUnreadNotifications())
    );

    this.subscriptions.add(
      this.signalR.OrganizationSubscription.subscribe(organizationId => {
        if (this.selectedOrg !== organizationId) {
          return;
        }

        this.refreshOrgSubscription();
      })
    );

    this.subscriptions.add(
      this.organizationService.activeSubscription.subscribe(
        orgSub => {
          // console.log('org sub response', orgSub);
          this.isSubscriptionCustomer = orgSub && !!orgSub.NextBillingDate
            && orgSub.Subscriptions && orgSub.Subscriptions.length > 0;

          const banner = document.getElementById('subscription-banner');
          const bannerSpan = banner.children.item(0);
          if (this.isSubscriptionCustomer) {
            const nextBillingDate = moment(orgSub.NextBillingDate);
            if (!nextBillingDate.isValid() || nextBillingDate.year() < 2021) {
              banner.style.display = 'none';
              bannerSpan.innerHTML = '';
              return;
            }

            const isExpired = nextBillingDate.isBefore(moment().subtract(1, 'day'));
            const aboutToExpire = nextBillingDate.isBefore(moment().add(5, 'day'));
            const validCard = orgSub.CardLast4 && orgSub.CardLast4.length === 4;
            if (isExpired) {
              banner.style.display = 'block';
              banner.style.backgroundColor = '#ffcc00';
              bannerSpan.innerHTML = `Your Growlink Pro subscription is now expired. Portal access is disabled until payment is received.`;
            } else if (aboutToExpire && !validCard) {
              banner.style.display = 'block';
              banner.style.backgroundColor = '#99cc33';
              const expiryIn = nextBillingDate.diff(moment(), 'days');
              if (expiryIn > 1) {
                bannerSpan.innerHTML = `Your Growlink Pro subscription is going to expire in ${expiryIn} days.`;
              } else if (expiryIn === 1) {
                bannerSpan.innerHTML = `Your Growlink Pro subscription is going to expire tomorrow`;
              } else {
                bannerSpan.innerHTML = `Your Growlink Pro subscription is going to expire today.`;
              }
            }

            if (banner.style.display === 'block') {
              if (this.isAccountAdmin) {
                bannerSpan.innerHTML += `&nbsp;Please go to&nbsp;` +
                `<a href="/subscription">Manage Subscriptions</a>` +
                `&nbsp;to put a valid credit card on file.`;
              } else {
                bannerSpan.innerHTML += `&nbsp;Please contact your account administrator`;
              }

              if (!this.organizationService.expiryShown && isExpired) {
                this.organizationService.expiryShown = true;
                const dialogRef = this.dialog.open(SubscriptionExpiredDialogComponent, { data: this.isAccountAdmin });
                dialogRef.afterClosed().subscribe(() => {
                  if (orgSub.IsLockedOut) {
                    if (this.isAccountAdmin) {
                      this.router.navigate(['subscription']);
                    } else {
                      this.organizationService.clearOrganizationActiveSubscription();
                      this.authenticationService.logout();
                      this.router.navigateByUrl('/login');
                    }
                  }
                });
              }
            }
          } else {
            banner.style.display = 'none';
            bannerSpan.innerHTML = '';
          }
        },
        error => {
          console.error(error);
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get showLoadingBar(): Observable<boolean> {
    return this.progressBarService.Loading;
  }

  getUnreadNotifications() {
    this.notificationsService.getUnreadNotifications();
  }

  refreshOrgSubscription() {
    if (!this.selectedOrg) {
      return;
    }

    this.organizationService.getOrganizationActiveSubscription(this.selectedOrg).subscribe(() => {});
  }

  public get UnreadCount(): Observable<number> {
    return this.notificationsService.UnreadCount;
  }

  search(value) {
    // Do your search here...
    console.log(value);
  }

  changeOrg(event: MatSelectChange): void {
    this.authenticationService.updateSelectedOrg(event.value);
  }

  toggleSidebarOpen(key): void {
    //this.fuseSidebars.getSidebar(key).toggleFold();
    this.fuseSidebars.getSidebar(key).toggleOpen();
  }

  navigateTo(fragments: string[]) {
    this.router.navigate(fragments);
  }

  eulaModal() {
    this.dialog.open(EulaDialogComponent, { panelClass: 'edit-module-panel' });
  }
}
