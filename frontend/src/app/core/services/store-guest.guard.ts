import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StoreAuthService } from './store-auth.service';

/** Chuyển khách đã đăng nhập cửa hàng về trang tài khoản. */
export const storeGuestGuard: CanActivateFn = () => {
  const store = inject(StoreAuthService);
  const router = inject(Router);

  if (store.isLoggedIn()) {
    return router.createUrlTree(['/tai-khoan']);
  }
  return true;
};
