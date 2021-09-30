import { TestBed, inject } from '@angular/core/testing';

import { UserpreferencesService } from './userpreferences.service';

describe('UserpreferencesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserpreferencesService]
    });
  });

  it('should be created', inject([UserpreferencesService], (service: UserpreferencesService) => {
    expect(service).toBeTruthy();
  }));
});
