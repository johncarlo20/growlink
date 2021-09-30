import { TestBed } from '@angular/core/testing';

import { ParticleSensorsService } from './particle-sensors.service';

describe('ParticleSensorsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ParticleSensorsService = TestBed.get(ParticleSensorsService);
    expect(service).toBeTruthy();
  });
});
