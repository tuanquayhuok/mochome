import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicApiService } from '../../core/services/public-api.service';
import { ProductRow } from '../../core/models/admin-list.models';

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
                  <div class="overlay">
                    <div class="avail">{{ p.inStock !== false && p.stock > 0 ? 'Còn hàng' : 'Hết hàng' }}</div>
                    <span class="btn small">Xem chi tiết</span>
                  </div>
                </div>
                <h3>{{ p.name }}</h3>
                <p class="product-price">{{ p.price | number }} đ</p>
              </a>
            }
          </div>
        }
      </div>
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

      .overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.45));
        opacity: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 0.6rem;
        transition: opacity 0.18s;
      }

      .product-item:hover .overlay {
        opacity: 1;
      }

      .avail {
        background: rgba(255, 255, 255, 0.92);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.6875rem;
        align-self: flex-start;
      }

      .btn.small {
        align-self: center;
        padding: 0.4rem 0.75rem;
        font-size: 0.75rem;
        background: #fff;
        border-radius: 4px;
        font-weight: 600;
        color: #1a1d21;
      }
    `
  ]
})
export class ShopProductsComponent implements OnInit {
  private readonly publicApi = inject(PublicApiService);

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
}
