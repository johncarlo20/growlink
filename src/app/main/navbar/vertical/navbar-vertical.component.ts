import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MediaObserver } from '@angular/flex-layout';
import { Subject } from 'rxjs';
import { delay, takeUntil, filter } from 'rxjs/operators';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

@Component({
  selector: 'fuse-navbar-vertical',
  templateUrl: './navbar-vertical.component.html',
  styleUrls: ['./navbar-vertical.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FuseNavbarVerticalComponent implements OnInit, OnDestroy {
  private _unsubscribeAll = new Subject<any>();

  @ViewChild(FusePerfectScrollbarDirective, { static: true }) fusePerfectScrollbarDirective: { update: () => void; };

  constructor(
    private fuseNavigationService: FuseNavigationService,
    private fuseSidebarService: FuseSidebarService,
    private router: Router,
    public media: MediaObserver
  ) {
    // Update the scrollbar on collapsible item toggle
    this.fuseNavigationService.onItemCollapseToggled.pipe(
      delay(500),
      takeUntil(this._unsubscribeAll)
    ).subscribe(() => {
      this.fusePerfectScrollbarDirective.update();
    });
  }

  ngOnInit() {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntil(this._unsubscribeAll)
    ).subscribe(() => {
      if (this.media.isActive('lt-lg')) {
        setTimeout(() => {
          this.closeSidebar();
        });
      }
    });
  }

  ngOnDestroy() {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  toggleSidebar() {
    this.fuseSidebarService.getSidebar('navbar').toggleFold();
  }

  closeSidebar() {
    this.fuseSidebarService.getSidebar('navbar').close();
  }

  goHome() {
    this.router.navigate(['home']);
  }
}
