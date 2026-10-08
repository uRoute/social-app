import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

export const keepAuthGuard: CanActivateFn = (route, state) => {
  let _CookieService = inject(CookieService);
  let _Router = inject(Router);
  if (_CookieService.get('token')) {
    return _Router.parseUrl('/feeds')
  } else {
    return true;
  }
};
