import { CameraScheduleResponse } from './index';

export class CameraResponse {
    Guid: string;
    Name: string;
    Url: string;
    Username: string;
    Password: string;
    Schedules: CameraScheduleResponse[];
}
