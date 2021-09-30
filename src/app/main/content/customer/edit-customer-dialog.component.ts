import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  CustomerRegistration,
  Customer,
  OrganizationResponse,
  ControllerResponse,
  SelectItem,
} from '@models';
import { AuthenticationService, CustomerService, ProgressBarService } from '@services';
import { DeleteConfirmDialogComponent } from './delete-confirm/delete-confirm-dialog.component';
import { BaseAPIComponent } from '@util';

@Component({
  selector: 'fuse-edit-customer-dialog',
  templateUrl: './edit-customer-dialog.component.html',
  styles: [],
})
export class EditCustomerDialogComponent extends BaseAPIComponent implements OnInit {
  editCustomerForm: FormGroup;
  roles: SelectItem[] = [];
  customer: Customer | CustomerRegistration;
  orgs: OrganizationResponse[] = [];
  ownedControllers: ControllerResponse[] = [];

  private isOrgAdmin = false;
  private isDomainAdmin = false;
  private isAccountAdmin = false;
  private orgId: string;
  private customerId: string;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      id?: string;
      customer: Customer | CustomerRegistration;
      orgs: OrganizationResponse[];
      ownedControllers: ControllerResponse[];
    },
    public dialogRef: MatDialogRef<EditCustomerDialogComponent>,
    public dialog: MatDialog,
    private customerService: CustomerService,
    private authenticationService: AuthenticationService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);

    this.customerId = data.id;
    this.customer = data.customer;
    this.orgs = data.orgs;
    this.ownedControllers = data.ownedControllers;
  }

  ngOnInit() {
    super.ngOnInit();

    this.editCustomerForm = new FormGroup({
      first: new FormControl(this.customer.FirstName, [Validators.required]),
      last: new FormControl(this.customer.LastName, [Validators.required]),
      company: new FormControl(this.customer.Company),
      offlineNotifications: new FormControl(this.customer.ReceiveOfflineNotifications, [
        Validators.required,
      ]),
      accountAdmin: new FormControl(this.customer.IsAccountAdmin, [
        Validators.required,
      ]),
      role:
        this.customer instanceof Customer
          ? new FormControl(this.GetRole(), [Validators.required])
          : new FormControl(null, [Validators.required]),
      organization: new FormControl(this.customer.OrganizationId),
      email:
        this.customer instanceof CustomerRegistration
          ? new FormControl(this.customer.EmailAddress, [Validators.required, Validators.email])
          : new FormControl(),
      password:
        this.customer instanceof CustomerRegistration
          ? new FormControl(this.customer.Password, [Validators.required, Validators.minLength(8)])
          : new FormControl(),
    });

    this.subs.add(
      this.authenticationService.User.subscribe(user => {
        this.isDomainAdmin = user.IsDomainAdmin;
        this.isOrgAdmin = user.IsOrganizationAdmin;
        this.isAccountAdmin = user.IsAccountAdmin;
        this.orgId = user.OrganizationId;
        this.roles = [];
        if (this.isDomainAdmin || this.isAccountAdmin) {
          this.roles.push({ value: 1, caption: 'Domain Admin' });
        }
        if (this.isOrgAdmin || this.isAccountAdmin) {
          this.roles.push({ value: 2, caption: 'Organization Admin' });
          this.roles.push({ value: 3, caption: 'Read Only Admin' });
        }
        this.roles.push({ value: 4, caption: 'Owned Controllers Only' });
      })
    );
    this.subs.add(
      this.authenticationService.OrganizationIdChanged.subscribe(orgId => {
        this.orgId = orgId;
      })
    );

    this.subs.add(
      this.editCustomerForm.valueChanges.subscribe(() => {
        this.customer.FirstName = this.first.value;
        this.customer.LastName = this.last.value;
        this.customer.Company = this.company.value;
        this.customer.OrganizationId = this.organization.value;
        this.customer.ReceiveOfflineNotifications = this.offlineNotifications.value;
        this.customer.IsAccountAdmin = this.role.value < 3 && this.accountAdmin.value;
        this.customer.IsDomainAdmin = this.role.value === 1;
        this.customer.IsOrganizationAdmin = this.role.value < 4;
        this.customer.IsReadOnlyAdmin = this.role.value === 3;
        if (this.customer instanceof CustomerRegistration) {
          this.customer.EmailAddress = this.email.value;
          this.customer.Password = this.password.value;
        }
      })
    );

    if (this.isRegistration) {
      this.offlineNotifications.setValue(false);
    }
  }

  get isRegistration(): boolean {
    return this.customer instanceof CustomerRegistration;
  }
  get isCurrentUser(): boolean {
    return (
      !this.isRegistration &&
      this.customer.EmailAddress === this.authenticationService.currentUser.EmailAddress
    );
  }
  get first() {
    return this.editCustomerForm.get('first') as FormControl;
  }
  get last() {
    return this.editCustomerForm.get('last') as FormControl;
  }
  get company() {
    return this.editCustomerForm.get('company') as FormControl;
  }
  get email() {
    return this.editCustomerForm.get('email') as FormControl;
  }
  get password() {
    return this.editCustomerForm.get('password') as FormControl;
  }
  get offlineNotifications() {
    return this.editCustomerForm.get('offlineNotifications') as FormControl;
  }
  get accountAdmin() {
    return this.editCustomerForm.get('accountAdmin') as FormControl;
  }
  get role() {
    return this.editCustomerForm.get('role') as FormControl;
  }
  get organization() {
    return this.editCustomerForm.get('organization') as FormControl;
  }

  public update() {
    if (this.customer instanceof CustomerRegistration) {
      this.createUser(this.customer);
    } else {
      this.updateUser(this.customer);
    }
  }

  private createUser(customer: CustomerRegistration) {
    if (!this.isDomainAdmin) {
      this.customer.OrganizationId = this.orgId;
    }
    this.customerService.createCustomer(customer).subscribe(
      () => {
        this.showMessage(`Added new User`);
        this.dialogRef.close(true);
      },
      error => this.handleError(error)
    );
  }

  private updateUser(customer: Customer) {
    this.customerService.updateCustomer(customer, this.customerId).subscribe(
      () => {
        this.showMessage(`Saved changes to User`);
        this.dialogRef.close(true);
      },
      error => this.handleError(error)
    );
  }

  private deleteUser(customer: Customer) {
    this.customerService.deleteCustomer(this.customerId).subscribe(
      () => {
        this.showMessage(`Deleted User`);
        this.dialogRef.close(true);
      },
      error => this.handleError(error)
    );
  }

  public delete() {
    let confirmation = true;
    if (this.ownedControllers.length > 0) {
      const config: MatDialogConfig = {
        data: { ownedControllers: this.ownedControllers, customer: this.customer },
      };
      const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, config);

      return dialogRef.afterClosed().subscribe((result: boolean) => {
        confirmation = result;
      });
    }
    if (confirmation) {
      this.deleteUser(this.customer);
    }
  }

  public GetRole(): number {
    if (this.customer instanceof Customer) {
      if (this.customer.IsDomainAdmin && this.customer.IsOrganizationAdmin) {
        return 1;
      }
      if (this.customer.IsReadOnlyAdmin && this.customer.IsOrganizationAdmin) {
        return 3;
      }
      if (this.customer.IsOrganizationAdmin) {
        return 2;
      }
    }

    return 4;
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  protected showModelError(message: string, key: string, errors: string[]) {
    switch (key) {
      case 'EmailAddress':
        const currentErrors = (this.email.getError('server') as string[]) || new Array<string>();
        errors.forEach(error => {
          if (error.match(/Name .* is already taken./i)) {
            currentErrors.push('Email Address is already in use. Please contact Growlink support to have it assigned to this organization.');
          } else {
            currentErrors.push(error);
          }
          this.email.setErrors({ server: currentErrors });
        });
        break;
      case 'Password':
        this.showServerErrors(this.password, errors);
        break;
      case 'FirstName':
        this.showServerErrors(this.first, errors);
        break;
      case 'LastName':
        this.showServerErrors(this.last, errors);
        break;
      case 'Company':
        this.showServerErrors(this.company, errors);
        break;
      case 'IsDomainAdmin':
      case 'IsOrganizationAdmin':
      case 'IsReadOnlyAdmin':
      case 'IsAccountAdmin':
        this.showServerErrors(this.role, errors);
        break;
      default:
        super.showModelError(message, key, errors);
        break;
    }
  }
}
