import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { keepAuthGuard } from './keep-auth-guard';

describe('keepAuthGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => keepAuthGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
