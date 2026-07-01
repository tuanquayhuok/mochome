import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { BannerRow } from '../../core/models/admin-list.models';
import { compressImageFile } from '../../core/utils/compress-image';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';

@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Quản lý banner"
      subtitle="Quản lý hình ảnh banner quảng cáo trên website"
      [breadcrumbs]="crumbs"
    >
      <button catalogActions type="button" class="btn-action primary" (click)="openCreate()">
        + Thêm banner
      </button>

      <div pageToolbar class="catalog-filter-bar">
        <div class="filter-group">
          <div class="search-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Tìm theo đường dẫn..."
              [ngModel]="search()"
              (ngModelChange)="onSearchChange($event)"
            />
          </div>

          <div class="select-field">
            <select [ngModel]="statusFilter()" (ngModelChange)="onStatusFilterChange($event)">
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đang ẩn</option>
            </select>
          </div>
        </div>

        @if (rows().length) {
          <p class="toolbar-meta muted">{{ filtered().length }} / {{ rows().length }} banner</p>
        }
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải danh sách banner...</div>
      } @else if (!rows().length) {
        <div class="page-state">
          Chưa có banner nào được tạo.
          <button type="button" class="btn-action primary state-action" (click)="openCreate()">
            + Thêm banner đầu tiên
          </button>
        </div>
      } @else {
        @if (!filtered().length) {
          <div class="page-state">Không tìm thấy banner nào phù hợp với bộ lọc.</div>
        } @else {
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th style="width: 160px;">Hình ảnh</th>
                  <th>Đường dẫn liên kết (Link URL)</th>
                  <th style="width: 100px;" class="text-center">Thứ tự</th>
                  <th style="width: 150px;">Trạng thái</th>
                  <th class="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (item of paged(); track item._id; let i = $index) {
                  <tr>
                    <td class="cell-muted">{{ rowIndex(i) }}</td>
                    <td>
                      <div class="banner-preview-cell">
                        <img
                          [src]="item.imageUrl"
                          alt="Banner Preview"
                          class="banner-thumb"
                          (error)="handleImageError($event)"
                        />
                      </div>
                    </td>
                    <td class="cell-strong">
                      @if (item.link) {
                        <a [href]="item.link" target="_blank" class="banner-link-active" [title]="item.link">
                          {{ truncateLink(item.link) }}
                        </a>
                      } @else {
                        <span class="cell-muted">— (Không có liên kết)</span>
                      }
                    </td>
                    <td class="cell-strong text-center">{{ item.order ?? 0 }}</td>
                    <td>
                      <label class="toggle" [attr.title]="item.active !== false ? 'Đang hoạt động' : 'Đang ẩn'">
                        <input
                          type="checkbox"
                          [checked]="item.active !== false"
                          (change)="toggleActive(item, $event)"
                        />
                        <span class="toggle-slider"></span>
                      </label>
                      <span class="status-text" [class.active]="item.active !== false">
                        {{ item.active !== false ? 'Hiển thị' : 'Ẩn' }}
                      </span>
                    </td>
                    <td class="col-actions">
                      <div class="icon-actions">
                        <button type="button" class="icon-round" title="Sửa" (click)="openEdit(item)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button type="button" class="icon-round danger" title="Xóa" (click)="remove(item)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="table-bulk-footer">
            <div class="bulk-left"></div>
            <div class="bulk-right">
              <span>Hiển thị {{ rangeStart() }} – {{ rangeEnd() }} trong {{ filtered().length }} banner</span>
              <select class="page-size-select" [ngModel]="pageSize()" (ngModelChange)="setPageSize($event)">
                <option [ngValue]="5">5 / trang</option>
                <option [ngValue]="10">10 / trang</option>
                <option [ngValue]="20">20 / trang</option>
              </select>
              <div class="pagination-btns">
                <button type="button" class="btn-page" (click)="goPage(currentPage() - 1)" [disabled]="currentPage() === 1">
                  ‹
                </button>
                @for (p of pageNumbers(); track p) {
                  @if (p === '…') {
                    <span class="page-ellipsis">…</span>
                  } @else {
                    <button
                      type="button"
                      class="btn-page"
                      [class.active]="p === currentPage()"
                      (click)="goPage(+p)"
                    >
                      {{ p }}
                    </button>
                  }
                }
                <button
                  type="button"
                  class="btn-page"
                  (click)="goPage(currentPage() + 1)"
                  [disabled]="currentPage() === totalPages()"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        }
      }
    </app-admin-catalog-page>

    @if (modalOpen()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal panel" role="dialog" (click)="$event.stopPropagation()">
          <header class="modal-head">
            <div>
              <h2>{{ editingId() ? 'Cập nhật banner' : 'Tạo banner mới' }}</h2>
              <p class="modal-sub">Cấu hình hình ảnh và liên kết cho banner quảng cáo</p>
            </div>
            <button type="button" class="modal-close" (click)="closeModal()" aria-label="Đóng">×</button>
          </header>

          <form [formGroup]="form" (ngSubmit)="save()" class="modal-form">
            <div class="form-grid">
              <div class="form-section full-width">
                <label>Hình ảnh banner <em>*</em></label>
                
                <div
                  class="upload-zone"
                  [class.has-image]="imagePreview()"
                  (dragover)="onDragOver($event)"
                  (drop)="onImageDrop($event)"
                >
                  @if (imagePreview()) {
                    <img [src]="imagePreview()" alt="Banner Preview" class="upload-preview" />
                    <button type="button" class="btn-remove-image" (click)="clearImage()" title="Xóa ảnh">×</button>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <p>Kéo thả ảnh banner vào đây hoặc</p>
                  }
                  <label class="btn-action secondary upload-btn">
                    Chọn ảnh
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      class="sr-only"
                      (change)="onFileSelected($event)"
                    />
                  </label>
                </div>
                
                <div style="margin-top: 0.5rem;">
                  <input
                    type="url"
                    formControlName="imageUrl"
                    (input)="onImageUrlChange()"
                    placeholder="Hoặc dán URL ảnh trực tiếp từ bên ngoài..."
                    class="url-input"
                    [class.input-invalid]="showErr('imageUrl')"
                  />
                  @if (showErr('imageUrl')) {
                    <p class="field-err">Vui lòng tải ảnh lên hoặc nhập URL ảnh banner.</p>
                  } @else {
                    <p class="field-hint">Kích thước khuyên dùng: Banner lớn trang chủ (1920x600px), banner nhỏ (1200x300px)</p>
                  }
                </div>
              </div>

              <div class="form-section full-width">
                <label for="banner-link">Đường dẫn liên kết (Link URL)</label>
                <input
                  id="banner-link"
                  type="text"
                  formControlName="link"
                  placeholder="Ví dụ: /san-pham, /tin-tuc/sofa-dep, hoặc URL đầy đủ"
                />
              </div>

              <div class="form-section">
                <label for="banner-order">Thứ tự hiển thị <em>*</em></label>
                <input
                  id="banner-order"
                  type="number"
                  formControlName="order"
                  placeholder="1"
                  min="1"
                />
              </div>

              <div class="form-section checkbox-section">
                <label class="toggle toggle-inline">
                  <input type="checkbox" formControlName="active" />
                  <span class="toggle-slider"></span>
                </label>
                <span class="checkbox-label">Kích hoạt hiển thị</span>
              </div>
            </div>

            @if (formError()) {
              <p class="form-hint err">{{ formError() }}</p>
            }

            <div class="modal-actions">
              <button type="button" class="btn-action secondary" (click)="closeModal()">Hủy</button>
              <button type="submit" class="btn-action primary" [disabled]="saving()">
                {{ saving() ? 'Đang lưu...' : editingId() ? 'Cập nhật' : 'Tạo banner' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .catalog-filter-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        padding: 0.75rem 1rem;
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .toolbar-meta {
        margin: 0;
        font-size: 0.8125rem;
        white-space: nowrap;
      }

      .banner-preview-cell {
        display: flex;
        align-items: center;
      }

      .banner-thumb {
        width: 120px;
        height: 60px;
        border-radius: 6px;
        object-fit: cover;
        background: #f1f5f9;
        border: 1px solid var(--border-light);
        transition: transform 0.2s ease-in-out;
      }

      .banner-thumb:hover {
        transform: scale(1.05);
      }

      .banner-link-active {
        color: #2563eb;
        text-decoration: none;
        word-break: break-all;
        font-family: ui-monospace, monospace;
        font-size: 0.8125rem;
      }

      .banner-link-active:hover {
        text-decoration: underline;
      }

      .text-center {
        text-align: center;
      }

      .toggle {
        display: inline-block;
        position: relative;
        width: 38px;
        height: 20px;
        cursor: pointer;
        vertical-align: middle;
      }

      .toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #cbd5e1;
        transition: 0.2s;
        border-radius: 20px;
      }

      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 14px;
        width: 14px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.2s;
        border-radius: 50%;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
      }

      .toggle input:checked + .toggle-slider {
        background-color: #10b981;
      }

      .toggle input:checked + .toggle-slider:before {
        transform: translateX(18px);
      }

      .status-text {
        font-size: 0.75rem;
        margin-left: 0.35rem;
        color: var(--muted);
        font-weight: 500;
        vertical-align: middle;
      }

      .status-text.active {
        color: #059669;
      }

      .col-actions {
        width: 100px;
        text-align: right;
      }

      /* Modal and form styles */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(15, 23, 42, 0.35);
        display: grid;
        place-items: center;
        padding: 1rem;
      }

      .modal {
        width: 100%;
        max-width: 500px;
        padding: 0;
        overflow: hidden;
      }

      .modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.25rem 1.5rem 1rem;
        border-bottom: 1px solid var(--border-light);
      }

      .modal-head h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .modal-sub {
        margin: 0.25rem 0 0;
        font-size: 0.75rem;
        color: var(--muted);
      }

      .modal-close {
        border: none;
        background: none;
        font-size: 1.5rem;
        line-height: 1;
        color: var(--muted);
        cursor: pointer;
      }

      .modal-form {
        padding: 1.25rem 1.5rem 1.5rem;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .form-section {
        display: flex;
        flex-direction: column;
      }

      .form-section.full-width {
        grid-column: 1 / -1;
      }

      .modal-form label {
        display: block;
        margin-bottom: 0.35rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-secondary);
      }

      .modal-form label em {
        color: #b91c1c;
        font-style: normal;
        margin-left: 0.15rem;
      }

      .modal-form input {
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.875rem;
        font-family: inherit;
        background: var(--surface);
        color: var(--text);
        outline: none;
        transition: border-color 0.15s;
      }

      .modal-form input:focus {
        border-color: #9ca3af;
      }

      .modal-form input.input-invalid {
        border-color: #fca5a5;
        background-color: #fef2f2;
      }

      .url-input {
        margin-top: 0.5rem;
      }

      .upload-zone {
        border: 2px dashed var(--border);
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
        background: var(--bg);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        position: relative;
        min-height: 140px;
        transition: border-color 0.15s, background-color 0.15s;
      }

      .upload-zone.has-image {
        border-style: solid;
        padding: 0.5rem;
        min-height: 180px;
      }

      .upload-preview {
        max-width: 100%;
        max-height: 170px;
        object-fit: contain;
        border-radius: 4px;
      }

      .upload-zone svg {
        width: 32px;
        height: 32px;
        color: var(--muted);
      }

      .upload-zone p {
        margin: 0;
        font-size: 0.75rem;
        color: var(--muted);
      }

      .upload-btn {
        font-size: 0.75rem;
        padding: 0.4rem 0.75rem;
        cursor: pointer;
      }

      .btn-remove-image {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(15, 23, 42, 0.7);
        color: white;
        border: none;
        cursor: pointer;
        display: grid;
        place-items: center;
        font-size: 1rem;
        line-height: 1;
        transition: background 0.15s;
      }

      .btn-remove-image:hover {
        background: rgba(15, 23, 42, 0.9);
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

      .field-hint {
        margin: 0.25rem 0 0;
        font-size: 0.75rem;
        color: var(--muted);
      }

      .field-err {
        margin: 0.25rem 0 0;
        font-size: 0.75rem;
        color: #b91c1c;
      }

      .form-hint.err {
        margin: 0.75rem 0 0;
        font-size: 0.8125rem;
        color: #b91c1c;
      }

      .checkbox-section {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1.25rem;
      }

      .toggle-inline {
        flex-shrink: 0;
      }

      .checkbox-label {
        font-size: 0.8125rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.25rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-light);
      }
    `
  ]
})
export class BannersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly crumbs = [
    { label: 'Dashboard', route: '/admin/dashboard' },
    { label: 'Quản lý banner' }
  ];

  readonly loading = signal(true);
  readonly rows = signal<BannerRow[]>([]);
  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  
  // Filters and Pagination
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  
  // Image preview state for form
  readonly imagePreview = signal('');

  form = this.fb.group({
    imageUrl: ['', Validators.required],
    link: [''],
    order: [1, [Validators.required, Validators.min(1)]],
    active: [true]
  });

  // Computed selector of filtered rows
  readonly filtered = computed(() => {
    let list = this.rows();
    
    // Filter by status
    const status = this.statusFilter();
    if (status) {
      const activeVal = status === 'active';
      list = list.filter((r) => (r.active !== false) === activeVal);
    }
    
    // Filter by search query (link)
    const q = this.search().trim().toLowerCase();
    if (q) {
      list = list.filter((r) => (r.link || '').toLowerCase().includes(q));
    }

    return list;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize()))
  );

  readonly paged = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadRows();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
  }

  rowIndex(i: number): number {
    return (this.currentPage() - 1) * this.pageSize() + i + 1;
  }

  rangeStart(): number {
    if (!this.filtered().length) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  rangeEnd(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.filtered().length);
  }

  setPageSize(size: number): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(1);
  }

  goPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  pageNumbers(): (number | string)[] {
    const total = this.totalPages();
    const cur = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    
    const pages: (number | string)[] = [1];
    if (cur > 3) pages.push('…');
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) {
      pages.push(p);
    }
    if (cur < total - 2) pages.push('…');
    pages.push(total);
    return pages;
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50" fill="%23f1f5f9"%3E%3Crect width="100" height="50" rx="4"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="8" fill="%2394a3b8"%3EẢnh lỗi / Trống%3C/text%3E%3C/svg%3E';
  }

  truncateLink(link?: string): string {
    if (!link) return '';
    if (link.startsWith('data:')) {
      return 'Dữ liệu ảnh Base64...';
    }
    return link.length > 40 ? link.substring(0, 40) + '...' : link;
  }

  // CRUD Actions
  openCreate(): void {
    this.editingId.set(null);
    this.imagePreview.set('');
    
    // Automatically set order to rows.length + 1
    const nextOrder = this.rows().length + 1;

    this.form.reset({
      imageUrl: '',
      link: '',
      order: nextOrder,
      active: true
    });
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(item: BannerRow): void {
    this.editingId.set(item._id);
    this.imagePreview.set(item.imageUrl || '');
    
    this.form.reset({
      imageUrl: item.imageUrl || '',
      link: item.link || '',
      order: item.order ?? 1,
      active: item.active !== false
    });
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingId.set(null);
    this.imagePreview.set('');
    this.formError.set('');
  }

  // Drag and Drop Images
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File): void {
    if (file.size > 8 * 1024 * 1024) {
      this.formError.set('Hình ảnh tối đa 8MB.');
      return;
    }
    compressImageFile(file, 1600, 0.8)
      .then((dataUrl) => {
        this.imagePreview.set(dataUrl);
        this.form.patchValue({ imageUrl: dataUrl });
        this.formError.set('');
      })
      .catch(() => this.formError.set('Lỗi khi nén và tải ảnh.'));
  }

  onImageUrlChange(): void {
    const url = String(this.form.get('imageUrl')?.value || '').trim();
    this.imagePreview.set(url);
  }

  clearImage(): void {
    this.imagePreview.set('');
    this.form.patchValue({ imageUrl: '' });
  }

  showErr(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  toggleActive(item: BannerRow, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.api.update<BannerRow>('banners', item._id, { active: checked }).subscribe({
      next: (updated) => {
        this.rows.update((list) =>
          list.map((r) => (r._id === item._id ? { ...r, active: updated.active } : r))
        );
      },
      error: (err) => {
        console.error('Lỗi khi thay đổi trạng thái banner', err);
        this.loadRows();
      }
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    
    if (this.form.invalid) {
      this.formError.set('Vui lòng hoàn thành các thông tin bắt buộc.');
      return;
    }

    const val = this.form.value;

    const payload = {
      imageUrl: String(val.imageUrl || '').trim(),
      link: String(val.link || '').trim(),
      order: Number(val.order ?? 1),
      active: val.active !== false,
      title: '',      // Default empty to keep backend schema content
      subtitle: '',   // Default empty to keep backend schema content
      position: 'home_hero' // Default to home_hero
    };

    this.saving.set(true);
    this.formError.set('');

    const id = this.editingId();
    const req = id
      ? this.api.update<BannerRow>('banners', id, payload)
      : this.api.create<BannerRow>('banners', payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadRows();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message || 'Có lỗi xảy ra khi lưu banner.');
      }
    });
  }

  remove(item: BannerRow): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa banner này?`)) return;
    this.api.delete('banners', item._id).subscribe({
      next: () => {
        this.rows.update((list) => list.filter((r) => r._id !== item._id));
      },
      error: (err) => {
        console.error('Không xóa được banner', err);
      }
    });
  }

  private loadRows(): void {
    this.loading.set(true);
    this.api.list<BannerRow>('banners').subscribe({
      next: (list) => {
        this.rows.set(this.sortBanners(list));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Không tải được danh sách banner', err);
        this.loading.set(false);
      }
    });
  }

  private sortBanners(list: BannerRow[]): BannerRow[] {
    return [...list].sort((a, b) => {
      const orderA = a.order ?? 1;
      const orderB = b.order ?? 1;
      if (orderA !== orderB) return orderA - orderB;
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }
}
