import { TestBed } from '@angular/core/testing';

import { HorasExtraService } from './horas-extra.service';

describe('HorasExtraService', () => {
  let service: HorasExtraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HorasExtraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
