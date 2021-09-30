import { TestBed, inject } from '@angular/core/testing';

import { ChartDataPointsService } from './chart-data-points.service';

describe('ChartDataPointsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChartDataPointsService]
    });
  });

  it('should be created', inject([ChartDataPointsService], (service: ChartDataPointsService) => {
    expect(service).toBeTruthy();
  }));
});
