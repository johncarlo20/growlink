import { TestBed, inject } from '@angular/core/testing';

import { ProductTypesService } from './product-types.service';

describe('ProductTypesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductTypesService]
    });
  });

  it('should be created', inject([ProductTypesService], (service: ProductTypesService) => {
    expect(service).toBeTruthy();
  }));
});
