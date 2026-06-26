import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicApiService } from '../../core/services/public-api.service';
import { ProductRow } from '../../core/models/admin-list.models';
import { FavoritesService } from '../../core/services/favorites.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-shop-products',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <section class="store-section store-section--white">
      <div class="store-container">
        <header class="store-block-head">
          <div>
            <nav class="store-breadcrumb" aria-label="Đường dẫn">
              <a routerLink="/">Trang chủ</a>
              <span aria-hidden="true">›</span>
              <span>Sản phẩm</span>
            </nav>
            <h2>Sản phẩm</h2>
          </div>
          <a routerLink="/" class="see-all">← Trang chủ</a>
        </header>

        @if (loading()) {
          <p class="state">Đang tải sản phẩm...</p>
        } @else if (!products().length) {
          <p class="state">Chưa có sản phẩm.</p>
        } @else {
          <div class="store-product-grid">
            @for (p of products(); track p._id) {
              <a [routerLink]="linkFor(p)" class="product-item">
                <div class="product-img">
                  @if (p.imageUrl) {
                    <img [src]="p.imageUrl" [alt]="p.name" loading="lazy" />
                  } @else {
                    <div class="img-placeholder"></div>
                  }
                  
                  @if (p.inStock !== false && p.stock > 0) {
                    <span class="stock-badge in-stock">Còn hàng</span>
                  } @else {
                    <span class="stock-badge out-of-stock">Hết hàng</span>
                  }

                  <div class="product-actions">
                    <button
                      type="button"
                      class="action-btn"
                      [class.active]="favorites.isFavorite(p._id)"
                      title="Yêu thích"
                      (click)="toggleFavorite(p, $event)"
                    >
                      <svg viewBox="0 0 24 24" [attr.fill]="favorites.isFavorite(p._id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="action-btn"
                      title="Thêm vào giỏ"
                      (click)="addToCart(p, $event)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                      </svg>
                    </button>
                    <span class="action-btn info-btn" title="Xem chi tiết">i</span>
                  </div>
                </div>
                <h3>{{ p.name }}</h3>
                <p class="product-price">{{ p.price | number }} đ</p>
              </a>
            }
          </div>
        }
      </div>
      @if (toastText()) {
        <div class="toast-notification">{{ toastText() }}</div>
      }
    </section>
  `,
  styles: [
    `
      .store-block-head h2 {
        margin: 0;
        font-size: clamp(1.125rem, 3vw, 1.25rem);
        font-weight: 700;
      }

      .see-all {
        font-size: 0.8125rem;
        color: #6b7280;
        text-decoration: none;
        white-space: nowrap;
      }

      .see-all:hover {
        color: #5c4033;
      }

      .state {
        color: #6b7280;
        font-size: 0.875rem;
      }

      .product-item {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        color: inherit;
        text-decoration: none;
        transition: box-shadow 0.2s, border-color 0.2s;
      }

      .product-item:hover {
        border-color: #d1d5db;
        box-shadow: 0 8px 20px rgba(16, 24, 40, 0.08);
      }

      .product-img {
        position: relative;
        aspect-ratio: 1;
        background: #efefef;
      }

      .product-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .img-placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #eceef1, #dfe3e8);
      }

      .product-item h3 {
        margin: 0.65rem 0.75rem 0;
        font-size: clamp(0.8125rem, 2.5vw, 0.9375rem);
        line-height: 1.35;
      }

      .product-price {
        margin: 0.25rem 0.75rem 0.85rem;
        font-weight: 700;
        font-size: 0.9375rem;
      }

      .stock-badge {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 5;
        font-size: 0.6875rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .stock-badge.in-stock {
        background: rgba(240, 253, 244, 0.95);
        color: #16a34a;
        border: 1px solid #bbf7d0;
      }

      .stock-badge.out-of-stock {
        background: rgba(254, 242, 242, 0.95);
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      /* Product hover actions */
      .product-actions {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        z-index: 5;
        opacity: 0;
        transform: translateX(10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .product-item:hover .product-actions {
        opacity: 1;
        transform: translateX(0);
      }

      .action-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        color: #1e293b;
        display: grid;
        place-items: center;
        cursor: pointer;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        transition: all 0.2s ease;
        padding: 0;
      }

      .action-btn:hover {
        background: #f8fafc;
        color: #8c6239;
        border-color: #cbd5e1;
        transform: scale(1.08);
      }

      .action-btn.active {
        color: #ef4444;
        background: #fef2f2;
        border-color: #fee2e2;
      }

      .action-btn.active:hover {
        background: #fee2e2;
        color: #dc2626;
      }

      .action-btn svg {
        width: 18px;
        height: 18px;
        opacity: 1 !important;
      }

      .info-btn {
        font-family: serif;
        font-size: 1.25rem;
        font-weight: bold;
        font-style: italic;
        line-height: 1;
      }

      .toast-notification {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #1e293b;
        color: #ffffff;
        padding: 0.75rem 1.25rem;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `
  ]
})
export class ShopProductsComponent implements OnInit {
  private readonly publicApi = inject(PublicApiService);
  readonly favorites = inject(FavoritesService);
  readonly cart = inject(CartService);

  readonly products = signal<ProductRow[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.publicApi.getCatalog().subscribe({
      next: (data) => {
        this.products.set(data.products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  linkFor(p: ProductRow): string[] {
    return p.slug ? ['/san-pham', p.slug] : ['/san-pham'];
  }

  readonly toastText = signal('');
  private toastTimeout?: ReturnType<typeof setTimeout>;

  showToast(msg: string): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastText.set(msg);
    this.toastTimeout = setTimeout(() => {
      this.toastText.set('');
    }, 3000);
  }

  toggleFavorite(p: ProductRow, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const added = this.favorites.toggle({
      productId: p._id,
      slug: p.slug || '',
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl
    });
    this.showToast(added ? `Đã thêm "${p.name}" vào danh sách yêu thích!` : `Đã xóa "${p.name}" khỏi danh sách yêu thích!`);
  }

  addToCart(p: ProductRow, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cart.add({
      productId: p._id,
      slug: p.slug || '',
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl
    });
    this.showToast(`Đã thêm "${p.name}" vào giỏ hàng!`);
  }
}
