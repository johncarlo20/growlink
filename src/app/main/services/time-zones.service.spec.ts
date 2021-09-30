import { TestBed, inject } from '@angular/core/testing';

import { TimeZonesService } from './time-zones.service';

describe('TimeZonesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TimeZonesService]
    });
  });

  it('should be created', inject([TimeZonesService], (service: TimeZonesService) => {
    expect(service).toBeTruthy();
  }));
});
