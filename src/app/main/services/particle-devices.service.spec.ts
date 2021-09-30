import { TestBed } from '@angular/core/testing';

import { ParticleDevicesService } from './particle-devices.service';

describe('ParticleDevicesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ParticleDevicesService = TestBed.get(ParticleDevicesService);
    expect(service).toBeTruthy();
  });
});
