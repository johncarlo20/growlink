import { TestBed, inject } from '@angular/core/testing';

import { DeviceTypesService } from './device-types.service';

describe('DeviceTypesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DeviceTypesService]
    });
  });

  it('should be created', inject([DeviceTypesService], (service: DeviceTypesService) => {
    expect(service).toBeTruthy();
  }));
});
