import { TestBed } from '@angular/core/testing';

import { SoilECTypeService } from './soil-ectype.service';

describe('SoilECTypeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SoilECTypeService = TestBed.get(SoilECTypeService);
    expect(service).toBeTruthy();
  });
});
