export class CustomerRegistration {
  OrganizationId: string;
  Name: string;
  FirstName: string;
  LastName: string;
  Company: string;
  ReceiveOfflineNotifications: boolean;
  IsDomainAdmin: boolean;
  IsOrganizationAdmin: boolean;
  IsReadOnlyAdmin: boolean;
  IsAccountAdmin: boolean = false;
  EmailAddress: string;
  Password: string;
}
