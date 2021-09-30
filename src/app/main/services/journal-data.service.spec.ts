import { TestBed, inject } from '@angular/core/testing';

import { JournalDataService } from './journal-data.service';

describe('JournalDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JournalDataService]
    });
  });

  it('should be created', inject([JournalDataService], (service: JournalDataService) => {
    expect(service).toBeTruthy();
  }));
});
