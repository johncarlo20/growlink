import { BaseComponent } from './base-component';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ProgressBarService } from '@services';
import { OnInit, Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';

@Component({template: ''})
export abstract class BaseAPIComponent extends BaseComponent implements OnInit {
  private _loading = true;

  snackOptions: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
  };
  errorOptions: MatSnackBarConfig = {
    duration: 10000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
    panelClass: 'snack-panel-error',
  };

  constructor(
    protected snackbar: MatSnackBar,
    protected progressBarService: ProgressBarService
  ) {
    super();
  }

  ngOnInit() {
    this.subs.add(this.progressBarService.Loading.subscribe(l => (this._loading = l)));
  }

  public get loading(): boolean {
    return this._loading;
  }

  protected showMessage(message: string) {
    this.snackbar.open(message, 'Dismiss', this.snackOptions);
  }
  protected showError(message: string) {
    this.snackbar.open(message, 'Dismiss', this.errorOptions);
  }

  protected handleError(err: string[] | HttpErrorResponse): void {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 404) {
        this.showError(`Controller is offline`);
        return;
      }

      const message = err.error.Message;

      if (err.status === 400) {
        if (err.error && err.error.ModelState) {
          for (const key in err.error.ModelState) {
            if (err.error.ModelState.hasOwnProperty(key)) {
              const errors = err.error.ModelState[key] as string[];
              this.showModelError(message, key, errors);
            }
          }
        } else {
          this.showError(`There is an error with the request`);
        }

        return;
      }

      this.showError(`API Error - ${message}`);
      return;
    } else {
      this.showError(`ERROR: ${err.join()}`);
    }
  }

  protected showServerErrors(control: AbstractControl, errors: string[] ) {
    const currentErrors = (control.getError('server')) as string[] || new Array<string>();
    errors.forEach(error => {
      if (currentErrors.find(err => err === error)) { return; }

      currentErrors.push(error);
    });
    control.setErrors({'server': currentErrors}, {emitEvent: true});
    control.markAsDirty();
    control.markAsTouched();
  }

  protected showModelError(message: string, key: string, errors: string[]) {
    console.error(`Model Errors`, message, key, errors);

    const defaultMessage = `${message}: ${errors.join(', ')} (${key})`;
    this.showError(defaultMessage);
  }
}
