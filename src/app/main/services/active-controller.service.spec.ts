import { TestBed } from '@angular/core/testing';

import { ActiveControllerService } from './active-controller.service';

describe('ActiveControllerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ActiveControllerService = TestBed.get(ActiveControllerService);
    expect(service).toBeTruthy();
  });
});
