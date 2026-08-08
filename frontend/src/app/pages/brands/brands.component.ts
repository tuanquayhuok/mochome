import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { slugify } from '../../core/utils/slugify';
import { compressImageFile } from '../../core/utils/compress-image';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';

export interface BrandRow {
  _id: string;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
}

export interface ProductSummary {
  _id: string;
  name: string;
  sku: string;
  brand: string;
}

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Thương hiệu"
      subtitle="Quản lý và thiết lập đối tác cung cấp nội thất"
      [breadcrumbs]="crumbs"
    >
      <button catalogActions type="button" class="btn-action primary" (click)="openCreate()">
        + Thêm thương hiệu
      </button>

      <div pageToolbar class="catalog-filter-bar catalog-filter-bar--simple">
        <div class="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Tìm thương hiệu..."
            [ngModel]="search()"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>
        @if (rows().length) {
          <p class="toolbar-meta muted">{{ rows().length }} thương hiệu</p>
        }
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải thương hiệu...</div>
      } @else if (!rows().length) {
        <div class="page-state">
          Chưa có thương hiệu nào.
          <button type="button" class="btn-action primary state-action" (click)="openCreate()">
            + Thêm thương hiệu đầu tiên
          </button>
        </div>
      } @else {
        @if (!filtered().length) {
          <div class="page-state">Không tìm thấy thương hiệu phù hợp bộ lọc.</div>
        } @else {
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Logo</th>
                  <th>Tên thương hiệu</th>
                  <th>Slug</th>
                  <th>Mô tả</th>
                  <th>Trạng thái</th>
                  <th class="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (item of paged(); track item._id; let i = $index) {
                  <tr>
                    <td class="cell-muted">{{ rowIndex(i) }}</td>
                    <td>
                      @if (item.logoUrl) {
                        <img [src]="item.logoUrl" class="brand-logo-img" alt="{{ item.name }}" />
                      } @else {
                        <div class="brand-logo-fallback">{{ item.name.substring(0, 2).toUpperCase() }}</div>
                      }
                    </td>
                    <td class="cell-strong">{{ item.name }}</td>
                    <td class="cell-muted">{{ item.slug }}</td>
                    <td>{{ item.description || '—' }}</td>
                    <td>
                      <button
                        type="button"
                        class="badge-toggle"
                        [class.active]="item.isActive"
                        (click)="toggleStatus(item)"
                        title="Bật/Tắt trạng thái"
                      >
                        {{ item.isActive ? 'Hoạt động' : 'Tắt' }}
                      </button>
                    </td>
                    <td class="col-actions">
                      <div class="icon-actions">
                        <button type="button" class="icon-round" title="Sửa" (click)="openEdit(item)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button type="button" class="icon-round delete" title="Xóa" (click)="remove(item)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (maxPages() > 1) {
            <div class="pagination-footer">
              <button [disabled]="currentPage() === 1" (click)="currentPage.set(currentPage() - 1)">Trang trước</button>
              <span>Trang {{ currentPage() }} / {{ maxPages() }}</span>
              <button [disabled]="currentPage() === maxPages()" (click)="currentPage.set(currentPage() + 1)">Trang sau</button>
            </div>
          }
        }
      }

      <!-- Modal Dialog -->
      @if (modalOpen()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-container" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingId() ? 'Cập Nhật Thương Hiệu' : 'Thêm Thương Hiệu Mới' }}</h2>
              <button class="modal-close-btn" (click)="closeModal()">×</button>
            </div>

            <form [formGroup]="form" (ngSubmit)="save()" class="modal-form">
              @if (formError()) {
                <div class="form-error-alert">{{ formError() }}</div>
              }

              <div class="form-group">
                <label for="brand-name">Tên thương hiệu <span class="required">*</span></label>
                <input
                  id="brand-name"
                  type="text"
                  formControlName="name"
                  placeholder="Nhập tên thương hiệu (Ví dụ: An Cường)"
                  (input)="onNameInput()"
                />
                @if (form.get('name')?.touched && form.get('name')?.invalid) {
                  <span class="field-error">Vui lòng nhập tên thương hiệu hợp lệ (tối thiểu 2 ký tự).</span>
                }
              </div>

              <div class="form-group">
                <label for="brand-slug">Slug <span class="required">*</span></label>
                <input id="brand-slug" type="text" formControlName="slug" placeholder="slug-thuong-hieu" />
              </div>

              <!-- Upload Logo Section -->
              <div class="form-group">
                <label>Logo thương hiệu</label>
                <div class="logo-upload-box">
                  <div class="logo-preview-area">
                    @if (form.get('logoUrl')?.value) {
                      <img [src]="form.get('logoUrl')?.value" class="preview-img" alt="Logo preview" />
                      <button type="button" class="btn-remove-logo" (click)="removeUploadedLogo()">Gỡ bỏ</button>
                    } @else {
                      <div class="upload-placeholder">Chưa có logo</div>
                    }
                  </div>
                  <div class="upload-control">
                    <input
                      type="file"
                      accept="image/*"
                      id="logo-file-input"
                      style="display:none;"
                      (change)="onFileSelected($event)"
                    />
                    <label for="logo-file-input" class="btn-action secondary pointer-label">Chọn tệp ảnh...</label>
                    <p class="muted-note">Định dạng ảnh PNG, JPG. Sẽ được tự động nén.</p>
                  </div>
                </div>
              </div>

              <!-- Status Toggle -->
              <div class="form-group checkbox-group" style="justify-content: center;">
                <label>Trạng thái</label>
                <label class="toggle-switch-label" style="margin-top: 0.5rem;">
                  <input type="checkbox" formControlName="isActive" />
                  <span class="toggle-slider"></span>
                  Trạng thái hoạt động
                </label>
              </div>

              <div class="form-group full-width">
                <label for="brand-desc">Mô tả</label>
                <textarea
                  id="brand-desc"
                  formControlName="description"
                  rows="3"
                  placeholder="Nhập vài câu mô tả về thương hiệu..."
                ></textarea>
              </div>

              <!-- Products Association -->
              <div class="form-group full-width">
                <label>Gắn sản phẩm vào thương hiệu này</label>
                <p class="muted-note" style="margin-bottom: 0.5rem;">Chọn các sản phẩm thuộc quyền phân phối của thương hiệu này.</p>
                <div class="products-selection-list">
                  <input
                    type="text"
                    placeholder="Tìm nhanh sản phẩm để gắn..."
                    [(ngModel)]="productFilterSearch"
                    [ngModelOptions]="{standalone: true}"
                    class="prod-search-input"
                  />
                  <div class="checkbox-list-scroll">
                    @for (prod of filteredProducts(); track prod._id) {
                      <label class="prod-checkbox-row">
                        <input
                          type="checkbox"
                          [checked]="selectedProductIds().includes(prod._id)"
                          (change)="toggleProductSelection(prod._id)"
                        />
                        <div class="prod-cb-info">
                          <strong>{{ prod.name }}</strong>
                          <span>{{ prod.sku }} {{ prod.brand ? '— (' + prod.brand + ')' : '' }}</span>
                        </div>
                      </label>
                    } @if (!filteredProducts().length) {
                      <div class="no-prods-msg">Không tìm thấy sản phẩm nào.</div>
                    }
                  </div>
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-action secondary" (click)="closeModal()" [disabled]="saving()">
                  Hủy
                </button>
                <button type="submit" class="btn-action primary" [disabled]="form.invalid || saving()">
                  {{ saving() ? 'Đang lưu...' : 'Lưu lại' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </app-admin-catalog-page>
  `,
  styles: [
    `
      .brand-logo-img {
        width: 48px;
        height: 48px;
        object-fit: contain;
        background: #fdfbf9;
        border: 1px solid #ebdcd0;
        border-radius: 8px;
        padding: 4px;
      }

      .brand-logo-fallback {
        width: 48px;
        height: 48px;
        background: #fcf8f5;
        border: 1px dashed #d4b896;
        border-radius: 8px;
        color: #8c7161;
        font-weight: 700;
        font-size: 0.875rem;
        display: grid;
        place-items: center;
      }

      .badge-toggle {
        padding: 0.3rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 700;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        background: #f3f4f6;
        color: #6b7280;
        transition: background 0.2s, color 0.2s;
      }

      .badge-toggle.active {
        background: #ecfdf5;
        color: #10b981;
      }

      /* Modal Forms */
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-container {
        background: #fff;
        border-radius: 20px;
        width: 100%;
        max-width: 820px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #eae6e2;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #5c4033;
        font-weight: 700;
      }

      .modal-close-btn {
        background: none;
        border: none;
        font-size: 1.75rem;
        color: #6b7280;
        cursor: pointer;
      }

      .modal-form {
        padding: 1.5rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .form-group.full-width {
        grid-column: span 2;
      }

      .form-group label {
        font-weight: 700;
        font-size: 0.875rem;
        color: #4b5563;
      }

      .form-group input[type='text'],
      .form-group textarea {
        padding: 0.65rem 0.85rem;
        border: 1px solid #ebdcd0;
        border-radius: 10px;
        font-size: 0.9375rem;
        outline: none;
        transition: border-color 0.2s;
      }

      .form-group input[type='text']:focus,
      .form-group textarea:focus {
        border-color: #8c7161;
      }

      .form-error-alert {
        grid-column: span 2;
        padding: 0.75rem 1rem;
        background: #fef2f2;
        color: #ef4444;
        border-radius: 10px;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
        border: 1px solid #fee2e2;
      }

      .field-error {
        color: #ef4444;
        font-size: 0.75rem;
      }

      .required {
        color: #ef4444;
      }

      /* Logo upload styles */
      .logo-upload-box {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 1rem;
        border: 1px dashed #d4b896;
        border-radius: 12px;
        background: #fdfbf9;
      }

      .logo-preview-area {
        width: 70px;
        height: 70px;
        border-radius: 8px;
        background: #f3f4f6;
        border: 1px solid #eae6e2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
      }

      .logo-preview-area img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .upload-placeholder {
        font-size: 0.6875rem;
        color: #9ca3af;
        text-align: center;
      }

      .btn-remove-logo {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(239, 68, 68, 0.9);
        color: #fff;
        border: none;
        font-size: 0.65rem;
        padding: 0.2rem 0;
        cursor: pointer;
      }

      .pointer-label {
        cursor: pointer;
      }

      .muted-note {
        font-size: 0.75rem;
        color: #9ca3af;
        margin: 0;
      }

      /* Toggle Switch */
      .toggle-switch-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        font-weight: 700;
        user-select: none;
      }

      .toggle-switch-label input {
        display: none;
      }

      .toggle-slider {
        position: relative;
        width: 44px;
        height: 24px;
        background: #d1d5db;
        border-radius: 999px;
        transition: background 0.3s;
      }

      .toggle-slider::before {
        content: '';
        position: absolute;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: white;
        top: 3px;
        left: 3px;
        transition: transform 0.3s;
      }

      .toggle-switch-label input:checked + .toggle-slider {
        background: #10b981;
      }

      .toggle-switch-label input:checked + .toggle-slider::before {
        transform: translateX(20px);
      }

      /* Products scroll selection list */
      .products-selection-list {
        border: 1px solid #ebdcd0;
        border-radius: 12px;
        background: #fff;
        overflow: hidden;
      }

      .prod-search-input {
        width: 100%;
        border: none !important;
        border-bottom: 1px solid #eae6e2 !important;
        border-radius: 0 !important;
        padding: 0.5rem 0.75rem !important;
        font-size: 0.8125rem !important;
      }

      .checkbox-list-scroll {
        max-height: 180px;
        overflow-y: auto;
        padding: 0.5rem;
      }

      .prod-checkbox-row {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.35rem 0.5rem;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s;
      }

      .prod-checkbox-row:hover {
        background: #fcf8f5;
      }

      .prod-checkbox-row input {
        width: 16px;
        height: 16px;
        accent-color: #8c7161;
      }

      .prod-cb-info {
        display: flex;
        flex-direction: column;
      }

      .prod-cb-info strong {
        font-size: 0.8125rem;
        color: #374151;
      }

      .prod-cb-info span {
        font-size: 0.6875rem;
        color: #9ca3af;
      }

      .no-prods-msg {
        font-size: 0.75rem;
        color: #9ca3af;
        text-align: center;
        padding: 1rem;
      }

      /* Actions button styles */
      .modal-actions {
        grid-column: span 2;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid #eae6e2;
      }
    `
  ]
})
export class BrandsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  crumbs = [{ label: 'Thương hiệu', active: true }];

  // Pagination & Filters
  search = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  loading = signal(false);
  saving = signal(false);

  // Rows and data state
  rows = signal<BrandRow[]>([]);
  allProducts = signal<ProductSummary[]>([]);
  productFilterSearch = '';

  // Selected Products for association
  selectedProductIds = signal<string[]>([]);
  originalAssociatedProductIds: string[] = [];

  // Modal Control
  modalOpen = signal(false);
  editingId = signal<string | null>(null);
  formError = signal('');

  // Brand Form
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', Validators.required],
    logoUrl: [''],
    description: [''],
    isActive: [true]
  });

  // Filtered lists
  filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const list = this.rows();
    if (!term) return list;
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.slug.toLowerCase().includes(term)
    );
  });

  maxPages = computed(() => {
    return Math.max(1, Math.ceil(this.filtered().length / this.pageSize()));
  });

  paged = computed(() => {
    const list = this.filtered();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadRows();
    this.loadProducts();
  }

  rowIndex(localIndex: number): number {
    return (this.currentPage() - 1) * this.pageSize() + localIndex + 1;
  }

  onSearchChange(val: string): void {
    this.search.set(val);
    this.currentPage.set(1);
  }

  onNameInput(): void {
    if (!this.editingId()) {
      const name = this.form.get('name')?.value || '';
      this.form.patchValue({ slug: slugify(name) });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.selectedProductIds.set([]);
    this.originalAssociatedProductIds = [];
    this.form.reset({
      name: '',
      slug: '',
      logoUrl: '',
      description: '',
      isActive: true
    });
    this.modalOpen.set(true);
  }

  openEdit(item: BrandRow): void {
    this.editingId.set(item._id);
    this.formError.set('');

    // Find products currently associated with this brand
    const associatedIds = this.allProducts()
      .filter((p) => p.brand === item.name)
      .map((p) => p._id);

    this.selectedProductIds.set(associatedIds);
    this.originalAssociatedProductIds = [...associatedIds];

    this.form.reset({
      name: item.name,
      slug: item.slug,
      logoUrl: item.logoUrl,
      description: item.description,
      isActive: item.isActive
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    try {
      this.formError.set('');
      const file = input.files[0];
      const base64 = await compressImageFile(file, 200, 0.85);
      this.form.patchValue({ logoUrl: base64 });
    } catch (e) {
      this.formError.set('Lỗi khi nén ảnh: ' + String(e));
    }
  }

  removeUploadedLogo(): void {
    this.form.patchValue({ logoUrl: '' });
  }

  toggleStatus(item: BrandRow): void {
    const targetStatus = !item.isActive;
    this.api.update<BrandRow>('brands', item._id, { isActive: targetStatus }).subscribe({
      next: () => {
        this.loadRows();
      }
    });
  }

  remove(item: BrandRow): void {
    if (!confirm(`Xóa thương hiệu "${item.name}"?`)) return;
    this.api.delete('brands', item._id).subscribe({
      next: () => {
        this.loadRows();
        // Clear association
        this.allProducts().forEach((p) => {
          if (p.brand === item.name) {
            this.api.update('products', p._id, { brand: '' }).subscribe();
          }
        });
      }
    });
  }

  // Association logic
  filteredProducts(): ProductSummary[] {
    const q = this.productFilterSearch.trim().toLowerCase();
    if (!q) return this.allProducts();
    return this.allProducts().filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }

  toggleProductSelection(productId: string): void {
    const list = [...this.selectedProductIds()];
    const idx = list.indexOf(productId);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(productId);
    }
    this.selectedProductIds.set(list);
  }

  save(): void {
    if (this.form.invalid) return;

    const payload = {
      name: String(this.form.value.name || '').trim(),
      slug: slugify(String(this.form.value.slug || '')),
      logoUrl: String(this.form.value.logoUrl || '').trim(),
      description: String(this.form.value.description || '').trim(),
      isActive: !!this.form.value.isActive
    };

    this.saving.set(true);
    this.formError.set('');

    const id = this.editingId();
    const req = id
      ? this.api.update<BrandRow>('brands', id, payload)
      : this.api.create<BrandRow>('brands', payload);

    req.subscribe({
      next: (savedBrand) => {
        // Sync products association
        const selected = this.selectedProductIds();
        const original = this.originalAssociatedProductIds;

        // 1. Products that are now selected but were not originally: assign brand name
        const toAdd = selected.filter((pid) => !original.includes(pid));
        toAdd.forEach((pid) => {
          this.api.update('products', pid, { brand: payload.name }).subscribe();
        });

        // 2. Products that were originally selected but are no longer selected: clear brand
        const toRemove = original.filter((pid) => !selected.includes(pid));
        toRemove.forEach((pid) => {
          this.api.update('products', pid, { brand: '' }).subscribe();
        });

        // 3. Handle brand renaming if editing
        if (id && savedBrand && savedBrand.name !== payload.name) {
          // If the brand name was changed, update all currently associated products' brand string
          const same = selected.filter((pid) => original.includes(pid));
          same.forEach((pid) => {
            this.api.update('products', pid, { brand: payload.name }).subscribe();
          });
        }

        setTimeout(() => {
          this.saving.set(false);
          this.closeModal();
          this.loadRows();
          this.loadProducts();
        }, 600);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = String(err?.error?.message || '');
        if (/duplicate/i.test(msg)) {
          this.formError.set('Tên hoặc slug đã tồn tại.');
        } else {
          this.formError.set(msg || 'Lỗi khi lưu thương hiệu.');
        }
      }
    });
  }

  private loadRows(): void {
    this.loading.set(true);
    this.api.list<BrandRow>('brands').subscribe({
      next: (res) => {
        this.rows.set(this.sortByCreated(res));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadProducts(): void {
    this.api.list<any>('products').subscribe({
      next: (res) => {
        const summaries: ProductSummary[] = res.map((p: any) => ({
          _id: p._id || p.id,
          name: p.name,
          sku: p.sku,
          brand: p.brand || ''
        }));
        this.allProducts.set(summaries);
      }
    });
  }

  private sortByCreated(list: BrandRow[]): BrandRow[] {
    return [...list].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta; // Newest first
    });
  }
}
