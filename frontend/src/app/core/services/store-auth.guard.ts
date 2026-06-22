import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StoreAuthService } from './store-auth.service';

export const storeAuthGuard: CanActivateFn = (_route, state) => {
  const auth = inject(StoreAuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/tai-khoan'], {
    queryParams: { returnUrl: state.url }
  });
};
