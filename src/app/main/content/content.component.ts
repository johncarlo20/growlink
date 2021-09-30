import { Component, HostBinding, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'fuse-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations
})
export class FuseContentComponent implements OnInit, OnDestroy {
  onSettingsChanged: Subscription;
  fuseSettings: any;

  @HostBinding('@routerTransitionUp') routeAnimationUp = false;
  @HostBinding('@routerTransitionDown') routeAnimationDown = false;
  @HostBinding('@routerTransitionRight') routeAnimationRight = false;
  @HostBinding('@routerTransitionLeft') routeAnimationLeft = false;
  @HostBinding('@routerTransitionFade') routeAnimationFade = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fuseConfig: FuseConfigService
  ) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute)
      ).subscribe((event) => {
        switch (this.fuseSettings.routerAnimation) {
          case 'fadeIn':
            this.routeAnimationFade = !this.routeAnimationFade;
            break;
          case 'slideUp':
            this.routeAnimationUp = !this.routeAnimationUp;
            break;
          case 'slideDown':
            this.routeAnimationDown = !this.routeAnimationDown;
            break;
          case 'slideRight':
            this.routeAnimationRight = !this.routeAnimationRight;
            break;
          case 'slideLeft':
            this.routeAnimationLeft = !this.routeAnimationLeft;
            break;
        }
      });

    this.onSettingsChanged =
      this.fuseConfig.config
        .subscribe(
          (newSettings) => {
            this.fuseSettings = newSettings;
          }
        );
  }

  ngOnInit() { }

  ngOnDestroy() {
    this.onSettingsChanged.unsubscribe();
  }
}
