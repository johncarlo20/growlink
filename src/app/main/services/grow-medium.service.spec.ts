import { TestBed } from '@angular/core/testing';

import { GrowMediumService } from './grow-medium.service';

describe('GrowMediumService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GrowMediumService = TestBed.get(GrowMediumService);
    expect(service).toBeTruthy();
  });
});
