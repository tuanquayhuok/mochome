import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicApiService } from '../../core/services/public-api.service';
import { CategoryRow, ProductRow, BannerRow } from '../../core/models/admin-list.models';
import { FavoritesService } from '../../core/services/favorites.service';
import { CartService } from '../../core/services/cart.service';

interface HeroSlide {
  tag: string;
  title: string;
  titleLine2: string;
  desc: string;
}

const TRUST_ITEMS = [
  {
    title: 'Giao hàng toàn quốc',
    sub: 'Giao hàng nhanh chóng',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 3h15v13H1zM16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`
  },
  {
    title: 'Sản phẩm chất lượng',
    sub: 'Bảo hành chính hãng',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
  },
  {
    title: 'Đổi trả dễ dàng',
    sub: 'Hỗ trợ đổi trả trong 7 ngày',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`
  },
  {
    title: 'Hỗ trợ tận tâm',
    sub: 'Tư vấn 24/7',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"/></svg>`
  }
];

const DEFAULT_CATEGORIES = [
  'Sofa',
  'Bàn ăn',
  'Giường ngủ',
  'Tủ quần áo',
  'Kệ tivi',
  'Bàn trà',
  'Decor & Phụ kiện'
];

const HERO_SLIDES: HeroSlide[] = [
  {
    tag: 'NỘI THẤT GỖ TỰ NHIÊN',
    title: 'Tinh tế trong thiết kế',
    titleLine2: 'Ấm cúng trong từng không gian',
    desc:
      'Mang đến không gian sống hài hòa, gần gũi với thiên nhiên và nâng tầm phong cách sống của bạn.'
  },
  {
    tag: 'BỘ SƯU TẬP MỚI 2026',
    title: 'Phòng khách hiện đại',
    titleLine2: 'Sống trọn từng khoảnh khắc',
    desc: 'Sofa góc L, kệ tivi và bàn trà phối hợp hoàn hảo cho không gian tiếp khách sang trọng.'
  }
];

const PLACEHOLDER_POSTS = [
  {
    title: '5 xu hướng nội thất hiện đại 2026',
    excerpt: 'Tổng hợp xu hướng nội thất được ưa chuộng nhất năm nay...',
    slug: ''
  },
  {
    title: 'Cách chọn sofa phòng khách phù hợp',
    excerpt: 'Hướng dẫn chọn kích thước, chất liệu và màu sắc sofa...',
    slug: ''
  },
  {
    title: 'Bí quyết bố trí phòng ngủ ấm cúng',
    excerpt: 'Gợi ý sắp xếp giường, tủ và ánh sáng hài hòa...',
    slug: ''
  }
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <div class="home-page">
      <section 
        class="hero-banner" 
        aria-label="Banner trang chủ"
        (mousedown)="onDragStart($event)"
        (mousemove)="onDragMove($event)"
        (mouseup)="onDragEnd()"
        (mouseleave)="onDragEnd()"
        (touchstart)="onDragStart($event)"
        (touchmove)="onDragMove($event)"
        (touchend)="onDragEnd()"
      >
        @if (banners().length) {
          <!-- DB Banners carousel -->
          <div class="hero-slide-img-wrap" [class.dragging]="isDragging" [style.transform]="transformStyle()">
            @for (banner of banners(); track banner._id) {
              <a [href]="banner.link || '/san-pham'" class="hero-slide-link" (click)="onLinkClick($event)">
                <img [src]="banner.imageUrl" class="hero-slide-img" alt="Banner" draggable="false" />
              </a>
            }
          </div>
        } @else {
          <!-- Fallback slide sliding carousel -->
          <div class="hero-slide-img-wrap" [class.dragging]="isDragging" [style.transform]="transformStyle()">
            @for (slide of slides; track $index) {
              <div class="fallback-slide-item">
                <div class="hero-bg" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.75">
                    <path d="M4 4l16 16M20 4L4 20" />
                  </svg>
                </div>
                <div class="container hero-content-wrap">
                  <div class="hero-content">
                    <span class="hero-tag">{{ slide.tag }}</span>
                    <h1>
                      {{ slide.title }}<br />
                      <span>{{ slide.titleLine2 }}</span>
                    </h1>
                    <p>{{ slide.desc }}</p>
                    <a routerLink="/san-pham" class="hero-cta" (click)="onLinkClick($event)">
                      KHÁM PHÁ NGAY
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Navigation Arrows (Shown on Hover) -->
        <button type="button" class="nav-arrow prev" (click)="prevSlide($event)" aria-label="Slide trước">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button type="button" class="nav-arrow next" (click)="nextSlide($event)" aria-label="Slide tiếp theo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <!-- Carousel Indicators -->
        <div class="hero-dots" role="tablist" aria-label="Chọn slide">
          @if (banners().length) {
            @for (banner of banners(); track banner._id) {
              <button
                type="button"
                role="tab"
                class="dot"
                [class.active]="heroIndex() === $index"
                [attr.aria-selected]="heroIndex() === $index"
                [attr.aria-label]="'Slide ' + ($index + 1)"
                (click)="goSlide($index)"
              ></button>
            }
          } @else {
            @for (slide of slides; track $index) {
              <button
                type="button"
                role="tab"
                class="dot"
                [class.active]="heroIndex() === $index"
                [attr.aria-selected]="heroIndex() === $index"
                [attr.aria-label]="'Slide ' + ($index + 1)"
                (click)="goSlide($index)"
              ></button>
            }
          }
        </div>
      </section>

      <section class="trust-bar" aria-label="Cam kết dịch vụ">
        <div class="trust-marquee-wrapper">
          <div class="trust-marquee-content">
            <!-- Set 1 -->
            @for (t of trustItems; track t.title + '-1') {
              <div class="trust-item">
                <span class="trust-ico">
                  @if (t.title === 'Giao hàng toàn quốc') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 3h15v13H1zM16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  } @else if (t.title === 'Sản phẩm chất lượng') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  } @else if (t.title === 'Đổi trả dễ dàng') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  } @else if (t.title === 'Hỗ trợ tận tâm') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"/></svg>
                  }
                </span>
                <div>
                  <strong>{{ t.title }}</strong>
                  <span>{{ t.sub }}</span>
                </div>
              </div>
            }
            <!-- Set 2 -->
            @for (t of trustItems; track t.title + '-2') {
              <div class="trust-item trust-item-duplicate">
                <span class="trust-ico">
                  @if (t.title === 'Giao hàng toàn quốc') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 3h15v13H1zM16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  } @else if (t.title === 'Sản phẩm chất lượng') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  } @else if (t.title === 'Đổi trả dễ dàng') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  } @else if (t.title === 'Hỗ trợ tận tâm') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"/></svg>
                  }
                </span>
                <div>
                  <strong>{{ t.title }}</strong>
                  <span>{{ t.sub }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <section id="danh-muc" class="block">
        <div class="container">
          <div class="block-head">
            <h2>DANH MỤC SẢN PHẨM</h2>
            <a routerLink="/san-pham" class="see-all">Xem tất cả →</a>
          </div>
          @if (loading()) {
            <p class="state">Đang tải danh mục...</p>
          } @else {
            <div class="cat-row">
              @for (cat of displayCategories(); track cat.name) {
                <a routerLink="/san-pham" class="cat-item">
                  <span class="cat-thumb">
                    @if (cat.imageUrl) {
                      <img [src]="cat.imageUrl" [alt]="cat.name" class="cat-img" />
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M4 4l16 16M20 4L4 20" />
                      </svg>
                    }
                  </span>
                  <span class="cat-name">{{ cat.name }}</span>
                </a>
              }
            </div>
          }
        </div>
      </section>

      <section id="san-pham" class="block block-white">
        <div class="container">
          <div class="block-head">
            <h2>SẢN PHẨM NỔI BẬT</h2>
            <a routerLink="/san-pham" class="see-all">Xem tất cả →</a>
          </div>
          @if (loading()) {
            <p class="state">Đang tải sản phẩm...</p>
          } @else if (!featured().length) {
            <div class="product-row">
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <article class="product-item product-placeholder">
                  <div class="product-img">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.75">
                      <path d="M4 4l16 16M20 4L4 20" />
                    </svg>
                  </div>
                  <div class="product-lines">
                    <span></span>
                    <span></span>
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="product-row">
              @for (p of featured().slice(0, 5); track p._id) {
                <a [routerLink]="productLink(p)" class="product-item">
                  <div class="product-img">
                    @if (p.imageUrl) {
                      <img [src]="p.imageUrl" [alt]="p.name" />
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.75">
                        <path d="M4 4l16 16M20 4L4 20" />
                      </svg>
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
                  <p class="product-price">
                    @if (p.price) {
                      {{ p.price | number }} đ
                    } @else {
                      Liên hệ
                    }
                  </p>
                </a>
              }
            </div>
          }
        </div>
      </section>

      <section id="tin-tuc" class="block">
        <div class="container">
          <div class="block-head">
            <h2>BÀI VIẾT MỚI NHẤT</h2>
            <a routerLink="/tin-tuc" class="see-all">Xem tất cả →</a>
          </div>
          @if (loading()) {
            <p class="state">Đang tải bài viết...</p>
          } @else {
            <div class="news-row">
              @for (post of displayPosts(); track post.title) {
                <article class="news-card">
                  @if (post.slug) {
                    <a [routerLink]="['/bai-viet', post.slug]" class="news-link">
                      <div class="news-thumb">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.75">
                          <path d="M4 4l16 16M20 4L4 20" />
                        </svg>
                      </div>
                      <div class="news-body">
                        <h3>{{ post.title }}</h3>
                        <p>{{ post.excerpt }}</p>
                      </div>
                    </a>
                  } @else {
                    <div class="news-link">
                      <div class="news-thumb">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.75">
                          <path d="M4 4l16 16M20 4L4 20" />
                        </svg>
                      </div>
                      <div class="news-body">
                        <h3>{{ post.title }}</h3>
                        <p>{{ post.excerpt }}</p>
                      </div>
                    </div>
                  }
                </article>
              }
            </div>
          }
        </div>
      </section>

      @if (toastText()) {
        <div class="toast-notification">{{ toastText() }}</div>
      }
    </div>
  `,
  styles: [
    `
      .home-page {
        background: #f5f5f5;
      }

      .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 1.25rem;
      }

      .hero-banner {
        position: relative;
        min-height: 420px;
        display: flex;
        align-items: center;
        overflow: hidden;
        background: #e0e0e0;
        border-bottom: 1px solid #d4d4d4;
      }

      .hero-slide-img-wrap {
        display: flex;
        width: 100%;
        height: 100%;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        position: absolute;
        inset: 0;
        cursor: grab;
      }

      .hero-slide-img-wrap.dragging {
        transition: none !important;
        cursor: grabbing;
      }

      .hero-slide-link {
        flex: 0 0 100%;
        width: 100%;
        height: 100%;
        display: block;
      }

      .hero-slide-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        user-select: none;
      }

      .fallback-slide-item {
        flex: 0 0 100%;
        width: 100%;
        height: 100%;
        position: relative;
        display: flex;
        align-items: center;
        user-select: none;
      }

      .nav-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(0, 0, 0, 0.05);
        color: #1a1d21;
        display: grid;
        place-items: center;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.25s ease, background 0.2s, visibility 0.25s, transform 0.25s;
        z-index: 10;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        outline: none;
      }

      .nav-arrow:hover {
        background: #ffffff;
        color: #000000;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
        transform: translateY(-50%) scale(1.05);
      }

      .nav-arrow svg {
        width: 18px;
        height: 18px;
      }

      .nav-arrow.prev {
        left: 1.25rem;
      }

      .nav-arrow.next {
        right: 1.25rem;
      }

      .hero-banner:hover .nav-arrow {
        opacity: 1;
        visibility: visible;
      }

      .hero-bg {
        position: absolute;
        inset: 0;
        background: #d8d8d8;
        display: grid;
        place-items: center;
        color: #b0b0b0;
      }

      .hero-bg svg {
        width: 120px;
        height: 120px;
        opacity: 0.35;
      }

      .hero-content-wrap {
        position: relative;
        z-index: 1;
        width: 100%;
        padding: 3rem 1.25rem 4rem;
      }

      .hero-content {
        max-width: 520px;
      }

      .hero-tag {
        display: block;
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.14em;
        color: #6b7280;
        margin-bottom: 0.75rem;
      }

      .hero-content h1 {
        margin: 0 0 1rem;
        font-size: clamp(1.75rem, 3.5vw, 2.5rem);
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: -0.02em;
        color: #1a1d21;
      }

      .hero-content p {
        margin: 0 0 1.5rem;
        font-size: 0.875rem;
        line-height: 1.65;
        color: #4b5563;
        max-width: 46ch;
      }

      .hero-cta {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        background: #1a1d21;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.06em;
      }

      .hero-cta svg {
        width: 16px;
        height: 16px;
      }

      .hero-cta:hover {
        background: #374151;
      }

      .hero-dots {
        position: absolute;
        bottom: 1.25rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 0.4rem;
        z-index: 2;
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: none;
        padding: 0;
        background: #b0b0b0;
        cursor: pointer;
      }

      .dot.active {
        background: #1a1d21;
      }

      .trust-bar {
        background: #fff;
        border-bottom: 1px solid #e4e7ec;
        padding: 1.35rem 0;
        overflow: hidden;
      }

      .trust-marquee-wrapper {
        width: 100%;
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 1.25rem;
        overflow: hidden;
      }

      .trust-marquee-content {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
      }

      .trust-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        justify-content: center;
      }

      .trust-item-duplicate {
        display: none !important;
      }

      .trust-ico {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        display: grid;
        place-items: center;
        color: #6b7280;
      }

      .trust-ico :deep(svg) {
        width: 28px;
        height: 28px;
      }

      .trust-item strong {
        display: block;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #1a1d21;
      }

      .trust-item span {
        font-size: 0.75rem;
        color: #8b939e;
      }

      .block {
        padding: 2.5rem 0;
        background: #f5f5f5;
      }

      .block-white {
        background: #fff;
        border-top: 1px solid #f0f2f5;
        border-bottom: 1px solid #f0f2f5;
      }

      .block-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
      }

      .block-head h2 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: #1a1d21;
      }

      .see-all {
        font-size: 0.8125rem;
        font-weight: 500;
        color: #4b5563;
      }

      .see-all:hover {
        color: #1a1d21;
      }

      .state {
        text-align: center;
        color: #8b939e;
        font-size: 0.875rem;
        padding: 2rem;
      }

      .cat-row {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1rem;
      }

      .cat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.65rem;
      }

      .cat-thumb {
        width: 100%;
        aspect-ratio: 1;
        background: #e5e5e5;
        border: 1px solid #d5d5d5;
        border-radius: 2px;
        display: grid;
        place-items: center;
        color: #b0b0b0;
        transition: border-color 0.15s;
        overflow: hidden;
      }

      .cat-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .cat-thumb svg {
        width: 36px;
        height: 36px;
        opacity: 0.5;
      }

      .cat-item:hover .cat-thumb {
        border-color: #9ca3af;
      }

      .cat-name {
        font-size: 0.8125rem;
        font-weight: 500;
        color: #1a1d21;
        text-align: center;
      }

      .product-row {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1rem;
      }

      .product-item {
        display: block;
        background: #fff;
        border: 1px solid #e4e7ec;
        border-radius: 2px;
        overflow: hidden;
        color: inherit;
      }

      .product-img {
        display: block;
        width: 100%;
        height: 240px;
        background: #fdfbf9;
        border-bottom: 1px solid #f0f2f5;
        position: relative;
        overflow: hidden;
      }

      .product-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .product-img svg {
        width: 48px;
        height: 48px;
        opacity: 0.4;
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

      .product-item h3 {
        margin: 0.75rem 0.75rem 0.35rem;
        font-size: 0.8125rem;
        font-weight: 600;
        line-height: 1.35;
        color: #1a1d21;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 2.2em;
      }

      .product-price {
        margin: 0 0.75rem 0.85rem;
        font-size: 0.8125rem;
        font-weight: 700;
        color: #1a1d21;
      }

      .product-placeholder .product-lines {
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .product-lines span {
        display: block;
        height: 10px;
        background: #e5e5e5;
        border-radius: 2px;
      }

      .product-lines span:first-child {
        width: 85%;
      }

      .product-lines span:last-child {
        width: 55%;
      }

      .news-row {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .news-link {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 1.25rem;
        align-items: start;
        padding: 1rem;
        background: #fff;
        border: 1px solid #e4e7ec;
        border-radius: 2px;
        color: inherit;
      }

      .news-link:hover h3 {
        color: #374151;
      }

      .news-thumb {
        aspect-ratio: 1;
        background: #e5e5e5;
        border-radius: 2px;
        display: grid;
        place-items: center;
        color: #b0b0b0;
      }

      .news-thumb svg {
        width: 40px;
        height: 40px;
        opacity: 0.4;
      }

      .news-body h3 {
        margin: 0 0 0.5rem;
        font-size: 0.9375rem;
        font-weight: 600;
        color: #1a1d21;
      }

      .news-body p {
        margin: 0;
        font-size: 0.8125rem;
        line-height: 1.55;
        color: #4b5563;
      }

      @media (max-width: 1100px) {
        .cat-row {
          grid-template-columns: repeat(4, 1fr);
        }

        .product-row {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (max-width: 900px) {
        .hero-banner {
          min-height: auto;
          height: auto;
          aspect-ratio: 16 / 9;
        }

        .hero-content-wrap {
          padding: 1rem 1.25rem;
        }

        .hero-content h1 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .hero-content p {
          font-size: 0.75rem;
          margin-bottom: 0.75rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .hero-cta {
          padding: 0.5rem 1rem;
          font-size: 0.7rem;
        }

        .hero-tag {
          font-size: 0.6rem;
          margin-bottom: 0.25rem;
        }

        .trust-marquee-wrapper {
          padding: 0;
          overflow: hidden;
        }

        .trust-marquee-content {
          display: flex;
          width: max-content;
          gap: 1rem;
          animation: marqueeScroll 20s linear infinite;
        }

        .trust-marquee-content:hover {
          animation-play-state: paused;
        }

        .trust-item {
          width: 240px;
          flex-shrink: 0;
          background: #f9fafb;
          border: 1px solid #f0f2f5;
          border-radius: 8px;
          padding: 0.75rem;
          justify-content: flex-start;
        }

        .trust-item-duplicate {
          display: flex !important;
        }

        .cat-row {
          display: flex;
          overflow-x: auto;
          flex-wrap: nowrap;
          gap: 1rem;
          margin: 0 -1.25rem;
          padding: 0.25rem 1.25rem 0.5rem;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .cat-row::-webkit-scrollbar {
          display: none;
        }

        .cat-item {
          flex: 0 0 90px;
          width: 90px;
        }

        .cat-thumb {
          width: 90px;
          height: 90px;
          border-radius: 6px;
        }

        .product-row {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 600px) {
        .trust-item {
          width: 210px;
          padding: 0.5rem;
          gap: 0.5rem;
        }

        .trust-ico {
          width: 32px;
          height: 32px;
        }

        .trust-ico :deep(svg) {
          width: 22px;
          height: 22px;
        }

        .trust-item strong {
          font-size: 0.75rem;
        }

        .trust-item span {
          font-size: 0.625rem;
        }

        .news-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .news-link {
          grid-template-columns: 1fr;
          padding: 0.75rem;
          height: 100%;
        }

        .news-thumb {
          aspect-ratio: 16 / 10;
        }

        .news-body h3 {
          font-size: 0.8125rem;
          margin-bottom: 0.25rem;
        }

        .news-body p {
          font-size: 0.75rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-row {
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
      }


      @keyframes marqueeScroll {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-50%);
        }
      }

      /* Dark Mode Specific Overrides for Home Page */
      :host-context([data-theme="dark"]) {
        .home-page {
          background: #0f172a !important;
        }

        .block-white {
          background: #0f172a !important;
        }

        .block-head h2,
        .sec-head h2,
        .sec-head a,
        .see-all,
        .cat-name,
        .product-item h3,
        .trust-item strong,
        .trust-item-duplicate strong,
        .news-body h3,
        .news-head h2,
        .fallback-slide-info h2 {
          color: #f8fafc !important;
        }

        .trust-item,
        .trust-item-duplicate,
        .product-item {
          background: #1e293b !important;
          border-color: #334155 !important;
        }

        .product-item {
          border: 1px solid #334155 !important;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding-bottom: 0.5rem;
        }

        .product-item h3 {
          padding: 0 0.5rem;
        }
        
        .product-price {
          padding: 0 0.5rem;
        }

        .trust-item span,
        .trust-item-duplicate span,
        .news-body p,
        .fallback-slide-info p {
          color: #cbd5e1 !important;
        }

        .news-link {
          background: #1e293b !important;
          border-color: #334155 !important;
        }

        .news-link:hover {
          border-color: #475569 !important;
        }

        .sec-head,
        .block-head {
          border-bottom-color: #334155 !important;
        }
      }
    `
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly publicApi = inject(PublicApiService);
  readonly favorites = inject(FavoritesService);
  readonly cart = inject(CartService);

  readonly slides = HERO_SLIDES;
  readonly trustItems = TRUST_ITEMS;
  readonly heroIndex = signal(0);
  readonly loading = signal(true);
  readonly featured = signal<ProductRow[]>([]);
  readonly categories = signal<CategoryRow[]>([]);
  readonly posts = signal<{ title: string; slug: string; excerpt?: string }[]>([]);
  readonly banners = signal<BannerRow[]>([]);

  private slideTimer?: ReturnType<typeof setInterval>;

  // Drag states
  isDragging = false;
  private startX = 0;
  private currentX = 0;
  private dragDistance = 0;
  readonly dragOffset = signal(0);

  readonly transformStyle = computed(() => {
    const baseOffset = -this.heroIndex() * 100;
    if (this.isDragging) {
      return `translateX(calc(${baseOffset}% + ${this.dragOffset()}px))`;
    }
    return `translateX(${baseOffset}%)`;
  });

  activeSlide(): HeroSlide {
    return this.slides[this.heroIndex()] ?? this.slides[0];
  }

  goSlide(index: number): void {
    this.heroIndex.set(index);
    this.resetTimer();
  }

  prevSlide(event: Event): void {
    event.stopPropagation();
    const count = this.banners().length || this.slides.length;
    this.heroIndex.update((i) => (i - 1 + count) % count);
    this.resetTimer();
  }

  nextSlide(event: Event): void {
    event.stopPropagation();
    const count = this.banners().length || this.slides.length;
    this.heroIndex.update((i) => (i + 1) % count);
    this.resetTimer();
  }

  onDragStart(event: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    this.startX = this.getX(event);
    this.currentX = this.startX;
    this.dragDistance = 0;
    this.dragOffset.set(0);
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
  }

  onDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    this.currentX = this.getX(event);
    const dx = this.currentX - this.startX;
    this.dragDistance = dx;
    this.dragOffset.set(dx);
  }

  onDragEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.dragOffset.set(0);

    const dx = this.dragDistance;
    const count = this.banners().length || this.slides.length;

    if (dx < -60) {
      this.heroIndex.update((i) => (i + 1) % count);
    } else if (dx > 60) {
      this.heroIndex.update((i) => (i - 1 + count) % count);
    }

    this.resetTimer();
  }

  onLinkClick(event: Event): void {
    if (Math.abs(this.dragDistance) > 10) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private getX(event: MouseEvent | TouchEvent): number {
    if (event instanceof MouseEvent) {
      return event.pageX;
    } else {
      return event.touches[0]?.pageX || 0;
    }
  }

  displayCategories(): { name: string; imageUrl?: string }[] {
    return this.categories().map((c) => ({
      name: c.name,
      imageUrl: c.imageUrl
    }));
  }

  displayPosts(): { title: string; slug: string; excerpt?: string }[] {
    const list = this.posts().slice(0, 3);
    if (list.length >= 3) return list;
    return [...list, ...PLACEHOLDER_POSTS].slice(0, 3);
  }

  ngOnInit(): void {
    this.publicApi.getCatalog().subscribe({
      next: (data) => {
        this.featured.set(data.featured);
        this.categories.set(data.categories);
        this.posts.set(data.posts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.publicApi.getBanners().subscribe({
      next: (data) => {
        this.banners.set(data);
        this.resetTimer();
      },
      error: (err) => {
        console.error('Error fetching home banners', err);
      }
    });
  }

  private resetTimer(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
    this.slideTimer = setInterval(() => {
      const max = this.banners().length || this.slides.length;
      this.heroIndex.update((i) => (i + 1) % max);
    }, 6000);
  }

  ngOnDestroy(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
  }

  productLink(p: ProductRow): string[] {
    if (p.slug) {
      return ['/san-pham', p.slug];
    }
    return ['/san-pham'];
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
