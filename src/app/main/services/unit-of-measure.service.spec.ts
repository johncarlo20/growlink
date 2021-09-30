import { TestBed, inject } from '@angular/core/testing';

import { UnitOfMeasureService } from './unit-of-measure.service';

describe('UnitOfMeasureService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UnitOfMeasureService]
    });
  });

  it('should be created', inject([UnitOfMeasureService], (service: UnitOfMeasureService) => {
    expect(service).toBeTruthy();
  }));
});
