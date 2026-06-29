import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, RouterLink, DecimalPipe, FormsModule],
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

              <!-- AI Virtual Staging button -->
              <div class="virtual-staging-row">
                <button type="button" class="btn-staging" (click)="openStagingModal()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="staging-ico">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" stroke-width="2" />
                  </svg>
                  XEM THỬ PHÒNG CỦA BẠN (AR VIRTUAL STAGING)
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
                  </div>
                }
                @case ('details') {
                  <div class="tab-copy">
                    <p>Sản phẩm thiết kế độc bản bởi Mộc Home. Sử dụng chất liệu gỗ tự nhiên cao cấp, thân thiện với môi trường, được xử lý tẩm sấy chống mối mọt cong vênh tối đa.</p>
                  </div>
                }
                @case ('care') {
                  <div class="tab-copy">
                    <ul>
                      <li>Tránh đặt sản phẩm nơi có ánh nắng trực tiếp hoặc nhiệt độ quá cao.</li>
                      <li>Sử dụng khăn ẩm mềm để vệ sinh bề mặt gỗ định kỳ.</li>
                      <li>Không sử dụng hóa chất tẩy rửa mạnh làm giảm độ bóng của sơn PU bảo vệ.</li>
                    </ul>
                  </div>
                }
                @case ('return') {
                  <div class="tab-copy">
                    <p>Bảo hành chính hãng 12 tháng kể từ ngày nhận hàng. Đổi trả hàng lỗi kỹ thuật hoàn toàn miễn phí trong vòng 7 ngày.</p>
                  </div>
                }
              }
            </div>
          </section>

          @if (related().length) {
            <section class="pdp-related" aria-labelledby="related-title">
              <h2 id="related-title">SẢN PHẨM LIÊN QUAN</h2>
              <div class="related-grid">
                @for (item of related(); track item._id) {
                  <a [routerLink]="['/san-pham', item.slug]" class="related-card">
                    <div class="card-img">
                      <img [src]="item.imageUrl" [alt]="item.name" />
                    </div>
                    <h3>{{ item.name }}</h3>
                    <p class="card-price">{{ item.price | number }}đ</p>
                  </a>
                }
              </div>
            </section>
          }
        </div>
      }

      @if (toastText()) {
        <div class="toast-notification">{{ toastText() }}</div>
      }
    </div>

    <!-- AI Virtual Staging Modal -->
    @if (showStagingModal()) {
      <div class="staging-modal-backdrop" (click)="closeStagingModal()"></div>
      <div class="staging-modal-dialog">
        <div class="staging-modal-content">
          <header class="staging-header">
            <div class="staging-header-title">
              <h2>AR Virtual Room Staging</h2>
              <span>Thử Nghiệm Nội Thất Trong Không Gian Của Bạn</span>
            </div>
            
            <div class="staging-view-modes">
              <button 
                type="button" 
                [class.active]="viewMode() === '2d'" 
                (click)="setViewMode('2d')"
              >
                Thiết Kế 2D
              </button>
              <button 
                type="button" 
                [class.active]="viewMode() === '3d'" 
                (click)="setViewMode('3d')"
              >
                Chiều Sâu 3D
              </button>
            </div>
            
            <button type="button" class="close-staging-btn" (click)="closeStagingModal()">×</button>
          </header>

          <div class="staging-body">
            <!-- Left Controls -->
            <aside class="staging-sidebar">
              <!-- Step 1: Select room background -->
              <div class="sidebar-block">
                <h3>1. Chọn phòng của bạn</h3>
                <div class="upload-btn-wrap">
                  <label class="btn-upload-file">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    Tải lên ảnh phòng
                    <input type="file" accept="image/*" (change)="handleRoomUpload($event)" style="display: none;" />
                  </label>
                </div>
                
                <div class="sample-rooms">
                  <span class="sub-title">Hoặc chọn không gian mẫu:</span>
                  <div class="sample-grid">
                    @for (room of sampleRooms; track room.id) {
                      <button 
                        type="button" 
                        class="sample-btn"
                        [class.active]="selectedRoomId() === room.id && !customRoomImage()"
                        (click)="selectSampleRoom(room)"
                      >
                        <img [src]="room.thumb" [alt]="room.name" />
                        <span>{{ room.name }}</span>
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- Step 2: Controls for selected furniture item -->
              @if (activeItem(); as active) {
                <div class="sidebar-block">
                  <h3>2. Điều chỉnh đồ đạc</h3>
                  <div class="control-fields">
                    <label class="control-label">
                      <span>Kích thước:</span>
                      <input 
                        type="range" 
                        min="0.15" 
                        max="2.5" 
                        step="0.05" 
                        [ngModel]="active.scale" 
                        (input)="updateActiveItem('scale', $event)" 
                      />
                      <span class="value-text">{{ Math.round(active.scale * 100) }}%</span>
                    </label>

                    <label class="control-label">
                      <span>Xoay hình:</span>
                      <input 
                        type="range" 
                        min="-180" 
                        max="180" 
                        step="5" 
                        [ngModel]="active.rotation" 
                        (input)="updateActiveItem('rotation', $event)" 
                      />
                      <span class="value-text">{{ active.rotation }}°</span>
                    </label>

                    <label class="control-label">
                      <span>Độ mờ:</span>
                      <input 
                        type="range" 
                        min="0.2" 
                        max="1" 
                        step="0.05" 
                        [ngModel]="active.opacity" 
                        (input)="updateActiveItem('opacity', $event)" 
                      />
                      <span class="value-text">{{ Math.round(active.opacity * 100) }}%</span>
                    </label>

                    <div class="control-actions-grid">
                      <button type="button" class="btn-control" (click)="flipActiveItem()">Lật ảnh</button>
                      <button type="button" class="btn-control active-btn-staging" (click)="removeBackground(active)">Xóa nền ảnh</button>
                      <button type="button" class="btn-control danger" (click)="deleteActiveItem()">Xóa khỏi phòng</button>
                    </div>
                  </div>
                </div>
              }

              <!-- Step 3: Trigger 3D Perspective -->
              <div class="sidebar-block">
                <h3>3. Xem phối cảnh 3D</h3>
                <button 
                  type="button" 
                  class="btn-staging-3d" 
                  (click)="setViewMode('3d')"
                  [class.active]="viewMode() === '3d'"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  TẠO PHỐI CẢNH 3D
                </button>
              </div>

              <!-- Step 4: Add secondary products -->
              <div class="sidebar-block">
                <h3>4. Phối đồ nội thất khác</h3>
                <div class="furniture-catalog">
                  @for (prod of relatedProducts(); track prod._id) {
                    <button type="button" class="catalog-item" (click)="addFurnitureToRoom(prod)">
                      <img [src]="prod.imageUrl" [alt]="prod.name" />
                      <span class="catalog-name">{{ prod.name }}</span>
                    </button>
                  }
                </div>
              </div>
            </aside>

            <!-- Right Canvas area -->
            <div class="staging-canvas-area" #canvasArea>
              @if (viewMode() === '2d') {
                <div 
                  class="staging-canvas-2d"
                  [style.backgroundImage]="'url(' + currentRoomBg() + ')'"
                  (mousemove)="onDragMove($event)"
                  (mouseup)="onDragEnd()"
                  (mouseleave)="onDragEnd()"
                  (touchmove)="onDragMove($event)"
                  (touchend)="onDragEnd()"
                >
                  @for (item of placedItems(); track item.id) {
                    <div 
                      class="placed-furniture-item"
                      [class.active]="activeItemId() === item.id"
                      [style.left.px]="item.x"
                      [style.top.px]="item.y"
                      [style.transform]="'translate(-50%, -50%) rotate(' + item.rotation + 'deg) scale(' + item.scale + ') scaleX(' + (item.flipped ? -1 : 1) + ')'"
                      [style.opacity]="item.opacity"
                      (mousedown)="onDragStart($event, item)"
                      (touchstart)="onDragStart($event, item)"
                    >
                      <img [src]="item.imageUrl" [alt]="item.name" draggable="false" />
                      @if (activeItemId() === item.id) {
                        <div class="item-borders"></div>
                        <button type="button" class="btn-delete-item" (click)="deleteActiveItem(); $event.stopPropagation();">×</button>
                      }
                    </div>
                  }
                </div>
              } @else {
                <!-- 3D cylinder panorama renderer canvas (no duplicate html elements here) -->
                <div class="staging-canvas-3d" #container3d>
                  <div class="pan-help-overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 3a9 9 0 00-9 9c0 5 9 10 9 10s9-5 9-10a9 9 0 00-9-9z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span>Kéo chuột để xoay phòng 360 độ xung quanh bạn.</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .pdp {
        background: #ffffff;
        color: #2c2520;
        padding-top: 1.5rem;
        padding-bottom: 5rem;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.25rem;
      }

      .pdp-state {
        text-align: center;
        padding: 6rem 0;
        font-size: 1rem;
        color: #7a6e67;
      }

      .pdp-state--error p {
        color: #dc2626;
        margin-bottom: 1.5rem;
      }

      .btn-outline {
        display: inline-block;
        padding: 0.75rem 2rem;
        border: 1px solid #eae6e2;
        border-radius: 4px;
        color: #2c2520;
        text-decoration: none;
        font-weight: 700;
        font-size: 0.8125rem;
        letter-spacing: 0.05em;
        transition: background 0.2s;
      }

      .btn-outline:hover {
        background: #fbf9f7;
      }

      /* Breadcrumb */
      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.8125rem;
        color: #a3978e;
        margin-bottom: 2rem;
      }

      .breadcrumb a {
        color: #8c7e74;
        text-decoration: none;
        transition: color 0.2s;
      }

      .breadcrumb a:hover {
        color: #2c2520;
      }

      .breadcrumb .current {
        color: #a3978e;
      }

      /* PDP Main layout */
      .pdp-main {
        display: grid;
        grid-template-columns: 1.15fr 1fr;
        gap: 3.5rem;
        align-items: start;
        margin-bottom: 4.5rem;
      }

      /* Gallery */
      .pdp-gallery {
        display: flex;
        gap: 1.25rem;
      }

      .thumbs {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 70px;
        flex-shrink: 0;
      }

      .thumb {
        aspect-ratio: 1;
        border: 1px solid #eae6e2;
        border-radius: 4px;
        background: #fbf9f7;
        overflow: hidden;
        cursor: pointer;
        padding: 0;
        transition: border-color 0.2s;
      }

      .thumb.active {
        border-color: #8c7161;
      }

      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .hero-wrap {
        position: relative;
        flex-grow: 1;
        aspect-ratio: 1;
        border: 1px solid #eae6e2;
        border-radius: 6px;
        background: #fbf9f7;
        overflow: hidden;
      }

      .hero-img {
        width: 100%;
        height: 100%;
      }

      .hero-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .nav-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #eae6e2;
        font-size: 1.25rem;
        line-height: 1;
        cursor: pointer;
        z-index: 5;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .nav-arrow:hover {
        background: #fff;
      }

      .nav-arrow.prev {
        left: 12px;
      }

      .nav-arrow.next {
        right: 12px;
      }

      /* Buy Box info */
      .pdp-buy h1 {
        margin: 0 0 0.5rem;
        font-size: clamp(1.5rem, 3.5vw, 2rem);
        font-weight: 800;
        letter-spacing: 0.02em;
        line-height: 1.25;
      }

      .sku {
        margin: 0 0 1.25rem;
        font-size: 0.8125rem;
        color: #7a6e67;
      }

      .sku strong {
        color: #2c2520;
      }

      .price {
        font-size: 1.5rem;
        font-weight: 800;
        color: #8c7161;
        margin: 0 0 2rem;
      }

      .option-block {
        margin-bottom: 1.5rem;
      }

      .option-label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #7a6e67;
        margin-bottom: 0.6rem;
      }

      .color-row {
        display: flex;
        gap: 0.75rem;
      }

      .color-swatch {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid #dcd0c9;
        cursor: pointer;
        padding: 0;
        position: relative;
        transition: transform 0.2s;
      }

      .color-swatch:hover {
        transform: scale(1.1);
      }

      .color-swatch.active::after {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 1px solid #8c7161;
      }

      .size-row {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }

      .size-btn {
        padding: 0.5rem 1.25rem;
        border: 1px solid #eae6e2;
        border-radius: 4px;
        background: #fff;
        font-size: 0.8125rem;
        font-weight: 700;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s;
      }

      .size-btn:hover {
        border-color: #8c7161;
      }

      .size-btn.active {
        background: #2c2520;
        color: #fff;
        border-color: #2c2520;
      }

      .material-text {
        margin: 0;
        font-size: 0.875rem;
        color: #2c2520;
        font-weight: 500;
      }

      .qty-row {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 2.25rem;
        margin-top: 2rem;
      }

      .qty-control {
        display: flex;
        align-items: center;
        border: 1px solid #eae6e2;
        border-radius: 4px;
        background: #fff;
        overflow: hidden;
      }

      .qty-control button {
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        font-size: 1.15rem;
        cursor: pointer;
        transition: background 0.2s;
      }

      .qty-control button:hover {
        background: #fbf9f7;
      }

      .qty-control span {
        width: 40px;
        text-align: center;
        font-weight: 700;
        font-size: 0.875rem;
      }

      .stock {
        font-size: 0.8125rem;
        font-weight: 700;
        color: #16a34a;
      }

      .stock.out {
        color: #dc2626;
      }

      /* Staging Button CSS styling */
      .virtual-staging-row {
        margin-top: 1rem;
        margin-bottom: 2rem;
      }

      .btn-staging {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 0.95rem;
        background: #8c7161;
        color: #fff;
        border: none;
        border-radius: 4px;
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(140, 113, 97, 0.2);
        transition: background 0.25s, transform 0.2s;
      }

      .btn-staging:hover {
        background: #6e5445;
        transform: translateY(-2px);
      }

      .staging-ico {
        width: 18px;
        height: 18px;
      }

      /* CTA Row */
      .cta-row {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }

      .btn-cart {
        flex-grow: 1.5;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background: transparent;
        border: 1px solid #2c2520;
        border-radius: 4px;
        color: #2c2520;
        font-weight: 700;
        font-size: 0.8125rem;
        letter-spacing: 0.08em;
        cursor: pointer;
        padding: 1rem;
        transition: background 0.2s, color 0.2s;
      }

      .btn-cart:hover {
        background: #2c2520;
        color: #fff;
      }

      .btn-cart svg {
        width: 18px;
        height: 18px;
      }

      .btn-buy {
        flex-grow: 1;
        background: #2c2520;
        color: #fff;
        border: none;
        border-radius: 4px;
        font-weight: 700;
        font-size: 0.8125rem;
        letter-spacing: 0.08em;
        cursor: pointer;
        padding: 1rem;
        transition: background 0.2s;
      }

      .btn-buy:hover {
        background: #4a3e35;
      }

      .btn-fav {
        width: 50px;
        border: 1px solid #eae6e2;
        border-radius: 4px;
        background: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #2c2520;
        transition: color 0.2s, border-color 0.2s, background 0.2s;
        padding: 0;
      }

      .btn-fav:hover {
        border-color: #dc2626;
        color: #dc2626;
        background: #fdf2f2;
      }

      .btn-fav.active {
        color: #dc2626;
        background: #fdf2f2;
        border-color: #fecaca;
      }

      .btn-fav.active svg {
        fill: currentColor;
      }

      .btn-fav svg {
        width: 20px;
        height: 20px;
      }

      .trust-row {
        display: flex;
        gap: 2rem;
        border-top: 1px solid #eae6e2;
        padding-top: 1.5rem;
        margin-top: 2rem;
      }

      .trust-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: #7a6e67;
      }

      .trust-item svg {
        width: 18px;
        height: 18px;
        color: #a3978e;
      }

      /* Tabs */
      .pdp-tabs {
        border-top: 1px solid #eae6e2;
        padding-top: 3.5rem;
        margin-bottom: 4.5rem;
      }

      .tab-list {
        display: flex;
        gap: 2.5rem;
        border-bottom: 1px solid #eae6e2;
        margin-bottom: 2rem;
      }

      .tab-btn {
        background: none;
        border: none;
        padding: 0 0 1rem;
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        color: #a3978e;
        cursor: pointer;
        position: relative;
        transition: color 0.2s;
      }

      .tab-btn:hover {
        color: #2c2520;
      }

      .tab-btn.active {
        color: #2c2520;
      }

      .tab-btn.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: #8c7161;
      }

      .tab-copy {
        font-size: 0.9375rem;
        line-height: 1.7;
        color: #5c5047;
      }

      .tab-copy p {
        margin: 0 0 1.5rem;
      }

      .spec-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem 2rem;
      }

      .spec-list li {
        font-size: 0.875rem;
        border-bottom: 1px solid #f5f2ef;
        padding-bottom: 0.5rem;
      }

      /* Related Products */
      .pdp-related {
        border-top: 1px solid #eae6e2;
        padding-top: 4.5rem;
      }

      .pdp-related h2 {
        text-align: center;
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        margin-bottom: 2.5rem;
      }

      .related-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
      }

      .related-card {
        background: #fff;
        border: 1px solid #eae6e2;
        border-radius: 4px;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .related-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(140, 113, 97, 0.05);
      }

      .card-img {
        aspect-ratio: 1;
        background: #fbf9f7;
        overflow: hidden;
      }

      .card-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      .related-card:hover .card-img img {
        transform: scale(1.04);
      }

      .related-card h3 {
        margin: 1rem 1rem 0.25rem;
        font-size: 0.875rem;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-price {
        margin: 0 1rem 1.25rem;
        font-size: 0.8125rem;
        font-weight: 700;
        color: #8c7161;
      }

      /* Toast ToastNotification */
      .toast-notification {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #2c2520;
        color: #fff;
        padding: 0.75rem 2rem;
        border-radius: 4px;
        font-size: 0.8125rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        z-index: 10000;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translate(-50%, 20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }

      /* ==========================================================================
         AR VIRTUAL STAGING MODAL STYLING
         ========================================================================== */
      .staging-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 10001;
        backdrop-filter: blur(8px);
      }

      .staging-modal-dialog {
        position: fixed;
        top: 5vh;
        left: 5vw;
        width: 90vw;
        height: 90vh;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        z-index: 10002;
        overflow: hidden;
        display: flex;
      }

      .staging-modal-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
      }

      .staging-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 2rem;
        border-bottom: 1px solid #eae6e2;
        background: #fdfcfa;
      }

      .staging-header-title h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        color: #2c2520;
      }

      .staging-header-title span {
        font-size: 0.75rem;
        color: #7a6e67;
        font-weight: 500;
      }

      .staging-view-modes {
        display: flex;
        gap: 0.5rem;
        background: #f5f2ef;
        padding: 0.25rem;
        border-radius: 6px;
      }

      .staging-view-modes button {
        padding: 0.5rem 1.25rem;
        border: none;
        background: transparent;
        font-size: 0.8125rem;
        font-weight: 700;
        color: #8c7e74;
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.2s, color 0.2s;
      }

      .staging-view-modes button.active {
        background: #fff;
        color: #2c2520;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      }

      .close-staging-btn {
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        color: #a3978e;
        transition: color 0.2s;
        padding: 0;
        line-height: 1;
      }

      .close-staging-btn:hover {
        color: #2c2520;
      }

      .staging-body {
        display: flex;
        flex: 1;
        height: calc(100% - 75px);
        background: #faf8f5;
      }

      /* Sidebar Tools */
      .staging-sidebar {
        width: 320px;
        background: #fff;
        border-right: 1px solid #eae6e2;
        overflow-y: auto;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
        flex-shrink: 0;
      }

      .sidebar-block h3 {
        margin: 0 0 1rem;
        font-size: 0.875rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #2c2520;
        border-bottom: 2px solid #f5f2ef;
        padding-bottom: 0.5rem;
      }

      .btn-upload-file {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.75rem;
        background: #fbf9f7;
        border: 1px dashed #c0b4ac;
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 700;
        color: #8c7161;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-upload-file:hover {
        background: #f5f2ef;
        border-color: #8c7161;
      }

      .btn-upload-file svg {
        width: 16px;
        height: 16px;
      }

      .sample-rooms {
        margin-top: 1rem;
      }

      .sample-rooms .sub-title {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        color: #a3978e;
        margin-bottom: 0.5rem;
      }

      .sample-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
      }

      .sample-btn {
        background: none;
        border: 2px solid transparent;
        border-radius: 6px;
        overflow: hidden;
        cursor: pointer;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #fdfcfa;
        box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      }

      .sample-btn img {
        width: 100%;
        aspect-ratio: 4/3;
        object-fit: cover;
      }

      .sample-btn span {
        font-size: 0.625rem;
        font-weight: 600;
        padding: 0.25rem 0.1rem;
        text-align: center;
        color: #7a6e67;
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .sample-btn.active {
        border-color: #8c7161;
      }

      /* Sliders and fields */
      .control-fields {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .control-label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: #5c5047;
      }

      .control-label input[type='range'] {
        width: 100%;
        accent-color: #8c7161;
        cursor: pointer;
      }

      .value-text {
        font-weight: 600;
        color: #8c7161;
        align-self: flex-end;
      }

      .control-actions-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .btn-control {
        padding: 0.55rem;
        border: 1px solid #eae6e2;
        background: #fff;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        color: #2c2520;
        transition: all 0.2s;
        text-align: center;
      }

      .btn-control:hover {
        background: #faf8f5;
        border-color: #8c7161;
      }

      .btn-control.active-btn-staging {
        background: #8c7161;
        color: #fff;
        border-color: #8c7161;
      }

      .btn-control.active-btn-staging:hover {
        background: #6e5445;
        border-color: #6e5445;
      }

      .btn-control.danger {
        grid-column: span 2;
        border-color: #fee2e2;
        color: #dc2626;
      }

      .btn-control.danger:hover {
        background: #fef2f2;
        border-color: #fca5a5;
      }

      /* 3D Action button */
      .btn-staging-3d {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.65rem;
        padding: 0.85rem;
        background: #2c2520;
        color: #fff;
        border: none;
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: background 0.2s, transform 0.2s;
      }

      .btn-staging-3d:hover {
        background: #4a3e35;
      }

      .btn-staging-3d.active {
        background: #8c7161;
      }

      .btn-staging-3d svg {
        width: 16px;
        height: 16px;
      }

      /* Catalog items placement */
      .furniture-catalog {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        max-height: 180px;
        overflow-y: auto;
        padding-right: 0.25rem;
      }

      .catalog-item {
        background: #fff;
        border: 1px solid #eae6e2;
        border-radius: 6px;
        padding: 0.35rem;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      .catalog-item:hover {
        border-color: #8c7161;
        box-shadow: 0 4px 10px rgba(0,0,0,0.04);
      }

      .catalog-item img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: contain;
        background: #fafafa;
        border-radius: 4px;
      }

      .catalog-name {
        font-size: 0.625rem;
        font-weight: 600;
        text-align: center;
        color: #2c2520;
        margin-top: 0.25rem;
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      /* Canvas Stage area */
      .staging-canvas-area {
        flex: 1;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ece9e6;
        box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.08);
      }

      .staging-canvas-2d {
        width: 100%;
        height: 100%;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
        overflow: hidden;
        user-select: none;
      }

      .staging-canvas-3d {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        cursor: grab;
      }

      .staging-canvas-3d:active {
        cursor: grabbing;
      }

      .pan-help-overlay {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(44, 37, 32, 0.85);
        color: #fff;
        padding: 0.5rem 1.25rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10;
        backdrop-filter: blur(4px);
      }

      .pan-help-overlay svg {
        width: 16px;
        height: 16px;
      }

      /* Placed overlay item positioning and selection borders */
      .placed-furniture-item {
        position: absolute;
        cursor: move;
        transform-origin: center center;
        user-select: none;
        touch-action: none;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        z-index: 10;
      }

      .placed-furniture-item img {
        display: block;
        max-width: 180px;
        max-height: 180px;
        object-fit: contain;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
      }

      .placed-furniture-item.active .item-borders {
        position: absolute;
        inset: -2px;
        border: 2px dashed #8c7161;
        border-radius: 4px;
        pointer-events: none;
        animation: borderPulse 1.5s infinite;
      }

      @keyframes borderPulse {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
      }

      .btn-delete-item {
        position: absolute;
        top: -12px;
        right: -12px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #dc2626;
        color: #fff;
        border: none;
        font-size: 1.15rem;
        line-height: 1;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        z-index: 20;
      }

      .btn-delete-item:hover {
        background: #b91c1c;
      }

      @media (max-width: 991px) {
        .pdp-main {
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }

        .staging-modal-dialog {
          width: 96vw;
          height: 96vh;
          top: 2vh;
          left: 2vw;
        }
      }

      @media (max-width: 768px) {
        .pdp-gallery {
          flex-direction: column-reverse;
        }

        .thumbs {
          flex-direction: row;
          width: 100%;
        }

        .related-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .staging-body {
          flex-direction: column;
        }

        .staging-sidebar {
          width: 100%;
          height: 220px;
          border-right: none;
          border-bottom: 1px solid #eae6e2;
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
  readonly toastText = signal('');
  private toastTimeout: any;

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

  // ==========================================================================
  // AR VIRTUAL STAGING PROPERTIES & CONTROLS
  // ==========================================================================
  @ViewChild('container3d') container3d!: ElementRef;
  @ViewChild('canvasArea') canvasArea!: ElementRef;

  readonly showStagingModal = signal(false);
  readonly viewMode = signal<'2d' | '3d'>('2d');
  readonly customRoomImage = signal<string | null>(null);
  readonly selectedRoomId = signal<string>('living-room');
  readonly placedItems = signal<any[]>([]);
  readonly activeItemId = signal<string | null>(null);
  readonly Math = Math;

  readonly sampleRooms = [
    {
      id: 'living-room',
      name: 'Phòng khách Modern',
      thumb: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=300&q=80',
      full: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
      pano: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=2048&q=80'
    },
    {
      id: 'bedroom',
      name: 'Phòng ngủ Minimalist',
      thumb: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80',
      full: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      pano: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=2048&q=80'
    },
    {
      id: 'dining-room',
      name: 'Phòng ăn Cozy',
      thumb: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80',
      full: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
      pano: 'https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=2048&q=80'
    }
  ];

  readonly currentRoomBg = computed(() => {
    const custom = this.customRoomImage();
    if (custom) return custom;
    const room = this.sampleRooms.find((r) => r.id === this.selectedRoomId());
    return room ? room.full : this.sampleRooms[0].full;
  });

  readonly activeItem = computed(() => {
    const activeId = this.activeItemId();
    if (!activeId) return null;
    return this.placedItems().find((i) => i.id === activeId) || null;
  });

  readonly relatedProducts = computed(() => this.related());

  // Drag state variables
  private draggingItem: any = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private itemStartX = 0;
  private itemStartY = 0;

  // Three.js variables
  private threeScene: any = null;
  private threeCamera: any = null;
  private threeRenderer: any = null;
  private isUserInteracting = false;
  private onPointerDownMouseX = 0;
  private onPointerDownMouseY = 0;
  
  // Orbit rotation variables (fixed 360 rotation around vertical cylinder)
  private lon = 0; // horizontal rotation
  private lat = 0; // vertical tilt
  private onPointerDownLon = 0;
  private onPointerDownLat = 0;
  private phi = 0;
  private theta = 0;
  
  private animationFrameId: number | null = null;

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

  showToast(msg: string): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastText.set(msg);
    this.toastTimeout = setTimeout(() => {
      this.toastText.set('');
    }, 3000);
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
    } else {
      this.showToast(`Đã thêm "${p.name}" vào giỏ hàng!`);
    }
  }

  // ==========================================================================
  // AR VIRTUAL STAGING CONTROLLER METHODS
  // ==========================================================================
  openStagingModal(): void {
    const p = this.product();
    if (!p) return;

    // Reset placed items to just the active product in the center of canvas
    this.placedItems.set([
      {
        id: 'main-product',
        productId: p._id,
        name: p.name,
        imageUrl: p.imageUrl ?? this.activeImage(),
        x: 350,
        y: 250,
        scale: 0.7,
        rotation: 0,
        opacity: 1,
        flipped: false
      }
    ]);
    this.activeItemId.set('main-product');
    this.customRoomImage.set(null);
    this.selectedRoomId.set('living-room');
    this.viewMode.set('2d');
    this.showStagingModal.set(true);
  }

  closeStagingModal(): void {
    this.destroyThree3d();
    this.showStagingModal.set(false);
  }

  setViewMode(mode: '2d' | '3d'): void {
    this.viewMode.set(mode);
    if (mode === '3d') {
      setTimeout(() => this.initThree3d(), 50);
    } else {
      this.destroyThree3d();
    }
  }

  selectSampleRoom(room: any): void {
    this.customRoomImage.set(null);
    this.selectedRoomId.set(room.id);
    if (this.viewMode() === '3d') {
      setTimeout(() => this.initThree3d(), 50);
    }
  }

  handleRoomUpload(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.customRoomImage.set(e.target.result);
        if (this.viewMode() === '3d') {
          // If we are currently in 3d mode, reload 3D panorama with the user's uploaded image
          setTimeout(() => this.initThree3d(), 50);
        }
      };
      reader.readAsDataURL(target.files[0]);
    }
  }

  addFurnitureToRoom(prod: PublicProductCard): void {
    const newItemId = `item-${Date.now()}`;
    this.placedItems.update((list) => [
      ...list,
      {
        id: newItemId,
        productId: prod._id,
        name: prod.name,
        imageUrl: prod.imageUrl,
        x: 350 + (list.length * 15) % 100,
        y: 250 + (list.length * 15) % 100,
        scale: 0.5,
        rotation: 0,
        opacity: 1,
        flipped: false
      }
    ]);
    this.activeItemId.set(newItemId);
  }

  updateActiveItem(prop: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    this.placedItems.update((list) =>
      list.map((item) =>
        item.id === this.activeItemId() ? { ...item, [prop]: value } : item
      )
    );
  }

  flipActiveItem(): void {
    this.placedItems.update((list) =>
      list.map((item) =>
        item.id === this.activeItemId() ? { ...item, flipped: !item.flipped } : item
      )
    );
  }

  removeBackground(item: any): void {
    this.showToast('Đang tách nền...');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = item.imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Sample Top-Left corner pixel as the background color
      const targetR = data[0];
      const targetG = data[1];
      const targetB = data[2];

      const threshold = 35; // Safe color distance tolerance to prevent color loss

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 1. Detect distance from Top-Left background corner color
        const dist = Math.sqrt(
          Math.pow(r - targetR, 2) +
          Math.pow(g - targetG, 2) +
          Math.pow(b - targetB, 2)
        );

        // 2. Detect near-white backdrop colors
        const isNearWhite = r > 238 && g > 238 && b > 238;

        if (dist < threshold || isNearWhite) {
          data[i + 3] = 0; // set transparent
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Convert transparency canvas back into base64 data url
      const transparentUrl = canvas.toDataURL('image/png');
      this.placedItems.update((list) =>
        list.map((it) => (it.id === item.id ? { ...it, imageUrl: transparentUrl } : it))
      );
      this.showToast(`Đã xóa nền sạch cho "${item.name}"`);
    };
    img.onerror = () => {
      this.showToast('Không thể tách nền từ nguồn ảnh này.');
    };
  }

  deleteActiveItem(): void {
    const currentActiveId = this.activeItemId();
    this.placedItems.update((list) =>
      list.filter((item) => item.id !== currentActiveId)
    );
    this.activeItemId.set(null);
  }

  // 2D Drag-and-drop operations
  onDragStart(event: MouseEvent | TouchEvent, item: any): void {
    // Only allow dragging in 2D mode
    if (this.viewMode() !== '2d') return;

    this.activeItemId.set(item.id);
    this.draggingItem = item;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.itemStartX = item.x;
    this.itemStartY = item.y;

    event.preventDefault();
  }

  onDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.draggingItem || this.viewMode() !== '2d') return;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const dx = clientX - this.dragStartX;
    const dy = clientY - this.dragStartY;

    const nextX = this.itemStartX + dx;
    const nextY = this.itemStartY + dy;

    this.placedItems.update((list) =>
      list.map((item) =>
        item.id === this.draggingItem.id ? { ...item, x: nextX, y: nextY } : item
      )
    );
  }

  onDragEnd(): void {
    this.draggingItem = null;
  }

  toggleFavorite(): void {
    const p = this.product();
    if (!p) return;
    const added = this.favorites.toggle({
      productId: p._id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl ?? this.activeImage()
    });
    this.showToast(added ? `Đã thêm "${p.name}" vào danh sách yêu thích!` : `Đã xóa "${p.name}" khỏi danh sách yêu thích!`);
  }

  // Dynamic Three.js 3D Cylindrical Panorama (Fixes warping & rotation issues)
  private initThree3d(): void {
    this.destroyThree3d();

    // Check if Three.js script already loaded in browser
    if (typeof (window as any).THREE === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => this.setupThreeScene();
      document.head.appendChild(script);
    } else {
      this.setupThreeScene();
    }
  }

  private setupThreeScene(): void {
    const THREE = (window as any).THREE;
    const container = this.container3d.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.threeScene = new THREE.Scene();

    // Setup perspective camera looking straight at center of cylinder
    this.threeCamera = new THREE.PerspectiveCamera(55, width / height, 1, 2000);
    
    // Reset Orbit rotation variables
    this.theta = 0;
    this.phi = Math.PI / 2;

    this.updateCameraOrbitPosition();

    // 1. Create an open-ended Cylinder instead of a sphere to wrap 360° without warping poles
    const geometry = new THREE.CylinderGeometry(500, 500, 750, 60, 1, true);
    geometry.scale(-1, 1, 1); // invert cylinder so texture displays on the inside

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    const activeRoom = this.sampleRooms.find((r) => r.id === this.selectedRoomId()) || this.sampleRooms[0];
    const textureUrl = this.customRoomImage() || activeRoom.pano;
    const material = new THREE.MeshBasicMaterial({
      map: textureLoader.load(textureUrl),
      side: THREE.DoubleSide,
      depthWrite: false // Prevents the cylinder wall from clipping overlay furniture planes
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.threeScene.add(mesh);

    // 2. Create standing plane meshes for each placed furniture item
    const items = this.placedItems();
    items.forEach((item) => {
      // Map the 2D layout coordinates horizontally onto the cylinder walls (360° circle wrapping)
      const angle = ((item.x - width / 2) / width) * Math.PI * 2;
      
      // Position slightly inside the cylinder walls (radius 500)
      const posX = 490 * Math.sin(angle);
      const posZ = -490 * Math.cos(angle);
      const posY = -(item.y - height / 2) * 1.35; // scale Y slightly for height perspective

      const size = 200 * item.scale;
      const itemGeometry = new THREE.PlaneGeometry(size, size);

      const itemTexture = textureLoader.load(item.imageUrl);
      const itemMaterial = new THREE.MeshBasicMaterial({
        map: itemTexture,
        transparent: true,
        side: THREE.DoubleSide
      });
      const itemMesh = new THREE.Mesh(itemGeometry, itemMaterial);

      itemMesh.position.set(posX, posY, posZ);

      // Apply Z-axis rotation
      itemMesh.rotation.z = THREE.MathUtils.degToRad(-item.rotation);
      
      // Apply flip
      if (item.flipped) {
        itemMesh.scale.x = -1;
      }

      // Mark this mesh as dynamic furniture so it stays facing the camera
      (itemMesh as any).isFurniture = true;

      this.threeScene.add(itemMesh);
    });

    this.threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.threeRenderer.setPixelRatio(window.devicePixelRatio);
    this.threeRenderer.setSize(width, height);
    container.appendChild(this.threeRenderer.domElement);

    // Bind event listeners for dragging rotation 360°
    container.addEventListener('mousedown', this.onThreeDragStart.bind(this), false);
    container.addEventListener('mousemove', this.onThreeDragMove.bind(this), false);
    container.addEventListener('mouseup', this.onThreeDragEnd.bind(this), false);
    container.addEventListener('mouseleave', this.onThreeDragEnd.bind(this), false);

    // Touch events for mobile
    container.addEventListener('touchstart', this.onThreeTouchStart.bind(this), false);
    container.addEventListener('touchmove', this.onThreeTouchMove.bind(this), false);
    container.addEventListener('touchend', this.onThreeDragEnd.bind(this), false);

    // Window resize
    window.addEventListener('resize', this.onThreeResize.bind(this), false);

    this.animateThreeParallax();
  }

  private updateCameraOrbitPosition(): void {
    const radius = 500;
    // Set target look at target vector based on angles
    this.lat = Math.max(-85, Math.min(85, this.lat));
    const THREE = (window as any).THREE;
    
    this.phi = THREE.MathUtils.degToRad(90 - this.lat);
    this.theta = THREE.MathUtils.degToRad(this.lon);

    const x = radius * Math.sin(this.phi) * Math.sin(this.theta);
    const y = radius * Math.cos(this.phi);
    const z = -radius * Math.sin(this.phi) * Math.cos(this.theta);

    this.threeCamera.lookAt(x, y, z);
  }

  private onThreeDragStart(event: MouseEvent): void {
    this.isUserInteracting = true;
    this.onPointerDownMouseX = event.clientX;
    this.onPointerDownMouseY = event.clientY;
    this.onPointerDownLon = this.lon;
    this.onPointerDownLat = this.lat;
  }

  private onThreeDragMove(event: MouseEvent): void {
    if (!this.isUserInteracting) return;

    const dx = event.clientX - this.onPointerDownMouseX;
    const dy = event.clientY - this.onPointerDownMouseY;

    // Rotate camera yaw and pitch
    this.lon = this.onPointerDownLon - dx * 0.15;
    this.lat = this.onPointerDownLat - dy * 0.15;
  }

  private onThreeDragEnd(): void {
    this.isUserInteracting = false;
  }

  private onThreeTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isUserInteracting = true;
      this.onPointerDownMouseX = event.touches[0].clientX;
      this.onPointerDownMouseY = event.touches[0].clientY;
      this.onPointerDownLon = this.lon;
      this.onPointerDownLat = this.lat;
    }
  }

  private onThreeTouchMove(event: TouchEvent): void {
    if (!this.isUserInteracting || event.touches.length !== 1) return;

    const dx = event.touches[0].clientX - this.onPointerDownMouseX;
    const dy = event.touches[0].clientY - this.onPointerDownMouseY;

    this.lon = this.onPointerDownLon - dx * 0.25;
    this.lat = this.onPointerDownLat - dy * 0.25;
  }

  private animateThreeParallax(): void {
    if (!this.threeRenderer) return;

    this.animationFrameId = requestAnimationFrame(() => this.animateThreeParallax());

    // Update camera target orientation
    this.updateCameraOrbitPosition();

    // Billboarding: Make furniture face the central camera directly during yaw/pitch rotation
    this.threeScene.children.forEach((child: any) => {
      if (child.isFurniture) {
        // Look directly at camera center
        child.lookAt(this.threeCamera.position);
      }
    });

    this.threeRenderer.render(this.threeScene, this.threeCamera);
  }

  private onThreeResize(): void {
    if (!this.threeRenderer || !this.container3d) return;
    const container = this.container3d.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.threeCamera.aspect = width / height;
    this.threeCamera.updateProjectionMatrix();
    this.threeRenderer.setSize(width, height);
  }

  private destroyThree3d(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.threeRenderer) {
      this.threeRenderer.dispose();
      const dom = this.threeRenderer.domElement;
      if (dom && dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
      this.threeRenderer = null;
    }
    this.threeScene = null;
    this.threeCamera = null;
  }
}
