import { JournalSensor, JournalDevice } from './index';

export class JournalModule {
    Id: string;
    Name: string;
    Sensors: JournalSensor[];
    Devices: JournalDevice[];
}
