import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicApiService } from '../../core/services/public-api.service';
import { CartService } from '../../core/services/cart.service';
import { FavoritesService } from '../../core/services/favorites.service';
import {
  PublicProductCard,
  PublicProductDetail
} from '../../core/models/product-detail.models';

type InfoTab = 'description' | 'details' | 'care' | 'return';

const TAB_LABELS: Record<InfoTab, string> = {
  description: 'MÔ TẢ SẢN PHẨM',
  details: 'CHI TIẾT SẢN PHẨM',
  care: 'HƯỚNG DẪN BẢO QUẢN',
  return: 'CHÍNH SÁCH ĐỔI TRẢ'
};

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <div class="pdp">
      @if (loading()) {
        <div class="container pdp-state">Đang tải sản phẩm...</div>
      } @else if (error()) {
        <div class="container pdp-state pdp-state--error">
          <p>{{ error() }}</p>
          <a routerLink="/san-pham" class="btn-outline">Quay lại danh sách</a>
        </div>
      } @else if (product(); as p) {
        <div class="container">
          <nav class="breadcrumb" aria-label="Đường dẫn">
            <a routerLink="/">Trang chủ</a>
            <span aria-hidden="true">›</span>
            <a routerLink="/san-pham">Sản phẩm</a>
            @if (p.category) {
              <span aria-hidden="true">›</span>
              <a [routerLink]="['/san-pham']" [queryParams]="{ danhMuc: p.category.slug }">{{
                p.category.name
              }}</a>
            }
            <span aria-hidden="true">›</span>
            <span class="current">{{ p.name }}</span>
          </nav>

          <section class="pdp-main" aria-label="Thông tin sản phẩm">
            <div class="pdp-gallery">
              <div class="thumbs" role="list">
                @for (img of p.images; track img; let i = $index) {
                  <button
                    type="button"
                    class="thumb"
                    [class.active]="activeImageIndex() === i"
                    (click)="selectImage(i)"
                    [attr.aria-label]="'Ảnh ' + (i + 1)"
                  >
                    <img [src]="img" [alt]="p.name + ' — ảnh ' + (i + 1)" />
                  </button>
                }
              </div>

              <div class="hero-wrap">
                <button
                  type="button"
                  class="nav-arrow prev"
                  aria-label="Ảnh trước"
                  (click)="prevImage()"
                >
                  ‹
                </button>
                <div class="hero-img">
                  <img [src]="activeImage()" [alt]="p.name" />
                </div>
                <button
                  type="button"
                  class="nav-arrow next"
                  aria-label="Ảnh sau"
                  (click)="nextImage()"
                >
                  ›
                </button>
              </div>
            </div>

            <div class="pdp-buy">
              <h1>{{ p.name }}</h1>
              <p class="sku">Mã sản phẩm: <strong>{{ p.sku }}</strong></p>
              <p class="price">{{ p.price | number }}đ</p>

              @if (p.colors.length) {
                <div class="option-block">
                  <span class="option-label">Màu sắc</span>
                  <div class="color-row">
                    @for (c of p.colors; track c.name) {
                      <button
                        type="button"
                        class="color-swatch"
                        [class.active]="selectedColor() === c.name"
                        [style.background]="c.hex"
                        [attr.title]="c.name"
                        (click)="selectedColor.set(c.name)"
                      ></button>
                    }
                  </div>
                </div>
              }

              @if (p.sizes.length) {
                <div class="option-block">
                  <span class="option-label">Kích thước</span>
                  <div class="size-row">
                    @for (size of p.sizes; track size) {
                      <button
                        type="button"
                        class="size-btn"
                        [class.active]="selectedSize() === size"
                        (click)="selectedSize.set(size)"
                      >
                        {{ size }}
                      </button>
                    }
                  </div>
                </div>
              }

              <div class="option-block">
                <span class="option-label">Chất liệu</span>
                <p class="material-text">{{ p.material }}</p>
              </div>

              <div class="qty-row">
                <span class="option-label">Số lượng</span>
                <div class="qty-control">
                  <button type="button" (click)="changeQty(-1)" aria-label="Giảm">−</button>
                  <span>{{ quantity() }}</span>
                  <button type="button" (click)="changeQty(1)" aria-label="Tăng">+</button>
                </div>
                <span class="stock" [class.out]="!p.inStock">
                  {{ p.inStock ? 'Còn hàng' : 'Hết hàng' }}
                </span>
              </div>

              <div class="cta-row">
                <button type="button" class="btn-cart" (click)="addToCart(false)" [disabled]="!p.inStock">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <path d="M3 6h18M16 10a4 4 0 01-8 0" />
                  </svg>
                  THÊM VÀO GIỎ HÀNG
                </button>
                <button type="button" class="btn-buy" (click)="addToCart(true)" [disabled]="!p.inStock">
                  MUA NGAY
                </button>
                <button
                  type="button"
                  class="btn-fav"
                  [class.active]="isFav()"
                  (click)="toggleFavorite()"
                  [attr.aria-pressed]="isFav()"
                  title="Yêu thích"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                    <path
                      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                    />
                  </svg>
                </button>
              </div>

              <div class="trust-row">
                <div class="trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M1 3h15v13H1zM16 8h4l3 5v3h-7V8z" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <span>Giao hàng toàn quốc</span>
                </div>
                <div class="trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Bảo hành chính hãng</span>
                </div>
              </div>
            </div>
          </section>

          <section class="pdp-tabs" aria-label="Thông tin chi tiết">
            <div class="tab-list" role="tablist">
              @for (tab of tabs; track tab) {
                <button
                  type="button"
                  role="tab"
                  class="tab-btn"
                  [class.active]="activeTab() === tab"
                  [attr.aria-selected]="activeTab() === tab"
                  (click)="activeTab.set(tab)"
                >
                  {{ tabLabels[tab] }}
                </button>
              }
            </div>

            <div class="tab-panel" role="tabpanel">
              @switch (activeTab()) {
                @case ('description') {
                  <div class="tab-grid">
                    <div class="tab-copy">
                      <p>{{ p.longDescription || p.description }}</p>
                      <ul class="spec-list">
                        @for (spec of p.detailSpecs; track spec.label) {
                          <li><strong>{{ spec.label }}:</strong> {{ spec.value }}</li>
                        }
                      </ul>
                    </div>
                    <div class="tab-media">
                      <img [src]="p.images[1] || p.images[0]" [alt]="p.name" />
                    </div>
                  </div>
                }
                @case ('details') {
                  <table class="spec-table">
                    <tbody>
                      @for (spec of p.detailSpecs; track spec.label) {
                        <tr>
                          <th>{{ spec.label }}</th>
                          <td>{{ spec.value }}</td>
                        </tr>
                      }
                      <tr>
                        <th>Mã SKU</th>
                        <td>{{ p.sku }}</td>
                      </tr>
                      <tr>
                        <th>Chất liệu</th>
                        <td>{{ p.material }}</td>
                      </tr>
                    </tbody>
                  </table>
                }
                @case ('care') {
                  <p class="tab-paragraph">{{ p.careGuide }}</p>
                }
                @case ('return') {
                  <p class="tab-paragraph">{{ p.returnPolicy }}</p>
                }
              }
            </div>
          </section>

          @if (related().length) {
            <section class="pdp-related" aria-labelledby="related-heading">
              <div class="related-head">
                <h2 id="related-heading">SẢN PHẨM LIÊN QUAN</h2>
                <a routerLink="/san-pham" class="see-all">Xem tất cả →</a>
              </div>
              <div class="related-row">
                @for (item of related(); track item._id) {
                  <a [routerLink]="['/san-pham', item.slug]" class="related-card">
                    <div class="related-img">
                      @if (item.imageUrl) {
                        <img [src]="item.imageUrl" [alt]="item.name" />
                      } @else {
                        <span class="img-ph"></span>
                      }
                    </div>
                    <h3>{{ item.name }}</h3>
                    <p class="related-price">{{ item.price | number }}đ</p>
                  </a>
                }
              </div>
            </section>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .pdp {
        background: #f5f5f5;
        padding: 1.25rem 0 2.5rem;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.25rem;
      }

      .pdp-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #6b7280;
      }

      .pdp-state--error p {
        margin-bottom: 1rem;
      }

      .breadcrumb {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem;
        margin-bottom: 1.25rem;
        font-size: 0.8125rem;
        color: #6b7280;
      }

      .breadcrumb a:hover {
        color: #1a1d21;
      }

      .breadcrumb .current {
        color: #1a1d21;
        font-weight: 500;
      }

      .pdp-main {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
        gap: 2rem;
        align-items: start;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .pdp-gallery {
        display: grid;
        grid-template-columns: 72px 1fr;
        gap: 1rem;
      }

      .thumbs {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .thumb {
        padding: 0;
        border: 2px solid transparent;
        border-radius: 6px;
        overflow: hidden;
        cursor: pointer;
        background: #f3f4f6;
        aspect-ratio: 1;
      }

      .thumb.active {
        border-color: #1a1d21;
      }

      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .hero-wrap {
        position: relative;
        background: #f9fafb;
        border-radius: 8px;
        min-height: 380px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .hero-img {
        width: 100%;
        padding: 1rem;
      }

      .hero-img img {
        width: 100%;
        max-height: 420px;
        object-fit: contain;
        display: block;
        margin: 0 auto;
      }

      .nav-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 36px;
        height: 36px;
        border: 1px solid #e5e7eb;
        border-radius: 50%;
        background: #fff;
        font-size: 1.25rem;
        line-height: 1;
        color: #374151;
        cursor: pointer;
        z-index: 1;
      }

      .nav-arrow:hover {
        background: #f3f4f6;
      }

      .nav-arrow.prev {
        left: 0.75rem;
      }

      .nav-arrow.next {
        right: 0.75rem;
      }

      .pdp-buy h1 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.3;
        color: #1a1d21;
      }

      .sku {
        margin: 0 0 0.75rem;
        font-size: 0.8125rem;
        color: #6b7280;
      }

      .price {
        margin: 0 0 1.25rem;
        font-size: 1.375rem;
        font-weight: 700;
        color: #b91c1c;
      }

      .option-block {
        margin-bottom: 1rem;
      }

      .option-label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .color-row {
        display: flex;
        gap: 0.5rem;
      }

      .color-swatch {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        border: 2px solid transparent;
        cursor: pointer;
        padding: 0;
      }

      .color-swatch.active {
        border-color: #1a1d21;
        box-shadow: 0 0 0 1px #fff inset;
      }

      .size-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .size-btn {
        min-width: 72px;
        padding: 0.45rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: #fff;
        font-size: 0.8125rem;
        cursor: pointer;
      }

      .size-btn.active {
        border-color: #1a1d21;
        background: #1a1d21;
        color: #fff;
      }

      .material-text {
        margin: 0;
        font-size: 0.875rem;
        color: #4b5563;
        padding: 0.5rem 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        background: #fafafa;
      }

      .qty-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem 1rem;
        margin: 1.25rem 0;
      }

      .qty-control {
        display: inline-flex;
        align-items: center;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        overflow: hidden;
      }

      .qty-control button {
        width: 36px;
        height: 36px;
        border: none;
        background: #fff;
        font-size: 1.125rem;
        cursor: pointer;
      }

      .qty-control button:hover {
        background: #f3f4f6;
      }

      .qty-control span {
        min-width: 40px;
        text-align: center;
        font-weight: 600;
        border-left: 1px solid #e5e7eb;
        border-right: 1px solid #e5e7eb;
        line-height: 36px;
      }

      .stock {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #166534;
      }

      .stock.out {
        color: #b91c1c;
      }

      .cta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }

      .btn-cart,
      .btn-buy,
      .btn-outline {
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        border-radius: 4px;
        cursor: pointer;
        transition: opacity 0.15s;
      }

      .btn-cart {
        flex: 1;
        min-width: 200px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.85rem 1.25rem;
        border: none;
        background: #5c4033;
        color: #fff;
      }

      .btn-cart svg {
        width: 18px;
        height: 18px;
      }

      .btn-cart:hover:not(:disabled) {
        background: #4a3329;
      }

      .btn-buy {
        padding: 0.85rem 1.5rem;
        border: 2px solid #5c4033;
        background: #fff;
        color: #5c4033;
      }

      .btn-buy:hover:not(:disabled) {
        background: #faf5f2;
      }

      .btn-fav {
        flex-shrink: 0;
        width: 48px;
        height: 48px;
        border: 1px solid #e4e7ec;
        border-radius: 4px;
        background: #fff;
        color: #6b7280;
        cursor: pointer;
        display: grid;
        place-items: center;
      }

      .btn-fav svg {
        width: 22px;
        height: 22px;
      }

      .btn-fav:hover,
      .btn-fav.active {
        color: #b91c1c;
        border-color: #fecaca;
        background: #fef2f2;
      }

      .btn-fav.active svg {
        fill: #b91c1c;
        stroke: #b91c1c;
      }

      .btn-cart:disabled,
      .btn-buy:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-outline {
        display: inline-block;
        padding: 0.55rem 1rem;
        border: 1px solid #d1d5db;
        background: #fff;
        color: #374151;
        text-decoration: none;
      }

      .trust-row {
        display: flex;
        flex-wrap: wrap;
        gap: 1.25rem;
        padding-top: 0.5rem;
        border-top: 1px solid #f0f2f5;
      }

      .trust-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: #4b5563;
      }

      .trust-item svg {
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        color: #6b7280;
      }

      .pdp-tabs {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 2rem;
      }

      .tab-list {
        display: flex;
        flex-wrap: wrap;
        border-bottom: 1px solid #e5e7eb;
        background: #fafafa;
      }

      .tab-btn {
        padding: 0.85rem 1.1rem;
        border: none;
        background: transparent;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: #6b7280;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
      }

      .tab-btn.active {
        color: #1a1d21;
        border-bottom-color: #1a1d21;
        background: #fff;
      }

      .tab-panel {
        padding: 1.5rem;
      }

      .tab-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        align-items: start;
      }

      .tab-copy p {
        margin: 0 0 1rem;
        font-size: 0.875rem;
        line-height: 1.7;
        color: #4b5563;
      }

      .spec-list {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .spec-list li {
        font-size: 0.875rem;
        color: #4b5563;
        margin-bottom: 0.35rem;
      }

      .tab-media img {
        width: 100%;
        border-radius: 8px;
        object-fit: cover;
        max-height: 280px;
      }

      .spec-table {
        width: 100%;
        border-collapse: collapse;
      }

      .spec-table th,
      .spec-table td {
        padding: 0.65rem 0;
        text-align: left;
        border-bottom: 1px solid #f0f2f5;
        font-size: 0.875rem;
      }

      .spec-table th {
        width: 160px;
        font-weight: 600;
        color: #374151;
      }

      .tab-paragraph {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.7;
        color: #4b5563;
        max-width: 72ch;
      }

      .pdp-related {
        margin-top: 0.5rem;
      }

      .related-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }

      .related-head h2 {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 700;
        letter-spacing: 0.06em;
      }

      .see-all {
        font-size: 0.8125rem;
        font-weight: 500;
        color: #6b7280;
      }

      .see-all:hover {
        color: #1a1d21;
      }

      .related-row {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1rem;
      }

      .related-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
        transition: box-shadow 0.15s;
      }

      .related-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .related-img {
        aspect-ratio: 1;
        background: #f3f4f6;
      }

      .related-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .img-ph {
        display: block;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #eceef1, #dfe3e8);
      }

      .related-card h3 {
        margin: 0.6rem 0.75rem 0;
        font-size: 0.8125rem;
        font-weight: 600;
        line-height: 1.35;
        color: #1a1d21;
      }

      .related-price {
        margin: 0.25rem 0.75rem 0.75rem;
        font-size: 0.875rem;
        font-weight: 700;
        color: #1a1d21;
      }

      @media (max-width: 1024px) {
        .pdp-main {
          grid-template-columns: 1fr;
        }

        .related-row {
          grid-template-columns: repeat(3, 1fr);
        }

        .tab-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .pdp-gallery {
          grid-template-columns: 1fr;
        }

        .thumbs {
          flex-direction: row;
          order: 2;
        }

        .hero-wrap {
          min-height: 260px;
        }

        .related-row {
          grid-template-columns: repeat(2, 1fr);
        }

        .tab-list {
          overflow-x: auto;
          flex-wrap: nowrap;
        }

        .cta-row {
          flex-direction: column;
        }

        .btn-cart {
          width: 100%;
        }
      }
    `
  ]
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly publicApi = inject(PublicApiService);
  private readonly cart = inject(CartService);
  private readonly favorites = inject(FavoritesService);

  readonly tabs: InfoTab[] = ['description', 'details', 'care', 'return'];
  readonly tabLabels = TAB_LABELS;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly product = signal<PublicProductDetail | null>(null);
  readonly related = signal<PublicProductCard[]>([]);
  readonly activeImageIndex = signal(0);
  readonly activeTab = signal<InfoTab>('description');
  readonly selectedColor = signal('');
  readonly selectedSize = signal('');
  readonly quantity = signal(1);

  readonly activeImage = computed(() => {
    const p = this.product();
    if (!p?.images?.length) return '';
    return p.images[this.activeImageIndex()] ?? p.images[0];
  });

  readonly isFav = computed(() => {
    const p = this.product();
    if (!p) return false;
    return this.favorites.favorites().some((i) => i.productId === p._id);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') || '';
      this.loadProduct(slug);
    });
  }

  private loadProduct(slug: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.activeImageIndex.set(0);

    this.publicApi.getProductBySlug(slug).subscribe({
      next: ({ product, related }) => {
        this.product.set(product);
        this.related.set(related);
        this.selectedColor.set(product.colors[0]?.name ?? '');
        this.selectedSize.set(product.sizes[0] ?? '');
        this.quantity.set(1);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Không tìm thấy sản phẩm hoặc máy chủ chưa sẵn sàng.');
        this.loading.set(false);
      }
    });
  }

  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  prevImage(): void {
    const p = this.product();
    if (!p?.images.length) return;
    const next = (this.activeImageIndex() - 1 + p.images.length) % p.images.length;
    this.activeImageIndex.set(next);
  }

  nextImage(): void {
    const p = this.product();
    if (!p?.images.length) return;
    const next = (this.activeImageIndex() + 1) % p.images.length;
    this.activeImageIndex.set(next);
  }

  changeQty(delta: number): void {
    const p = this.product();
    const max = p?.stock ?? 99;
    const next = Math.min(Math.max(1, this.quantity() + delta), max);
    this.quantity.set(next);
  }

  addToCart(buyNow: boolean): void {
    const p = this.product();
    if (!p) return;

    this.cart.add({
      productId: p._id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl ?? this.activeImage(),
      quantity: this.quantity(),
      color: this.selectedColor(),
      size: this.selectedSize()
    });

    if (buyNow) {
      this.router.navigate(['/gio-hang']);
    }
  }

  toggleFavorite(): void {
    const p = this.product();
    if (!p) return;
    this.favorites.toggle({
      productId: p._id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl ?? this.activeImage()
    });
  }
}
