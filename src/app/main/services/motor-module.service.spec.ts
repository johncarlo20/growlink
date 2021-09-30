import { TestBed } from '@angular/core/testing';

import { MotorModuleService } from './motor-module.service';

describe('MotorModuleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MotorModuleService = TestBed.get(MotorModuleService);
    expect(service).toBeTruthy();
  });
});
