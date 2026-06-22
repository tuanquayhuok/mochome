import { Routes } from '@angular/router';
import { ADMIN_EXTENDED_ROUTES } from './shared/admin-extended.routes';
import { AdminLayoutComponent } from './layouts/admin-layout.component';
import { StoreLayoutComponent } from './layouts/store-layout.component';
import { authGuard } from './core/services/auth.guard';
import { guestGuard } from './core/services/guest.guard';
import { storeGuestGuard } from './core/services/store-guest.guard';
import { storeAuthGuard } from './core/services/store-auth.guard';

export const appRoutes: Routes = [
  {
    path: '',
    component: StoreLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent)
      }
      ,
      {
        path: 'san-pham',
        pathMatch: 'full',
        loadComponent: () => import('./pages/shop/products.component').then((m) => m.ShopProductsComponent)
      },
      {
        path: 'san-pham/:slug',
        loadComponent: () => import('./pages/product-detail/product-detail.component').then((m) => m.ProductDetailComponent)
      },
      {
        path: 'bai-viet/:slug',
        loadComponent: () => import('./pages/post-detail/post-detail.component').then((m) => m.PostDetailComponent)
      },
      {
        path: 'tin-tuc',
        loadComponent: () => import('./pages/posts-list/posts-list.component').then((m) => m.PostsListComponent)
      },
      {
        path: 'bo-suu-tap/:slug',
        loadComponent: () => import('./pages/collection/collection.component').then((m) => m.CollectionComponent)
      },
      {
        path: 'gioi-thieu',
        loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent)
      },
      {
        path: 'lien-he',
        loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent)
      },
      {
        path: 'yeu-thich',
        loadComponent: () => import('./pages/favorites/favorites.component').then((m) => m.FavoritesComponent)
      },
      {
        path: 'gio-hang',
        loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent)
      },
      {
        path: 'thanh-toan',
        canActivate: [storeAuthGuard],
        loadComponent: () =>
          import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent)
      },
      {
        path: 'dang-ky',
        canActivate: [storeGuestGuard],
        loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent)
      },
      {
        path: 'tai-khoan',
        loadComponent: () => import('./pages/store-account/account.component').then((m) => m.StoreAccountComponent)
      }
    ]
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./pages/products/product-form.component').then((m) => m.ProductFormComponent)
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./pages/products/product-form.component').then((m) => m.ProductFormComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products.component').then((m) => m.ProductsComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/categories/categories.component').then((m) => m.CategoriesComponent)
      },
      {
        path: 'collections',
        loadComponent: () =>
          import('./pages/products/collections.component').then((m) => m.CollectionsComponent)
      },
      {
        path: 'attributes',
        loadComponent: () =>
          import('./pages/products/attributes.component').then((m) => m.AttributesComponent)
      },
      {
        path: 'variants',
        loadComponent: () => import('./pages/products/variants.component').then((m) => m.VariantsComponent)
      },
      {
        path: 'product-reviews',
        loadComponent: () =>
          import('./pages/products/product-reviews.component').then((m) => m.ProductReviewsComponent)
      },
      { path: 'reviews', redirectTo: 'product-reviews', pathMatch: 'full' },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders.component').then((m) => m.OrdersComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component').then((m) => m.UsersComponent)
      },
      {
        path: 'reviews',
        loadComponent: () => import('./pages/reviews/reviews.component').then((m) => m.ReviewsComponent)
      },
      {
        path: 'contacts',
        loadComponent: () => import('./pages/contacts/contacts.component').then((m) => m.ContactsComponent)
      },
      {
        path: 'test-mail',
        loadComponent: () => import('./pages/admin/test-mail.component').then((m) => m.TestMailComponent)
      },
      { path: 'promotions', pathMatch: 'full', redirectTo: 'promotions/vouchers' },
      {
        path: 'promotions/vouchers',
        loadComponent: () =>
          import('./pages/promotions/promotions.component').then((m) => m.PromotionsComponent)
      },
      {
        path: 'promotions/new',
        loadComponent: () =>
          import('./pages/promotions/promotion-form.component').then((m) => m.PromotionFormComponent)
      },
      {
        path: 'promotions/:id/edit',
        loadComponent: () =>
          import('./pages/promotions/promotion-form.component').then((m) => m.PromotionFormComponent)
      },
      {
        path: 'posts/new',
        loadComponent: () => import('./pages/posts/post-form.component').then((m) => m.PostFormComponent)
      },
      {
        path: 'posts/interactions',
        loadComponent: () =>
          import('./pages/posts/post-interactions.component').then((m) => m.PostInteractionsComponent)
      },
      {
        path: 'posts/:id/edit',
        loadComponent: () => import('./pages/posts/post-form.component').then((m) => m.PostFormComponent)
      },
      {
        path: 'posts',
        loadComponent: () => import('./pages/posts/posts.component').then((m) => m.PostsComponent)
      },
      {
        path: 'banners',
        loadComponent: () => import('./pages/banners/banners.component').then((m) => m.BannersComponent)
      },
      {
        path: 'account',
        loadComponent: () => import('./pages/account/account.component').then((m) => m.AccountComponent)
      },
      {
        path: 'account/password',
        loadComponent: () =>
          import('./pages/account/account-password.component').then((m) => m.AccountPasswordComponent)
      },
      ...ADMIN_EXTENDED_ROUTES,
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: '' }
];
