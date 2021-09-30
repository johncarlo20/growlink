import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';
import { AuthenticationService, CustomerService, OrganizationService, ProgressBarService } from '@services';
import { BooleanResult, CustomerResponse } from '@models';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
type Screens = 'LOGIN' | 'REQUEST_PIN' | 'RESET_PASSWORD';

@Component({
  selector: 'fuse-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: fuseAnimations,
})
export class LoginComponent implements OnInit, OnDestroy {
  subs = new Subscription();
  loginForm: FormGroup;
  showLoadingBar: boolean;
  showScreen: Screens = 'LOGIN';
  error = '';

  constructor(
    private fuseConfig: FuseConfigService,
    private formBuilder: FormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService,
    private orgService: OrganizationService,
    private customerService: CustomerService,
    private progressBar: ProgressBarService,
    private $gaService: GoogleAnalyticsService
  ) {
    this.authenticationService.logout();
    this.orgService.clearOrganizationActiveSubscription();

    this.fuseConfig.setConfig({
      layout: {
        navbar: {
          hidden: true
        },
        toolbar: {
          hidden: true
        },
        footer: {
          hidden: true
        },
        sidepanel: {
          hidden: true
        }
      }
    });
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: [
        { value: '', disabled: this.showLoadingBar || this.resetScreen },
        [Validators.required, Validators.email],
      ],
      pin: [{ value: '', disabled: this.showLoadingBar }],
      password: [{ value: '', disabled: this.showLoadingBar }, Validators.required],
    });

    this.progressBar.SetLoading(false);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get email() {
    return this.loginForm.get('email');
  }
  get pin() {
    return this.loginForm.get('pin');
  }
  get password() {
    return this.loginForm.get('password');
  }

  get loginScreen() {
    return this.showScreen === 'LOGIN';
  }
  get requestScreen() {
    return this.showScreen === 'REQUEST_PIN';
  }
  get resetScreen() {
    return this.showScreen === 'RESET_PASSWORD';
  }

  login() {
    this.showLoadingBar = true;
    const username = this.email.value;
    this.$gaService.event('login', 'login');
    this.authenticationService
      .login(username, this.password.value)
      .subscribe(r => this.handleSuccess(username, r), error => this.handleError(error));
  }

  showRequestScreen(e) {
    e.preventDefault();
    this.showScreen = 'REQUEST_PIN';
    this.error = null;
    this.email.enable();
    this.pin.clearValidators();
    this.pin.disable();
    this.loginForm.markAsPristine();
    this.loginForm.markAsUntouched();
    this.$gaService.event('login', 'forgot_password');
  }
  showLoginScreen() {
    this.showScreen = 'LOGIN';
    this.error = null;
    this.email.enable();
    this.pin.clearValidators();
    this.pin.disable();
    this.loginForm.markAsPristine();
    this.loginForm.markAsUntouched();
  }
  showResetScreen() {
    this.showScreen = 'RESET_PASSWORD';
    this.error = null;
    this.email.disable();
    this.pin.enable();
    this.pin.setValidators([
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
    ]);
    this.pin.setValue('');
    this.pin.markAsPristine();
    this.pin.markAsUntouched();
    this.password.setValue('');
    this.password.markAsPristine();
    this.password.markAsUntouched();
    this.loginForm.markAsPristine();
    this.loginForm.markAsUntouched();
  }

  requestPasswordReset() {
    this.showLoadingBar = true;
    const username = this.email.value;
    this.authenticationService.requestPasswordReset(username).subscribe(
      r => {
        this.showLoadingBar = false;
        this.showResetScreen();
      },
      error => this.handleError(error)
    );
  }

  resetPassword() {
    this.showLoadingBar = true;
    const username = this.email.value;
    const newPassword = this.password.value;
    const resetPIN = this.pin.value;
    this.authenticationService.resetPassword(username, resetPIN, newPassword).subscribe(
      r => {
        if (r === true) {
          this.login();
        }
      },
      error => this.handleError(error)
    );
  }

  private handleSuccess(username: string, result: BooleanResult): void {
    if (result.success === true) {
      this.customerService
        .getMyCustomer()
        .subscribe(
          userResponse => {
            this.handleSuccessfulLogin(userResponse);
          },
          error => this.handleNonAdmin(username, error)
        );
    } else {
      this.handleError(result);
    }
  }

  private handleSuccessfulLogin(user: CustomerResponse): void {
    this.authenticationService.handleSuccessfulLogin(user);
    this.router.navigate(['/']);
  }

  private handleNonAdmin(username: string, error: string[]): void {
    this.authenticationService.handleNonAdmin(username, error);
    this.router.navigate(['/']);
  }

  private handleError(error: HttpErrorResponse | BooleanResult) {
    if (error instanceof BooleanResult) {
      this.error = error.message;
    } else if (
      error instanceof HttpErrorResponse &&
      error.status === 400 &&
      error.error.ModelState
    ) {
      for (const key in error.error.ModelState) {
        if (error.error.ModelState.hasOwnProperty(key)) {
          const errors = error.error.ModelState[key] as string[];
          switch (key) {
            case 'Token':
              this.pin.setErrors({ server: errors });
              break;
            case 'Password':
            case 'NewPassword':
              this.password.setErrors({ server: errors });
              break;
            default:
              this.email.setErrors({ server: errors });
              break;
          }
        }
      }
    } else if (error instanceof HttpErrorResponse && error.error instanceof ErrorEvent) {
      this.error = error.error.message;
    } else {
      this.error = error.error.error_description
        ? error.error.error_description
        : 'an error occurred';
    }
    this.showLoadingBar = false;
  }
}
