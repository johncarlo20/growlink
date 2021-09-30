import { NgModule } from '@angular/core';
import { FuseSharedModule } from '@fuse/shared.module';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AuthGuard } from '../../guards/auth.guard';
import { SubscriptionGuard } from '../../guards/subscription.guard';
import { AccountAdminGuard } from '../../guards/account-admin.guard';
import { CustomerComponent } from './customer.component';
import { EditCustomerDialogComponent } from './edit-customer-dialog.component';
import { DeleteConfirmDialogComponent } from './delete-confirm/delete-confirm-dialog.component';
import { CustomerInboxComponent } from './customer-inbox.component';
import { ModuleAlertDialogComponent } from './alert-dialogs/module-alert-dialog.component';
import { SensorAlertDialogComponent } from './alert-dialogs/sensor-alert-dialog.component';
import { SubscriptionManagementComponent } from './subscription-management.component';
import { PaymentMethodDialogComponent } from './payment-method-dialog/payment-method-dialog.component';
import { PaymentHistoryComponent } from 'app/main/payment-history-component/payment-history.component';
import { PaymentHistoryDialogComponent } from './payment-history-dialog/payment-history-dialog.component';

const routes = [
  {
    path: 'users',
    component: CustomerComponent,
    canActivate: [AuthGuard, SubscriptionGuard],
  },
  {
    path: 'inbox',
    component: CustomerInboxComponent,
    canActivate: [AuthGuard, SubscriptionGuard],
  },
  {
    path: 'subscription',
    component: SubscriptionManagementComponent,
    canActivate: [AuthGuard, AccountAdminGuard],
  },
];

@NgModule({
  declarations: [
    CustomerComponent,
    EditCustomerDialogComponent,
    DeleteConfirmDialogComponent,
    CustomerInboxComponent,
    ModuleAlertDialogComponent,
    SensorAlertDialogComponent,
    SubscriptionManagementComponent,
    PaymentMethodDialogComponent,
    PaymentHistoryComponent,
    PaymentHistoryDialogComponent,
  ],
  imports: [
    FuseSharedModule,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatCardModule,
    RouterModule.forChild(routes),
  ],
})
export class CustomerModule {}
