import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

export const headerInterceptor: HttpInterceptorFn = (req, next) => {
  let _CookieService = inject(CookieService);
  let Token = _CookieService.get('token')
  if (_CookieService.check("token")) {
    req = req.clone({
      setHeaders: {
        token: Token,
        AUTHORIZATION: `Bearer ${Token}`
      }
    })
  }
  return next(req);
};
