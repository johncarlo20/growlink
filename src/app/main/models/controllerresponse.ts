export class ControllerResponse {
    Id: string;
    Name: string;
    DeviceId: string;
    OrganizationId: string;
    GroupName: string;
    UserName: string;
    TimeZoneId: string;
    IsReadOnly: boolean;
    EnableInlineDosing: boolean;
    EnableMotorControls: boolean;
    EnableHighFrequencyJournalData: boolean;
    HasPaidSubscription: boolean;
    ShowProSupportNumber: boolean;
    SupportsCropSteering: boolean;
    FirmwareVersion: number;
    DefaultDashboardId?: string;
}
