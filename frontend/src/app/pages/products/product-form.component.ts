import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CatalogCollectionRow, CategoryRow, ProductRow } from '../../core/models/admin-list.models';
import { compressImageFile } from '../../core/utils/compress-image';
import { slugify } from '../../core/utils/slugify';
import { productSectionCrumbs } from '../../shared/admin-product-section.config';
import { PriceFormatDirective } from '../../shared/directives/price-format.directive';

interface VariantDraft {
  localId: string;
  size: string;
  material: string;
  color: string;
  sku: string;
  price: number | null;
  salePrice: number | null;
  stock: number | null;
  imagePreview: string;
  imageSize?: string;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PriceFormatDirective],
  template: `
    <div class="product-form-page">
      <header class="form-page-head">
        <nav class="catalog-crumbs" aria-label="Breadcrumb">
          @for (crumb of breadcrumbs; track crumb.label; let last = $last) {
            @if (!last && crumb.route) {
              <a [routerLink]="crumb.route">{{ crumb.label }}</a>
            } @else if (!last) {
              <span>{{ crumb.label }}</span>
            } @else {
              <span class="current">{{ crumb.label }}</span>
            }
            @if (!last) {
              <span class="sep">›</span>
            }
          }
        </nav>
        <h1>{{ pageTitle() }}</h1>
      </header>

      @if (loadError()) {
        <div class="form-alert error">{{ loadError() }}</div>
      }

      <form class="form-layout" (ngSubmit)="submit(publishOnSave())" novalidate>
        <div class="form-main">
          <section class="form-card">
            <h2 class="card-title">Thông tin cơ bản</h2>

            <div class="field-row field-row--2">
              <label class="field">
                <span class="label">Tên sản phẩm <em>*</em></span>
                <input
                  type="text"
                  name="name"
                  [(ngModel)]="name"
                  (ngModelChange)="onNameChange($event)"
                  placeholder="Nhập tên sản phẩm"
                  [class.has-error]="fieldErrors()['name']"
                />
                @if (fieldErrors()['name']) {
                  <span class="field-error-msg">{{ fieldErrors()['name'] }}</span>
                }
              </label>
              <label class="field">
                <span class="label">Slug <em>*</em></span>
                <input
                  type="text"
                  name="slug"
                  [(ngModel)]="slug"
                  (ngModelChange)="slugTouched = true"
                  placeholder="ten-san-pham"
                  [class.has-error]="fieldErrors()['slug']"
                />
                @if (fieldErrors()['slug']) {
                  <span class="field-error-msg">{{ fieldErrors()['slug'] }}</span>
                } @else {
                  <span class="hint">Tự sinh từ tên, có thể sửa.</span>
                }
              </label>
            </div>

            <div class="field-row field-row--3">
              <label class="field">
                <span class="label">Danh mục <em>*</em></span>
                <select name="categoryId" [(ngModel)]="categoryId" [class.has-error]="fieldErrors()['categoryId']">
                  <option value="">-- Chọn danh mục --</option>
                  @for (c of categories(); track c._id) {
                    <option [value]="c._id">{{ c.name }}</option>
                  }
                </select>
                @if (fieldErrors()['categoryId']) {
                  <span class="field-error-msg">{{ fieldErrors()['categoryId'] }}</span>
                }
              </label>
              <label class="field">
                <span class="label">Bộ sưu tập</span>
                <select name="collection" [(ngModel)]="collection">
                  <option value="">-- Chọn bộ sưu tập --</option>
                  @for (col of collections(); track col._id) {
                    <option [value]="col.name">{{ col.name }}</option>
                  }
                </select>
              </label>
              <label class="field">
                <span class="label">Trạng thái</span>
                <select name="visibility" [(ngModel)]="visibility">
                  <option value="visible">Hiển thị</option>
                  <option value="hidden">Ẩn</option>
                </select>
              </label>
            </div>

            <label class="field">
              <span class="label">Mô tả ngắn</span>
              <textarea
                name="shortDescription"
                [(ngModel)]="shortDescription"
                rows="3"
                maxlength="255"
                placeholder="Nhập mô tả ngắn gọn về sản phẩm..."
              ></textarea>
              <span class="char-count">{{ shortDescription.length }}/255</span>
            </label>

            <label class="field">
              <span class="label">Mô tả chi tiết</span>
              <div class="rte-toolbar" role="toolbar" aria-label="Định dạng văn bản">
                <button type="button" (click)="wrapDetail('**')">B</button>
                <button type="button" (click)="wrapDetail('_')">I</button>
                <button type="button" (click)="wrapDetail('\n- ')">• List</button>
              </div>
              <textarea
                #detailArea
                name="longDescription"
                [(ngModel)]="longDescription"
                rows="8"
                class="rte-area"
                placeholder="Nhập mô tả chi tiết sản phẩm..."
              ></textarea>
            </label>
          </section>

          <section class="form-card">
            <div class="card-head-row">
              <h2 class="card-title">Biến thể sản phẩm</h2>
              <button type="button" class="btn-action secondary" (click)="addVariant()">+ Thêm biến thể</button>
            </div>
            <p class="card-desc">
              Thêm các biến thể (màu sắc, kích thước, chất liệu...) và giá bán tương ứng.
            </p>

            @if (!variants.length) {
              <div class="empty-variants">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                </svg>
                <p>Chưa có biến thể nào. Nhấn "Thêm biến thể" để tạo.</p>
              </div>
            } @else {
              <div class="variant-table-wrap">
                <table class="variant-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Kích thước</th>
                      <th>Chất liệu</th>
                      <th>Màu sắc</th>
                      <th>SKU</th>
                      <th>Giá gốc (đ)</th>
                      <th>Giá KM (đ)</th>
                      <th>Tồn kho</th>
                      <th>Hình ảnh</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (v of variants; track v.localId; let i = $index) {
                      <tr>
                        <td>{{ i + 1 }}</td>
                        <td><input type="text" [(ngModel)]="v.size" [name]="'size_' + v.localId" /></td>
                        <td><input type="text" [(ngModel)]="v.material" [name]="'mat_' + v.localId" /></td>
                        <td><input type="text" [(ngModel)]="v.color" [name]="'color_' + v.localId" /></td>
                        <td>
                          <input type="text" [(ngModel)]="v.sku" [name]="'sku_' + v.localId" [class.has-error]="fieldErrors()['variant_sku_' + v.localId]" />
                          @if (fieldErrors()['variant_sku_' + v.localId]) {
                            <span class="field-error-msg">{{ fieldErrors()['variant_sku_' + v.localId] }}</span>
                          }
                        </td>
                        <td>
                          <input type="text" inputmode="numeric" appPriceFormat [(ngModel)]="v.price" [name]="'price_' + v.localId" [class.has-error]="fieldErrors()['variant_price_' + v.localId]" />
                          @if (fieldErrors()['variant_price_' + v.localId]) {
                            <span class="field-error-msg">{{ fieldErrors()['variant_price_' + v.localId] }}</span>
                          }
                        </td>
                        <td><input type="text" inputmode="numeric" appPriceFormat [(ngModel)]="v.salePrice" [name]="'sale_' + v.localId" /></td>
                        <td><input type="number" min="0" [(ngModel)]="v.stock" [name]="'stock_' + v.localId" /></td>
                        <td>
                          <label class="variant-img-btn">
                            <input
                              type="file"
                              accept="image/*"
                              class="sr-only"
                              (change)="onVariantImage($event, v)"
                            />
                            @if (v.imagePreview) {
                              <img [src]="v.imagePreview" alt="" />
                            } @else {
                              <span>+</span>
                            }
                          </label>
                          @if (v.imageSize) {
                            <span class="file-size-badge">{{ v.imageSize }}</span>
                          }
                          @if (fieldErrors()['variant_image_' + v.localId]) {
                            <span class="field-error-msg">{{ fieldErrors()['variant_image_' + v.localId] }}</span>
                          }
                        </td>
                        <td>
                          <button type="button" class="icon-round danger" (click)="removeVariant(v.localId)" title="Xóa">
                            ×
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            @if (!variants.length) {
              <div class="base-price-row field-row field-row--3">
                <label class="field">
                  <span class="label">SKU sản phẩm <em>*</em></span>
                  <input type="text" name="baseSku" [(ngModel)]="baseSku" placeholder="VD: SOFA-001" [class.has-error]="fieldErrors()['baseSku']" />
                  @if (fieldErrors()['baseSku']) {
                    <span class="field-error-msg">{{ fieldErrors()['baseSku'] }}</span>
                  }
                </label>
                <label class="field">
                  <span class="label">Giá gốc (đ) <em>*</em></span>
                  <input type="text" inputmode="numeric" appPriceFormat name="basePrice" [(ngModel)]="basePrice" placeholder="0" [class.has-error]="fieldErrors()['basePrice']" />
                  @if (fieldErrors()['basePrice']) {
                    <span class="field-error-msg">{{ fieldErrors()['basePrice'] }}</span>
                  }
                </label>
                <label class="field">
                  <span class="label">Tồn kho</span>
                  <input type="number" min="0" name="baseStock" [(ngModel)]="baseStock" />
                </label>
              </div>
            } @else {
              <p class="variant-note">
                Mỗi biến thể cần <strong>SKU</strong> và <strong>giá gốc &gt; 0</strong>. SKU sản phẩm cha:
                <code>{{ masterSku() }}</code>
              </p>
            }
          </section>
        </div>

        <aside class="form-side">
          <section class="form-card">
            <h2 class="card-title">Ảnh sản phẩm</h2>

            <div class="field">
              <span class="label">Ảnh đại diện <em>*</em></span>
              <div
                class="upload-zone"
                [class.has-image]="mainImagePreview"
                [class.has-error]="fieldErrors()['mainImage']"
                (dragover)="onDragOver($event)"
                (drop)="onMainDrop($event)"
              >
                @if (mainImagePreview) {
                  <div class="main-preview-container">
                    <img [src]="mainImagePreview" alt="Ảnh đại diện" class="upload-preview" />
                    @if (mainImageSize()) {
                      <div class="image-size-overlay">{{ mainImageSize() }}</div>
                    }
                  </div>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  <p>Kéo thả ảnh vào đây hoặc</p>
                }
                <label class="btn-action secondary upload-btn">
                  Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    class="sr-only"
                    (change)="onMainFile($event)"
                  />
                </label>
                <span class="hint">JPG, PNG, WEBP — tự nén trước khi lưu (tối đa ~8MB gốc).</span>
              </div>
              @if (fieldErrors()['mainImage']) {
                <span class="field-error-msg">{{ fieldErrors()['mainImage'] }}</span>
              }
              <input
                type="url"
                class="url-fallback"
                name="mainImageUrl"
                [(ngModel)]="mainImageUrl"
                (ngModelChange)="onMainUrlChange()"
                placeholder="Hoặc dán URL ảnh..."
              />
            </div>

            <div class="field">
              <span class="label">Ảnh thư viện</span>
              @if (fieldErrors()['gallery']) {
                <span class="field-error-msg" style="margin-bottom: 0.5rem;">{{ fieldErrors()['gallery'] }}</span>
              }
              <div class="gallery-grid">
                @for (img of galleryPreviews; track $index; let i = $index) {
                  <div class="gallery-item">
                    <img [src]="img.url" alt="" />
                    @if (img.size) {
                      <span class="gallery-size-info">{{ img.size }}</span>
                    }
                    <button type="button" class="gallery-remove" (click)="removeGallery(i)">×</button>
                  </div>
                }
                <label class="gallery-add">
                  <span>+</span>
                  <small>Thêm ảnh</small>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    class="sr-only"
                    (change)="onGalleryFiles($event)"
                  />
                </label>
              </div>
              <span class="hint">Có thể chọn nhiều ảnh. Kéo để sắp xếp thứ tự (sắp xếp sẽ bổ sung sau).</span>
            </div>
          </section>

          <section class="form-card">
            <h2 class="card-title">Thông tin khác</h2>
            <label class="field">
              <span class="label">Thương hiệu</span>
              <select name="brand" [(ngModel)]="brand">
                <option value="">-- Chọn thương hiệu --</option>
                <option value="Mộc Home">Mộc Home</option>
                <option value="Japandi Living">Japandi Living</option>
                <option value="Nội thất Việt">Nội thất Việt</option>
              </select>
            </label>
            <label class="field">
              <span class="label">Xuất xứ</span>
              <input type="text" name="origin" [(ngModel)]="origin" placeholder="Nhập xuất xứ" />
            </label>
            <label class="field">
              <span class="label">Bảo hành</span>
              <input type="text" name="warranty" [(ngModel)]="warranty" placeholder="Nhập thông tin bảo hành" />
            </label>
          </section>
        </aside>

        @if (saveError()) {
          <div class="form-alert error form-alert--full">{{ saveError() }}</div>
        }

        <footer class="form-footer">
          <a routerLink="/admin/products" class="btn-action secondary">Hủy</a>
          <div class="form-footer-end">
            <button type="button" class="btn-action secondary" [disabled]="saving()" (click)="submit(false)">
              Lưu nháp
            </button>
            <button type="submit" class="btn-action primary" [disabled]="saving()">
              {{ saving() ? 'Đang lưu...' : 'Lưu và xuất bản' }}
            </button>
          </div>
        </footer>
      </form>
    </div>
  `,
  styles: [
    `
      .product-form-page {
        width: 100%;
        max-width: none;
        padding-bottom: 5rem;
      }

      .form-page-head {
        margin-bottom: 1.25rem;
      }

      .form-page-head h1 {
        margin: 0.5rem 0 0;
        font-size: 1.375rem;
        font-weight: 600;
      }

      .catalog-crumbs {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.8125rem;
        color: var(--muted);
      }

      .catalog-crumbs a:hover {
        color: var(--text);
      }

      .catalog-crumbs .current {
        color: var(--text);
        font-weight: 500;
      }

      .sep {
        color: #c5c9d0;
      }

      .form-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(380px, 28%);
        gap: 1.5rem;
        align-items: start;
        width: 100%;
      }

      .form-main {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .form-side {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .form-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 1.35rem 1.5rem;
        box-shadow: var(--shadow-sm);
      }

      .card-title {
        margin: 0 0 1rem;
        font-size: 0.9375rem;
        font-weight: 600;
      }

      .card-head-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.35rem;
      }

      .card-head-row .card-title {
        margin: 0;
      }

      .card-desc {
        margin: 0 0 1rem;
        font-size: 0.8125rem;
        color: var(--muted);
      }

      .field {
        display: block;
        margin-bottom: 1rem;
      }

      .label {
        display: block;
        margin-bottom: 0.35rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      .label em {
        color: #dc2626;
        font-style: normal;
      }

      .field input[type='text'],
      .field input[type='url'],
      .field input[type='number'],
      .field select,
      .field textarea {
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.8125rem;
        background: var(--surface);
      }

      .field textarea {
        resize: vertical;
        min-height: 80px;
      }

      .field input:focus,
      .field select:focus,
      .field textarea:focus {
        outline: none;
        border-color: #9ca3af;
        box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.12);
      }

      .hint {
        display: block;
        margin-top: 0.35rem;
        font-size: 0.75rem;
        color: var(--muted);
      }

      .char-count {
        display: block;
        text-align: right;
        font-size: 0.75rem;
        color: var(--muted);
        margin-top: 0.25rem;
      }

      .field-row {
        display: grid;
        gap: 0.75rem;
      }

      .field-row--2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .field-row--3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .variant-note {
        margin: 0.75rem 0 0;
        padding: 0.65rem 0.85rem;
        font-size: 0.8125rem;
        color: var(--text-secondary);
        background: #f9fafb;
        border: 1px solid var(--border-light);
        border-radius: 8px;
      }

      .variant-note code {
        font-size: 0.75rem;
        padding: 0.1rem 0.35rem;
        background: #fff;
        border-radius: 4px;
      }

      .rte-toolbar {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 0.35rem;
        padding: 0.35rem;
        border: 1px solid var(--border);
        border-bottom: none;
        border-radius: 8px 8px 0 0;
        background: #fafbfc;
      }

      .rte-toolbar button {
        min-width: 32px;
        height: 28px;
        padding: 0 0.5rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: #fff;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
      }

      .rte-area {
        border-radius: 0 0 8px 8px !important;
      }

      .upload-zone {
        border: 2px dashed var(--border);
        border-radius: 10px;
        padding: 1.5rem 1rem;
        text-align: center;
        background: #fafbfc;
      }

      .upload-zone.has-image {
        padding: 0.5rem;
      }

      .upload-zone svg {
        width: 40px;
        height: 40px;
        color: var(--muted);
        margin-bottom: 0.5rem;
      }

      .upload-zone p {
        margin: 0 0 0.75rem;
        font-size: 0.8125rem;
        color: var(--muted);
      }

      .upload-preview {
        max-width: 100%;
        max-height: 200px;
        object-fit: contain;
        border-radius: 8px;
      }

      .upload-btn {
        margin-bottom: 0.5rem;
        cursor: pointer;
      }

      .url-fallback {
        margin-top: 0.5rem;
      }

      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
      }

      .gallery-item {
        position: relative;
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--border);
      }

      .gallery-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .gallery-remove {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 22px;
        height: 22px;
        border: none;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.55);
        color: #fff;
        cursor: pointer;
        line-height: 1;
      }

      .gallery-add {
        aspect-ratio: 1;
        border: 2px dashed var(--border);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.15rem;
        cursor: pointer;
        background: #fafbfc;
        font-size: 1.25rem;
        color: var(--muted);
      }

      .gallery-add small {
        font-size: 0.6875rem;
      }

      .empty-variants {
        text-align: center;
        padding: 2rem 1rem;
        color: var(--muted);
        border: 1px dashed var(--border);
        border-radius: 8px;
        margin-bottom: 1rem;
      }

      .empty-variants svg {
        width: 40px;
        height: 40px;
        margin-bottom: 0.5rem;
      }

      .variant-table-wrap {
        overflow-x: auto;
        margin-bottom: 1rem;
      }

      .variant-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.75rem;
      }

      .variant-table th,
      .variant-table td {
        padding: 0.5rem;
        border-bottom: 1px solid var(--border-light);
        text-align: left;
      }

      .variant-table th {
        font-weight: 500;
        color: var(--muted);
        white-space: nowrap;
      }

      .variant-table input {
        width: 100%;
        min-width: 72px;
        padding: 0.35rem 0.5rem;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 0.75rem;
      }

      .variant-img-btn {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border: 1px dashed var(--border);
        border-radius: 6px;
        cursor: pointer;
        overflow: hidden;
      }

      .variant-img-btn img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .base-price-row {
        margin-top: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-light);
      }

      .form-footer {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        padding: 1rem 1.25rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        position: sticky;
        bottom: 0.75rem;
        box-shadow: var(--shadow);
      }

      .form-footer-end {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .form-alert {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 0.8125rem;
        margin-bottom: 1rem;
      }

      .form-alert.error {
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fecaca;
      }

      .form-alert--full {
        grid-column: 1 / -1;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }

      @media (min-width: 1600px) {
        .form-layout {
          grid-template-columns: minmax(0, 1fr) minmax(420px, 26%);
        }
      }

      @media (max-width: 1200px) {
        .form-layout {
          grid-template-columns: 1fr;
        }

        .field-row--3 {
          grid-template-columns: 1fr;
        }

        .field-row--2 {
          grid-template-columns: 1fr;
        }

        .gallery-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .field-error-msg {
        color: #dc2626;
        font-size: 0.75rem;
        margin-top: 0.25rem;
        display: block;
      }
      
      .field input.has-error,
      .field select.has-error,
      .field textarea.has-error,
      .upload-zone.has-error {
        border-color: #f87171 !important;
        background-color: #fef2f2 !important;
      }

      .main-preview-container {
        position: relative;
        display: inline-block;
        max-width: 100%;
      }

      .image-size-overlay {
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.75);
        color: #fff;
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 4px;
        pointer-events: none;
        font-family: monospace;
      }

      .gallery-size-info {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.65);
        color: #fff;
        font-size: 0.65rem;
        text-align: center;
        padding: 2px 0;
        pointer-events: none;
        font-family: monospace;
      }

      .file-size-badge {
        display: block;
        font-size: 0.65rem;
        color: var(--muted);
        text-align: center;
        margin-top: 4px;
        font-family: monospace;
      }
    `
  ]
})
export class ProductFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = signal<CategoryRow[]>([]);
  readonly collections = signal<CatalogCollectionRow[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly pageTitle = signal('Thêm sản phẩm mới');
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly mainImageSize = signal<string>('');

  productId: string | null = null;
  slugTouched = false;
  private publishFlag = true;

  breadcrumbs = productSectionCrumbs('Thêm sản phẩm');

  name = '';
  slug = '';
  categoryId = '';
  collection = '';
  visibility: 'visible' | 'hidden' = 'visible';
  shortDescription = '';
  longDescription = '';
  brand = '';
  origin = 'Việt Nam';
  warranty = '';

  mainImagePreview = '';
  mainImageUrl = '';
  galleryPreviews: Array<{ url: string; size?: string }> = [];

  baseSku = '';
  basePrice: number | null = null;
  baseStock: number | null = 0;

  variants: VariantDraft[] = [];

  ngOnInit(): void {
    this.api.list<CategoryRow>('categories').subscribe({
      next: (rows) => this.categories.set(rows)
    });
    this.api.list<CatalogCollectionRow>('collections').subscribe({
      next: (rows) => this.collections.set(rows)
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.productId = id;
      this.pageTitle.set('Chỉnh sửa sản phẩm');
      this.breadcrumbs = productSectionCrumbs('Chỉnh sửa');
      this.loadProduct(id);
    }
  }

  publishOnSave(): boolean {
    return this.publishFlag;
  }

  onNameChange(value: string): void {
    if (!this.slugTouched) {
      this.slug = slugify(value);
    }
    if (!this.baseSku) {
      const base = slugify(value).replace(/-/g, '-').toUpperCase().slice(0, 12);
      this.baseSku = base ? `SP-${base}` : '';
    }
  }

  wrapDetail(wrapper: string): void {
    this.longDescription += wrapper;
  }

  addVariant(): void {
    const n = this.variants.length + 1;
    const master = this.masterSku();
    this.variants.push({
      localId: `v-${Date.now()}-${n}`,
      size: '',
      material: '',
      color: '',
      sku: `${master}-V${n}`,
      price: this.basePrice ?? null,
      salePrice: null,
      stock: this.baseStock ?? 0,
      imagePreview: ''
    });
  }

  masterSku(): string {
    const fromBase = this.baseSku.trim();
    if (fromBase) return fromBase;
    const fromSlug = slugify(this.slug || this.name);
    return fromSlug ? `SP-${fromSlug.toUpperCase().slice(0, 16)}` : 'SP-NEW';
  }

  removeVariant(localId: string): void {
    this.variants = this.variants.filter((v) => v.localId !== localId);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onMainDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.readMainFile(file);
  }

  onMainFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.readMainFile(file);
  }

  onMainUrlChange(): void {
    if (this.mainImageUrl.trim()) {
      this.mainImagePreview = this.mainImageUrl.trim();
    }
  }

  private formatFileSize(sizeInBytes: number): string {
    if (sizeInBytes >= 1024 * 1024) {
      return (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
    return (sizeInBytes / 1024).toFixed(2) + ' KB';
  }

  private readMainFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.fieldErrors.set({ ...this.fieldErrors(), mainImage: 'Tệp tải lên phải là hình ảnh.' });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.fieldErrors.set({ ...this.fieldErrors(), mainImage: 'Ảnh đại diện tối đa 8MB.' });
      return;
    }
    const sizeText = this.formatFileSize(file.size);
    compressImageFile(file)
      .then((dataUrl) => {
        this.mainImagePreview = dataUrl;
        this.mainImageUrl = dataUrl;
        this.mainImageSize.set(sizeText);
        const errs = { ...this.fieldErrors() };
        delete errs['mainImage'];
        this.fieldErrors.set(errs);
        this.saveError.set(null);
      })
      .catch(() => {
        this.fieldErrors.set({ ...this.fieldErrors(), mainImage: 'Không xử lý được ảnh đại diện.' });
      });
  }

  onGalleryFiles(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    const newPreviews = [...this.galleryPreviews];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        this.fieldErrors.set({ ...this.fieldErrors(), gallery: 'Chỉ chấp nhận các tệp hình ảnh.' });
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        this.fieldErrors.set({ ...this.fieldErrors(), gallery: 'Một số ảnh vượt quá 8MB đã bị bỏ qua.' });
        return;
      }
      const sizeText = this.formatFileSize(file.size);
      compressImageFile(file).then((dataUrl) => {
        newPreviews.push({ url: dataUrl, size: sizeText });
        this.galleryPreviews = [...newPreviews];
        const errs = { ...this.fieldErrors() };
        delete errs['gallery'];
        this.fieldErrors.set(errs);
      });
    });
  }

  removeGallery(index: number): void {
    this.galleryPreviews = this.galleryPreviews.filter((_, i) => i !== index);
  }

  onVariantImage(event: Event, variant: VariantDraft): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.fieldErrors.set({ ...this.fieldErrors(), [`variant_image_${variant.localId}`]: 'Phải là ảnh.' });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.fieldErrors.set({ ...this.fieldErrors(), [`variant_image_${variant.localId}`]: 'Tối đa 8MB.' });
      return;
    }
    const sizeText = this.formatFileSize(file.size);
    compressImageFile(file, 640, 0.8).then((dataUrl) => {
      variant.imagePreview = dataUrl;
      variant.imageSize = sizeText;
      const errs = { ...this.fieldErrors() };
      delete errs[`variant_image_${variant.localId}`];
      this.fieldErrors.set(errs);
    });
  }

  private loadProduct(id: string): void {
    this.loading.set(true);
    this.api.get<ProductRow & Record<string, unknown>>('products', id).subscribe({
      next: (p) => {
        this.patchFromProduct(p);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Không tải được sản phẩm.');
        this.loading.set(false);
      }
    });
  }

  private patchFromProduct(p: ProductRow & Record<string, unknown>): void {
    this.name = p.name;
    this.slug = p.slug || slugify(p.name);
    this.slugTouched = true;
    this.categoryId = typeof p.category === 'object' && p.category?._id ? p.category._id : '';
    this.collection = p.collection || '';
    this.visibility = p.isVisible === false ? 'hidden' : 'visible';
    this.shortDescription = String(p['shortDescription'] || p.description || '');
    this.longDescription = String(p['longDescription'] || '');
    this.brand = String(p['brand'] || '');
    this.origin = String(p['origin'] || 'Việt Nam');
    this.warranty = String(p['warranty'] || '');
    this.baseSku = p.sku;
    this.basePrice = p.price;
    this.baseStock = p.stock;
    if (p.imageUrl) {
      this.mainImagePreview = p.imageUrl;
      this.mainImageUrl = p.imageUrl;
    }
    const images = p['images'] as string[] | undefined;
    if (images?.length) {
      this.galleryPreviews = images.filter((u) => u !== p.imageUrl).map(u => ({ url: u }));
    } else {
      this.galleryPreviews = [];
    }
  }

  submit(publish: boolean): void {
    this.publishFlag = publish;
    this.saveError.set(null);
    const errors: Record<string, string> = {};

    if (!this.name.trim()) {
      errors['name'] = 'Vui lòng nhập tên sản phẩm.';
    }
    if (!this.slug.trim()) {
      errors['slug'] = 'Vui lòng nhập slug.';
    }
    if (!this.categoryId) {
      errors['categoryId'] = 'Vui lòng chọn danh mục.';
    }
    if (!this.mainImagePreview && !this.mainImageUrl.trim()) {
      errors['mainImage'] = 'Vui lòng thêm ảnh đại diện.';
    }

    const productSku = this.masterSku();
    let price = Number(this.basePrice) || 0;
    let stock = Number(this.baseStock) || 0;

    if (this.variants.length) {
      this.variants.forEach((v) => {
        if (!String(v.sku || '').trim()) {
          errors[`variant_sku_${v.localId}`] = 'Vui lòng nhập SKU biến thể.';
        }
        if (v.price == null || Number(v.price) <= 0) {
          errors[`variant_price_${v.localId}`] = 'Giá gốc phải > 0.';
        }
      });
      const skus = this.variants.map((v) => v.sku.trim().toUpperCase());
      if (new Set(skus).size !== skus.length) {
        const seen = new Set<string>();
        this.variants.forEach((v) => {
          const s = v.sku.trim().toUpperCase();
          if (seen.has(s)) {
            errors[`variant_sku_${v.localId}`] = 'SKU biến thể bị trùng.';
          }
          seen.add(s);
        });
      }
      price = Number(this.variants[0].price) || 0;
      stock = this.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
    } else {
      if (!productSku) {
        errors['baseSku'] = 'Vui lòng nhập SKU sản phẩm.';
      }
      if (price <= 0) {
        errors['basePrice'] = 'Giá gốc phải lớn hơn 0.';
      }
    }

    this.fieldErrors.set(errors);

    if (Object.keys(errors).length > 0) {
      this.saveError.set('Vui lòng sửa các lỗi nhập liệu bên dưới.');
      return;
    }

    const imageUrl = this.mainImagePreview || this.mainImageUrl.trim();
    const images = [imageUrl, ...this.galleryPreviews.map(g => g.url)].filter(Boolean);

    const payload = {
      name: this.name.trim(),
      slug: slugify(this.slug),
      sku: productSku,
      price,
      stock,
      category: this.categoryId,
      collection: this.collection,
      isVisible: publish ? this.visibility === 'visible' : false,
      description: this.shortDescription,
      shortDescription: this.shortDescription,
      longDescription: this.longDescription,
      imageUrl,
      images,
      brand: this.brand,
      origin: this.origin,
      warranty: this.warranty,
      material: this.variants[0]?.material || '',
      saleStatus: stock === 0 ? 'out_of_stock' : 'selling'
    };

    this.saving.set(true);

    const afterSave = (productId: string) => {
      if (!this.variants.length) {
        this.saving.set(false);
        this.router.navigate(['/admin/products']);
        return;
      }

      const creates = this.variants.map((v) =>
        this.api.create('variants', {
          product: productId,
          sku: v.sku.trim(),
          name: [this.name, v.size, v.color].filter(Boolean).join(' — '),
          price: Number(v.price),
          stock: Number(v.stock) || 0,
          attributes: { color: v.color, size: v.size, material: v.material },
          isActive: publish
        })
      );

      let done = 0;
      let failed = false;
      creates.forEach((req) =>
        req.subscribe({
          next: () => {
            done += 1;
            if (done === creates.length && !failed) {
              this.saving.set(false);
              this.router.navigate(['/admin/products']);
            }
          },
          error: (err) => {
            failed = true;
            this.saving.set(false);
            this.saveError.set(
              err?.error?.message || 'Sản phẩm đã lưu nhưng không tạo được biến thể (kiểm tra SKU trùng).'
            );
          }
        })
      );
    };

    const resolveId = (row: ProductRow & Record<string, unknown>) =>
      String(row._id ?? row['id'] ?? '');

    if (this.productId) {
      this.api.update<ProductRow>('products', this.productId, payload).subscribe({
        next: () => afterSave(this.productId!),
        error: (err) => {
          this.saving.set(false);
          const msg = String(err?.error?.message || '');
          if (err?.status === 413 || /too large|entity too large/i.test(msg)) {
            this.saveError.set(
              'Ảnh hoặc dữ liệu quá lớn — hãy dùng ảnh nhỏ hơn hoặc dán URL ảnh thay vì file nặng.'
            );
            return;
          }
          this.saveError.set(msg || 'Không thể cập nhật sản phẩm.');
        }
      });
    } else {
      this.api.create<ProductRow>('products', payload).subscribe({
        next: (created) => {
          const id = resolveId(created as ProductRow & Record<string, unknown>);
          if (!id) {
            this.saving.set(false);
            this.saveError.set('Tạo sản phẩm thành công nhưng thiếu mã sản phẩm — không lưu được biến thể.');
            return;
          }
          afterSave(id);
        },
        error: (err) => {
          this.saving.set(false);
          const msg = String(err?.error?.message || '');
          if (err?.status === 413 || /too large|entity too large/i.test(msg)) {
            this.saveError.set(
              'Ảnh hoặc dữ liệu quá lớn — hãy dùng ảnh nhỏ hơn hoặc dán URL ảnh thay vì file nặng.'
            );
            return;
          }
          if (/duplicate|E11000|unique/i.test(msg)) {
            this.saveError.set('SKU hoặc slug đã tồn tại — vui lòng đổi SKU/slug khác.');
          } else {
            this.saveError.set(msg || 'Không thể tạo sản phẩm.');
          }
        }
      });
    }
  }
}
