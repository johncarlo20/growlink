export class CustomerResponse {
    Id: string;
    EmailAddress: string;
    FirstName: string;
    LastName: string;
    Company: string;
    DomainId: string;
    IsDomainAdmin: boolean;
    OrganizationId: string;
    IsOrganizationAdmin: boolean;
    IsReadOnlyAdmin: boolean;
    IsAccountAdmin: boolean;
    ReceiveOfflineNotifications: boolean;
    StripeCustomerId: string;
    StripeProductId: string;
    StripeSubscriptionId: string;
}
