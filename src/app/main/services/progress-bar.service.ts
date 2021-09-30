import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

export interface Breadcrumb {
  icon: string;
  caption: string;
  url?: string[];
  warning?: string;
  warningIcon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressBarService {
  private loading = new BehaviorSubject<boolean>(false);
  private loaders = 0;
  private currentPage = new BehaviorSubject<Breadcrumb[]>([]);

  constructor(private fuseProgressBarService: FuseProgressBarService) {}

  public get Loading() {
    return this.loading.asObservable();
  }

  public get CurrentPage() {
    return this.currentPage.asObservable();
  }

  public SetLoading(isLoading: boolean) {
    if (!isLoading) {
      // console.debug('SetLoading', 'decrement', this.loaders);
      this.loaders = Math.max(this.loaders - 1, 0);
      if (this.loaders > 0) {
        return;
      }
    }

    if (isLoading) {
      // console.debug('SetLoading', 'increment', this.loaders);
      this.loaders++;
      if (this.loaders > 1) {
        return;
      }
    }

    setTimeout(() => {
      // console.debug('SetLoading', 'loading', isLoading);
      this.loading.next(isLoading);
      if (isLoading) {
        this.fuseProgressBarService.setMode('indeterminate');
        this.fuseProgressBarService.show();
      } else {
        this.fuseProgressBarService.hide();
      }
    });
  }

  public SetCurrentPage(pages: Breadcrumb[]) {
    setTimeout(() => this.currentPage.next(pages));
  }
}
