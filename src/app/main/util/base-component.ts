import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({template: ''})
export abstract class BaseComponent implements OnDestroy {
  subs: Subscription = new Subscription();

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }
}
