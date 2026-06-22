import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../core/services/favorites.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <section class="fav-page store-section store-section--white">
      <div class="store-container">
        <header class="store-page-head fav-head">
          <div>
            <nav class="store-breadcrumb" aria-label="Đường dẫn">
              <a routerLink="/">Trang chủ</a>
              <span aria-hidden="true">›</span>
              <span>Yêu thích</span>
            </nav>
            <h1>Sản phẩm yêu thích</h1>
            <p>
              @if (favorites.favorites().length) {
                Bạn đang lưu <strong>{{ favorites.favorites().length }}</strong> sản phẩm
              } @else {
                Danh sách trống — hãy thêm sản phẩm bạn thích khi mua sắm
              }
            </p>
          </div>
          <a routerLink="/san-pham" class="head-link store-page-head__actions">Tiếp tục mua sắm →</a>
        </header>

        @if (!favorites.favorites().length) {
          <div class="empty-panel">
            <div class="empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                />
              </svg>
            </div>
            <h2>Chưa có sản phẩm yêu thích</h2>
            <p>Nhấn biểu tượng trái tim ở trang chi tiết sản phẩm để lưu vào đây.</p>
            <a routerLink="/san-pham" class="store-btn store-btn-primary">Khám phá sản phẩm</a>
          </div>
        } @else {
          @if (toast()) {
            <div class="toast" role="status">{{ toast() }}</div>
          }

          <div class="store-product-grid product-grid">
            @for (item of favorites.favorites(); track item.productId) {
              <article class="product-card">
                <a [routerLink]="['/san-pham', item.slug]" class="product-media">
                  @if (item.imageUrl) {
                    <img [src]="item.imageUrl" [alt]="item.name" loading="lazy" />
                  } @else {
                    <span class="img-placeholder"></span>
                  }
                  <div class="media-overlay">
                    <span class="badge">Đã lưu</span>
                    <span class="overlay-cta">Xem chi tiết</span>
                  </div>
                </a>

                <button
                  type="button"
                  class="remove-fav"
                  (click)="remove(item.productId)"
                  title="Bỏ yêu thích"
                  aria-label="Bỏ yêu thích"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path
                      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                    />
                  </svg>
                </button>

                <div class="product-body">
                  <a [routerLink]="['/san-pham', item.slug]" class="product-name">{{ item.name }}</a>
                  <p class="product-price">{{ item.price | number }} <small>đ</small></p>
                  <div class="product-actions">
                    <button type="button" class="btn-cart" (click)="addToCart(item)">Thêm vào giỏ</button>
                    <a [routerLink]="['/san-pham', item.slug]" class="btn-detail">Chi tiết</a>
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .fav-page {
        min-height: 50vh;
      }

      .fav-head strong {
        color: #5c4033;
      }

      .head-link {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #5c4033;
        text-decoration: none;
        white-space: nowrap;
      }

      .head-link:hover {
        text-decoration: underline;
      }

      .toast {
        margin-bottom: 1rem;
        padding: 0.65rem 1rem;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #166534;
        border-radius: 6px;
        font-size: 0.875rem;
      }

      .product-card {
        position: relative;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
        transition: box-shadow 0.2s, border-color 0.2s;
      }

      .product-card:hover {
        border-color: #d1d5db;
        box-shadow: 0 8px 24px rgba(16, 24, 40, 0.08);
      }

      .product-media {
        display: block;
        position: relative;
        aspect-ratio: 1;
        background: #f3f4f6;
        overflow: hidden;
      }

      .product-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.35s ease;
      }

      .product-card:hover .product-media img {
        transform: scale(1.04);
      }

      .img-placeholder {
        display: block;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #eceef1, #dfe3e8);
      }

      .media-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 0.65rem;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.15), transparent 40%, rgba(0, 0, 0, 0.45));
        opacity: 0;
        transition: opacity 0.2s;
      }

      .product-card:hover .media-overlay {
        opacity: 1;
      }

      .badge {
        align-self: flex-start;
        padding: 0.2rem 0.5rem;
        background: rgba(255, 255, 255, 0.92);
        border-radius: 4px;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #b91c1c;
      }

      .overlay-cta {
        align-self: center;
        padding: 0.4rem 0.85rem;
        background: #fff;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #1a1d21;
      }

      .remove-fav {
        position: absolute;
        top: 0.65rem;
        right: 0.65rem;
        z-index: 2;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.95);
        color: #b91c1c;
        cursor: pointer;
        display: grid;
        place-items: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        transition: transform 0.15s, background 0.15s;
      }

      .remove-fav svg {
        width: 18px;
        height: 18px;
      }

      .remove-fav:hover {
        transform: scale(1.08);
        background: #fef2f2;
      }

      .product-body {
        padding: 1rem 1rem 1.1rem;
      }

      .product-name {
        display: block;
        font-size: 0.9375rem;
        font-weight: 600;
        color: #1a1d21;
        text-decoration: none;
        line-height: 1.35;
        margin-bottom: 0.35rem;
        min-height: 2.5em;
      }

      .product-name:hover {
        color: #5c4033;
      }

      .product-price {
        margin: 0 0 0.85rem;
        font-size: 1rem;
        font-weight: 700;
        color: #1a1d21;
      }

      .product-price small {
        font-size: 0.8125rem;
        font-weight: 600;
      }

      .product-actions {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.5rem;
      }

      .btn-cart {
        padding: 0.55rem 0.75rem;
        border: none;
        border-radius: 4px;
        background: #5c4033;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        cursor: pointer;
      }

      .btn-cart:hover {
        background: #4a3329;
      }

      .btn-detail {
        display: inline-flex;
        align-items: center;
        padding: 0.55rem 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #4b5563;
        text-decoration: none;
        white-space: nowrap;
      }

      .btn-detail:hover {
        border-color: #5c4033;
        color: #5c4033;
      }

      .empty-panel {
        text-align: center;
        max-width: 420px;
        margin: 2rem auto 0;
        padding: 2.5rem 1.5rem;
        border: 1px dashed #e5e7eb;
        border-radius: 12px;
        background: #fafafa;
      }

      .empty-icon svg {
        width: 56px;
        height: 56px;
        color: #d1d5db;
        margin-bottom: 1rem;
      }

      .empty-panel h2 {
        margin: 0 0 0.5rem;
        font-size: 1.125rem;
      }

      .empty-panel p {
        margin: 0 0 1.25rem;
        font-size: 0.875rem;
        color: #6b7280;
      }

      @media (max-width: 640px) {
        .product-actions {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class FavoritesComponent {
  readonly favorites = inject(FavoritesService);
  private readonly cart = inject(CartService);
  readonly toast = signal('');

  addToCart(item: {
    productId: string;
    slug: string;
    name: string;
    price: number;
    imageUrl?: string;
  }): void {
    this.cart.add({
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: 1
    });
    this.toast.set(`Đã thêm "${item.name}" vào giỏ hàng`);
    setTimeout(() => this.toast.set(''), 2800);
  }

  remove(productId: string): void {
    this.favorites.remove(productId);
  }
}
