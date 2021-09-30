import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthenticationService, CountriesService, OrganizationService } from '@services';
import { BaseComponent } from '@util';
import { CustomerResponse, SelectItem, StripeCustomerRegistration } from '@models';
import { environment } from '../../../../../environments/environment';
const UsaStates = require('usa-states').UsaStates;

declare var Stripe: stripe.StripeStatic;

@Component({
  selector: 'fuse-payment-method-dialog',
  templateUrl: './payment-method-dialog.component.html',
  styleUrls: ['./payment-method-dialog.component.scss']
})
export class PaymentMethodDialogComponent extends BaseComponent implements OnInit {

  currentUser: CustomerResponse;
  private stripe: stripe.Stripe;
  private card: stripe.elements.Element;
  cardValid = false;
  subscriptionForm: FormGroup;
  busy = false;
  countries: SelectItem[] = [];
  states: SelectItem[] = [];

  @ViewChild('cardElement') cardElement: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {},
    public dialogRef: MatDialogRef<PaymentMethodDialogComponent>,
    private organizationService: OrganizationService,
    private countriesService: CountriesService,
    private authenticationService: AuthenticationService) {
    super();
  }

  ngOnInit() {
    this.stripe = Stripe(environment.stripeApiKey);

    this.subscriptionForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', [Validators.required]),
      cardholderName: new FormControl('', [Validators.required]),
      addressLine1: new FormControl('', [Validators.required]),
      addressLine2: new FormControl(''),
      city: new FormControl('', [Validators.required]),
      state: new FormControl('', [Validators.required]),
      country: new FormControl('', [Validators.required]),
      postalCode: new FormControl('', [Validators.required]),
    });

    this.subs.add(
      this.authenticationService.User.subscribe(user => {
        this.currentUser = user;
        setTimeout(() => this.createCardElement(), 500);
        if (this.name) {
          this.name.setValue(user.Company);
        }
        if (this.email) {
          this.email.setValue(user.EmailAddress);
        }
        if (this.cardholderName) {
          this.cardholderName.setValue(`${user.FirstName} ${user.LastName}`);
        }
      })
    );

    this.subs.add(
      this.countriesService.Countries.subscribe(c => {
        this.countries = this.countriesService.forSelectList();
        this.country.setValue('US');
      })
    );

    this.subs.add(
      this.postalCode.valueChanges.subscribe(newPostal => {
        if (this.card) {
          this.card.update({value: {postalCode: newPostal}});
        }
      })
    );

    const usStates = new UsaStates({includeTerritories: true});
    this.states = usStates.states.map(st => ({ value: st.name, caption: st.name }));
    console.log(this.states);
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  get name() {
    return this.subscriptionForm.get('name');
  }
  get email() {
    return this.subscriptionForm.get('email');
  }
  get phone() {
    return this.subscriptionForm.get('phone');
  }
  get cardholderName() {
    return this.subscriptionForm.get('cardholderName');
  }
  get addressLine1() {
    return this.subscriptionForm.get('addressLine1');
  }
  get addressLine2() {
    return this.subscriptionForm.get('addressLine2');
  }
  get country() {
    return this.subscriptionForm.get('country');
  }
  get state() {
    return this.subscriptionForm.get('state');
  }
  get city() {
    return this.subscriptionForm.get('city');
  }
  get postalCode() {
    return this.subscriptionForm.get('postalCode');
  }
  get isUnitedStates() {
    return this.country.value === 'US';
  }

  get IsStripeCustomer(): boolean {
    if (!this.currentUser) { return false; }

    return this.currentUser.StripeCustomerId && this.currentUser.StripeCustomerId.length > 0;
  }

  get IsStripeSubscriber(): boolean {
    if (!this.currentUser) { return false; }

    return this.currentUser.StripeSubscriptionId && this.currentUser.StripeSubscriptionId.length > 0;
  }

  createCustomerSubscription() {
    this.busy = true;
    this.displayError(null);

    // if (this.IsStripeCustomer) {
    //   this.createCustomerPaymentMethod();
    //   return;
    // }

    const customer: StripeCustomerRegistration = {
      OrganizationId: this.currentUser.OrganizationId,
      Name: this.name.value,
      Email: this.email.value,
      Phone: this.phone.value,
      Contact: this.cardholderName.value,
      Address: {
        Line1: this.addressLine1.value,
        Line2: this.addressLine2.value,
        City: this.city.value,
        State: this.state.value,
        Country: this.country.value,
        PostalCode: this.postalCode.value,
      }
    };

    this.organizationService.createOrganizationStripeCustomer(customer).subscribe(
      stripeCustomerId => {
        this.currentUser.StripeCustomerId = stripeCustomerId;
        this.createCustomerPaymentMethod();
      },
      error => { this.displayError(error); this.busy = false; }
    );
  }
  private createCustomerPaymentMethod() {
    this.organizationService.getBillingDetails(this.currentUser.OrganizationId).subscribe(
      billingDetails => {
        billingDetails.name = this.cardholderName.value;
        console.log('billing details', billingDetails);
        this.stripe.createPaymentMethod('card', this.card, {
          billing_details: billingDetails
        })
        .then((result) => {
          console.log('payment method result', result);
          if (result.error) {
            this.displayError(result.error);
            this.busy = false;
          } else if (result.paymentMethod) {
            this.createPaymentSubscription(result.paymentMethod.id);
          }
        })
        .catch((error) => { this.displayError(error); this.busy = false; });
      },
      error => { this.displayError(error); this.busy = false; }
    );
  }

  private createPaymentSubscription(paymentId: string) {
    const obs = this.IsStripeSubscriber ?
      this.organizationService.updateOrganizationStripeSubscription(this.currentUser.OrganizationId, paymentId) :
      this.organizationService.createOrganizationStripeSubscription(this.currentUser.OrganizationId, paymentId);

    obs.subscribe(
      stripeSubscription => {
        console.log('subscription', stripeSubscription);
        this.currentUser.StripeSubscriptionId = stripeSubscription.id;

        if (!stripeSubscription.latest_invoice || !stripeSubscription.latest_invoice.payment_intent) {
          this.dialogRef.close(true);
          return;
        }

        const paymentIntent = stripeSubscription.latest_invoice.payment_intent;
        if (paymentIntent.status === 'requires_action') {
          this.stripe.confirmCardPayment(paymentIntent.client_secret, {payment_method: paymentId}).then((result) => {
            if (result.error) {
              this.displayError(result.error);
              this.busy = false;
            } else {
              this.dialogRef.close(true);
            }
          });
        } else if (paymentIntent.status === 'requires_payment_method') {
          this.displayError({message: 'Your card was declined.', type: 'card_error', charge: null});
          this.busy = false;
        } else if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
          this.dialogRef.close(true);
        }
      },
      error => {
        if (error instanceof HttpErrorResponse && error.status === 400 && error.error.ModelState) {
          const displayError = $('#card-element-errors');
          for (const key in error.error.ModelState) {
            if (error.error.ModelState.hasOwnProperty(key)) {
              const errors = error.error.ModelState[key] as string[];
              switch (key) {
                case 'address_zip':
                  this.postalCode.setErrors({ server: errors });
                  displayError.text(errors.length ? errors[0] : 'Card failed');
                  break;
                default:
                  displayError.text(errors.length ? errors[0] : 'Card failed');
                  break;
              }
            }
          }

          this.busy = false;
          return;
        }

        this.displayError(error);
        this.busy = false;
      }
    );
  }

  private createCardElement(): void {
    setTimeout(() => {
      const elements = this.stripe.elements();

      this.card = elements.create('card', {hidePostalCode: true});
      this.card.mount(this.cardElement.nativeElement);

      this.card.on('change', (event) => this.displayCardError(event));
    });
  }

  displayCardError(event: stripe.elements.ElementChangeResponse): void {
    const displayError = $('#card-element-errors');
    if (event.error) {
      displayError.text(event.error.message);
      this.cardValid = false;
    } else {
      displayError.text('');
      this.cardValid = true;
    }
  }

  displayError(error: stripe.Error) {
    const displayError = $('#errors');
    displayError.text(error ? error.message : '');
  }
}
