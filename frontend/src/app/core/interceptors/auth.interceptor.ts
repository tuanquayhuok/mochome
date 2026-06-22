import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('admin_token') || localStorage.getItem('store_token');

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isLoginRequest =
        req.url.includes('/auth/login') ||
        req.url.includes('/public/store/login') ||
        req.url.includes('/public/store/register') ||
        req.url.includes('/auth/store/login') ||
        req.url.includes('/auth/store/register');
      const isPublicApi =
        req.url.includes('/api/public/') || req.url.includes('/public/chat');
      const onAdminArea = router.url.startsWith('/admin');

      if (err.status === 401 && !isLoginRequest && !isPublicApi) {
        if (onAdminArea) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          router.navigate(['/login']);
        } else if (localStorage.getItem('store_token')) {
          localStorage.removeItem('store_token');
          localStorage.removeItem('store_user');
          router.navigate(['/tai-khoan']);
        }
      }
      return throwError(() => err);
    })
  );
};
