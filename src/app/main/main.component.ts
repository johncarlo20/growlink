import { Component, ElementRef, HostBinding, Inject, OnDestroy, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { GrowMediumService, ProductTypesService, SoilECTypeService } from './services';

@Component({
  selector: 'fuse-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FuseMainComponent implements OnInit, OnDestroy {
  onSettingsChanged: Subscription;
  fuseSettings: FuseConfig;
  // @HostBinding('attr.fuse-layout-mode') layoutMode;

  constructor(
    private _renderer: Renderer2,
    private _elementRef: ElementRef,
    private fuseConfig: FuseConfigService,
    private productTypesService: ProductTypesService,
    private growMediumService: GrowMediumService,
    private soilECTypeService: SoilECTypeService,
    private platform: Platform,
    @Inject(DOCUMENT) private document: any
  ) {
    if (this.platform.ANDROID || this.platform.IOS) {
      this.document.body.className += ' is-mobile';
    }
  }

  ngOnInit() {
    this.onSettingsChanged =
      this.fuseConfig.config
        .subscribe(
          (newSettings) => {
            this.fuseSettings = newSettings;
            // this.layoutMode = this.fuseSettings.layout.mode;
          }
        );
    // this.fuseConfig.setConfig({
    //   layout: { navigation: 'top', toolbar: 'none', footer: 'none' },
    // });
  }

  ngOnDestroy() {
    this.onSettingsChanged.unsubscribe();
  }

  addClass(className: string) {
    this._renderer.addClass(this._elementRef.nativeElement, className);
  }

  removeClass(className: string) {
    this._renderer.removeClass(this._elementRef.nativeElement, className);
  }
}
