import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/table';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import {
  AuthenticationService,
  CustomerService,
  OrganizationService,
  ProgressBarService,
  ControllerService,
} from '@services';
import {
  CustomerResponse,
  Customer,
  CustomerRegistration,
  OrganizationResponse,
  ControllerResponse,
} from '@models';
import { EditCustomerDialogComponent } from './edit-customer-dialog.component';
import { BaseAPIComponent } from '@util';

@Component({
  selector: 'fuse-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss'],
})
export class CustomerComponent extends BaseAPIComponent implements OnInit {
  isReadOnly = true;
  isDomainAdmin = false;
  customers = new CustomersDataSource();
  orgs: OrganizationResponse[] = [];
  allControllers: ControllerResponse[] = [];

  displayedColumns = ['first', 'last', 'company', 'email', 'offlineNotifications', 'roles', 'manage_users'];

  private orgId: string;

  constructor(
    private authenticationService: AuthenticationService,
    private customerService: CustomerService,
    private organizationService: OrganizationService,
    private controllerService: ControllerService,
    public dialog: MatDialog,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);
    this.progressBarService.SetCurrentPage([
      { icon: 'supervisor_account', caption: 'User Management' },
    ]);
  }

  ngOnInit() {
    super.ngOnInit();

    this.subs.add(
      this.controllerService.AllControllers.subscribe(all => {
        this.allControllers = all;
      })
    );
    this.subs.add(
      this.authenticationService.User.subscribe(user => {
        this.isReadOnly = user.IsReadOnlyAdmin;
        this.isDomainAdmin = user.IsDomainAdmin;
        this.orgId = user.OrganizationId;
        this.updateCustomers();
        if (this.isDomainAdmin) {
          this.organizationService.getOrganizations().subscribe(o => {
            this.orgs = o;
          });
        }
      })
    );
    this.subs.add(
      this.authenticationService.OrganizationIdChanged.subscribe(orgId => {
        this.orgId = orgId;
        this.updateCustomers();
      })
    );
  }

  getRoles(user: CustomerResponse): string {
    if (user.IsDomainAdmin && user.IsOrganizationAdmin) {
      return 'Domain Admin';
    }
    if (user.IsReadOnlyAdmin && user.IsOrganizationAdmin) {
      return 'Read Only Admin';
    }
    if (user.IsOrganizationAdmin) {
      return 'Organization Admin';
    }

    return 'Owner Controllers Only';
  }

  createUser(): void {
    if (this.isReadOnly) {
      return;
    }

    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { customer: new CustomerRegistration(), orgs: this.orgs },
    };

    const dialogRef = this.dialog.open(EditCustomerDialogComponent, config);
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        return;
      }

      this.updateCustomers();
    });
  }

  editUser(user: CustomerResponse): void {
    if (this.isReadOnly) {
      return;
    }

    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: {
        id: user.Id,
        customer: Object.assign(new Customer(), user),
        orgs: this.orgs,
        ownedControllers: this.allControllers.filter(
          c => c.UserName.toLowerCase().localeCompare(user.EmailAddress.toLowerCase()) === 0
        ),
      },
    };

    const dialogRef = this.dialog.open(EditCustomerDialogComponent, config);
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        return;
      }

      this.updateCustomers();
    });
  }

  private updateCustomers(): void {
    setTimeout(() => {
      this.customerService.getCustomers().subscribe(
        c => {
          const availCusts = this.isDomainAdmin
            ? c.filter(c1 => c1.OrganizationId === this.orgId)
            : c;
          this.customers.update(availCusts);
        },
        error => this.handleError(error)
      );
    });
  }
}

class CustomersDataSource implements DataSource<CustomerResponse> {
  private data: BehaviorSubject<CustomerResponse[]>;

  constructor(initialData?: CustomerResponse[]) {
    this.data = new BehaviorSubject<CustomerResponse[]>(initialData);
  }

  get Data(): Observable<CustomerResponse[]> {
    return this.data.asObservable();
  }
  connect(): Observable<CustomerResponse[]> {
    return this.data.asObservable();
  }

  update(newData?: CustomerResponse[]): void {
    this.data.next(newData);
  }

  disconnect(): void {
    this.data.complete();
  }
}
