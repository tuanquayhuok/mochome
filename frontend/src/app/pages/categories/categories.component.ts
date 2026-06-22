import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CategoryRow } from '../../core/models/admin-list.models';
import { slugify } from '../../core/utils/slugify';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';
import { productSectionCrumbs } from '../../shared/admin-product-section.config';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Danh mục"
      subtitle="Phân loại sản phẩm trong cửa hàng"
      [breadcrumbs]="crumbs"
    >
      <button catalogActions type="button" class="btn-action primary" (click)="openCreate()">
        + Thêm danh mục
      </button>

      <div pageToolbar class="catalog-filter-bar catalog-filter-bar--simple">
        <div class="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Tìm danh mục..."
            [ngModel]="search()"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>
        @if (rows().length) {
          <p class="toolbar-meta muted">{{ rows().length }} danh mục</p>
        }
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải danh mục...</div>
      } @else if (!rows().length) {
        <div class="page-state">
          Chưa có danh mục nào.
          <button type="button" class="btn-action primary state-action" (click)="openCreate()">
            + Thêm danh mục đầu tiên
          </button>
        </div>
      } @else {
        @if (!filtered().length) {
          <div class="page-state">Không tìm thấy danh mục phù hợp bộ lọc.</div>
        } @else {
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Hình ảnh</th>
                  <th>Tên danh mục</th>
                  <th>Số sản phẩm</th>
                  <th>Slug</th>
                  <th>Mô tả</th>
                  <th class="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (item of paged(); track item._id; let i = $index) {
                  <tr>
                    <td class="cell-muted">{{ rowIndex(i) }}</td>
                    <td>
                      @if (item.imageUrl) {
                        <img [src]="item.imageUrl" class="cat-thumb-img" alt="{{ item.name }}" />
                      } @else {
                        <div class="cat-thumb-fallback"></div>
                      }
                    </td>
                    <td class="cell-strong">{{ item.name }}</td>
                    <td>
                      <span class="product-count-badge">{{ item.productCount ?? 0 }} sản phẩm</span>
                    </td>
                    <td class="cell-muted">{{ item.slug }}</td>
                    <td>{{ item.description || '—' }}</td>
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
              <span>Hiển thị {{ rangeStart() }} – {{ rangeEnd() }} trong {{ filtered().length }} danh mục</span>
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
        <p class="table-meta muted">Tổng {{ rows().length }} danh mục</p>
      }
    </app-admin-catalog-page>

    @if (modalOpen()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal panel" role="dialog" (click)="$event.stopPropagation()">
          <header class="modal-head">
            <div>
              <h2>{{ editingId() ? 'Cập nhật danh mục' : 'Thêm danh mục mới' }}</h2>
              <p class="modal-sub">Thông tin hiển thị trên cửa hàng và bộ lọc sản phẩm</p>
            </div>
            <button type="button" class="modal-close" (click)="closeModal()" aria-label="Đóng">×</button>
          </header>

          <form [formGroup]="form" (ngSubmit)="save()" class="modal-form">
            <div class="form-section">
              <label for="cat-name">Tên danh mục <em>*</em></label>
              <input
                id="cat-name"
                type="text"
                formControlName="name"
                placeholder="Ví dụ: Bàn ăn, Sofa phòng khách"
                maxlength="80"
                (input)="onNameInput()"
                [class.input-invalid]="showErr('name')"
              />
              @if (showErr('name')) {
                <p class="field-err">{{ fieldError('name') }}</p>
              } @else {
                <p class="field-hint">2–80 ký tự, không trùng danh mục đã có</p>
              }
            </div>

            <div class="form-section">
              <label for="cat-slug">Slug (URL) <em>*</em></label>
              <input
                id="cat-slug"
                type="text"
                formControlName="slug"
                placeholder="ban-an"
                maxlength="80"
                (input)="onSlugInput()"
                [class.input-invalid]="showErr('slug')"
              />
              @if (showErr('slug')) {
                <p class="field-err">{{ fieldError('slug') }}</p>
              } @else {
                <p class="field-hint">
                  Chỉ chữ thường, số và dấu gạch ngang ·
                  <span class="slug-preview">/san-pham?danhMuc={{ form.get('slug')?.value || '…' }}</span>
                </p>
              }
            </div>

            <div class="form-section">
              <label for="cat-image">Đường dẫn hình ảnh (URL)</label>
              <div class="image-input-wrap">
                <input
                  id="cat-image"
                  type="text"
                  formControlName="imageUrl"
                  placeholder="https://images.unsplash.com/... hoặc /assets/..."
                  maxlength="500"
                />
                @if (form.get('imageUrl')?.value) {
                  <div class="form-image-preview">
                    <img [src]="form.get('imageUrl')?.value" alt="Preview" />
                  </div>
                }
              </div>
              <p class="field-hint">Đường dẫn ảnh đại diện cho danh mục (tùy chọn)</p>
            </div>

            <div class="form-section">
              <label for="cat-desc">Mô tả ngắn</label>
              <textarea
                id="cat-desc"
                formControlName="description"
                rows="3"
                maxlength="500"
                placeholder="Mô tả hiển thị khi khách lọc theo danh mục (tuỳ chọn)"
              ></textarea>
              <p class="field-hint field-hint--right">
                {{ (form.get('description')?.value || '').length }}/500 ký tự
              </p>
            </div>

            @if (formError()) {
              <p class="form-hint err">{{ formError() }}</p>
            }

            <div class="modal-actions">
              <button type="button" class="btn-action secondary" (click)="closeModal()">Hủy</button>
              <button type="submit" class="btn-action primary" [disabled]="saving() || form.pending">
                {{ saving() ? 'Đang lưu...' : editingId() ? 'Cập nhật' : 'Thêm danh mục' }}
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

      .toolbar-meta {
        margin: 0;
        font-size: 0.8125rem;
        white-space: nowrap;
      }

      .catalog-filter-bar--simple {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .table-meta {
        margin: 0.75rem 0 0;
        font-size: 0.75rem;
      }

      .col-actions {
        width: 120px;
        text-align: right;
        white-space: nowrap;
      }

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
        max-width: 640px;
        padding: 0;
        overflow: hidden;
      }

      .modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.15rem;
        border-bottom: 1px solid var(--border-light);
      }

      .modal-head h2 {
        margin: 0;
        font-size: 1rem;
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
        font-size: 1.35rem;
        line-height: 1;
        color: var(--muted);
        cursor: pointer;
        flex-shrink: 0;
      }

      .modal-form {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        padding: 1rem 1.15rem 1.15rem;
      }

      .form-section {
        margin-bottom: 0.65rem;
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
      }

      .modal-form input,
      .modal-form textarea {
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.875rem;
        font-family: inherit;
        background: var(--surface);
        color: var(--text);
      }

      .modal-form input.input-invalid,
      .modal-form textarea.input-invalid {
        border-color: #fca5a5;
      }

      .modal-form input:focus,
      .modal-form textarea:focus {
        outline: none;
        border-color: #9ca3af;
      }

      .field-hint {
        margin: 0.3rem 0 0;
        font-size: 0.75rem;
        color: var(--muted);
      }

      .field-hint--right {
        text-align: right;
      }

      .slug-preview {
        font-family: ui-monospace, monospace;
        font-size: 0.7rem;
      }

      .field-err {
        margin: 0.3rem 0 0;
        font-size: 0.75rem;
        color: #b91c1c;
      }

      .form-hint.err {
        margin: 0.35rem 0 0;
        font-size: 0.8125rem;
        color: #b91c1c;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-light);
      }

      /* Custom Category elements */
      .cat-thumb-img {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        object-fit: cover;
        border: 1px solid var(--border-light);
        background: #f9f9f9;
        display: block;
      }

      .cat-thumb-fallback {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        background: #f5efe6;
        border: 1px dashed var(--border);
        position: relative;
        display: block;
      }

      .cat-thumb-fallback::after {
        content: '📁';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.1rem;
      }

      .product-count-badge {
        background: #fdfaf7;
        color: #8c6239;
        border: 1px solid #ebdcd0;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        display: inline-block;
      }

      .image-input-wrap {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-image-preview {
        width: 100%;
        max-width: 160px;
        height: 100px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--border-light);
        margin-top: 0.25rem;
        background: #f9f9f9;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .form-image-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    `
  ]
})
export class CategoriesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly crumbs = productSectionCrumbs('Danh mục');
  readonly loading = signal(true);
  readonly rows = signal<CategoryRow[]>([]);
  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly search = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  slugTouched = false;

  form = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(80),
        (c: AbstractControl) => this.duplicateName(c)
      ]
    ],
    slug: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(80),
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        (c: AbstractControl) => this.duplicateSlug(c)
      ]
    ],
    imageUrl: ['', Validators.maxLength(500)],
    description: ['', Validators.maxLength(500)]
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.rows();
    if (!q) return list;
    return list.filter(
      (r) => `${r.name} ${r.slug} ${r.description || ''}`.toLowerCase().includes(q)
    );
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize()))
  );

  readonly paged = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  onSearchChange(value: string): void {
    this.search.set(value);
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

  pageNumbers(): (number | string)[] {
    const total = this.totalPages();
    const cur = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | string)[] = [1];
    if (cur > 3) pages.push('…');
    if (cur > 3 && cur < total - 2) {
      pages.push(cur - 1, cur, cur + 1);
    } else if (cur <= 3) {
      pages.push(2, 3, 4);
    } else {
      pages.push(total - 3, total - 2, total - 1);
    }
    if (cur < total - 2) pages.push('…');
    pages.push(total);
    return pages;
  }

  goPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  setPageSize(size: number): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(1);
  }

  ngOnInit(): void {
    this.loadRows();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.slugTouched = false;
    this.form.reset({ name: '', slug: '', imageUrl: '', description: '' });
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(item: CategoryRow): void {
    this.editingId.set(item._id);
    this.slugTouched = true;
    this.form.reset({
      name: item.name,
      slug: item.slug,
      imageUrl: item.imageUrl || '',
      description: item.description || ''
    });
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingId.set(null);
    this.formError.set('');
  }

  onNameInput(): void {
    if (this.slugTouched) return;
    const name = String(this.form.get('name')?.value || '');
    this.form.patchValue({ slug: slugify(name) }, { emitEvent: false });
    this.form.get('slug')?.updateValueAndValidity({ emitEvent: false });
  }

  onSlugInput(): void {
    this.slugTouched = true;
    const raw = String(this.form.get('slug')?.value || '');
    const normalized = slugify(raw);
    if (raw !== normalized) {
      this.form.patchValue({ slug: normalized }, { emitEvent: false });
    }
    this.form.get('slug')?.updateValueAndValidity({ emitEvent: false });
  }

  showErr(field: 'name' | 'slug' | 'description'): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  fieldError(field: 'name' | 'slug'): string {
    const c = this.form.get(field);
    if (!c?.errors) return '';
    if (c.errors['required']) return 'Trường này là bắt buộc.';
    if (c.errors['minlength']) return 'Tối thiểu 2 ký tự.';
    if (c.errors['maxlength']) return 'Vượt quá độ dài cho phép.';
    if (c.errors['pattern']) return 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.';
    if (c.errors['duplicateName']) return 'Tên danh mục đã tồn tại.';
    if (c.errors['duplicateSlug']) return 'Slug đã được dùng bởi danh mục khác.';
    return 'Giá trị không hợp lệ.';
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.formError.set('Vui lòng kiểm tra lại các trường được đánh dấu.');
      return;
    }

    const payload = {
      name: String(this.form.value.name || '').trim(),
      slug: slugify(String(this.form.value.slug || '')),
      imageUrl: String(this.form.value.imageUrl || '').trim(),
      description: String(this.form.value.description || '').trim()
    };

    if (!payload.slug) {
      this.formError.set('Slug không hợp lệ.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');

    const id = this.editingId();
    const req = id
      ? this.api.update<CategoryRow>('categories', id, payload)
      : this.api.create<CategoryRow>('categories', payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.search.set('');
        this.currentPage.set(1);
        this.closeModal();
        this.loadRows();
      },
      error: (err) => {
        this.saving.set(false);
        const msg = String(err?.error?.message || '');
        if (/duplicate|E11000|unique/i.test(msg)) {
          this.formError.set('Tên hoặc slug đã tồn tại — vui lòng dùng giá trị khác.');
        } else {
          this.formError.set(msg || 'Không lưu được danh mục.');
        }
      }
    });
  }

  remove(item: CategoryRow): void {
    if (!confirm(`Xóa danh mục "${item.name}"?`)) return;
    this.api.delete('categories', item._id).subscribe({
      next: () => this.loadRows()
    });
  }

  private duplicateName(control: AbstractControl): ValidationErrors | null {
    const val = String(control.value || '').trim().toLowerCase();
    if (!val) return null;
    const editingId = this.editingId();
    const dup = this.rows().some(
      (r) => r.name.trim().toLowerCase() === val && r._id !== editingId
    );
    return dup ? { duplicateName: true } : null;
  }

  private duplicateSlug(control: AbstractControl): ValidationErrors | null {
    const val = slugify(String(control.value || ''));
    if (!val) return null;
    const editingId = this.editingId();
    const dup = this.rows().some((r) => r.slug === val && r._id !== editingId);
    return dup ? { duplicateSlug: true } : null;
  }

  private loadRows(): void {
    this.loading.set(true);
    this.api.list<CategoryRow>('categories').subscribe({
      next: (rows) => {
        this.rows.set(this.sortByCreated(rows.map((r) => this.normalizeRow(r))));
        const maxPage = Math.max(1, Math.ceil(this.filtered().length / this.pageSize()));
        if (this.currentPage() > maxPage) {
          this.currentPage.set(maxPage);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private sortByCreated(rows: CategoryRow[]): CategoryRow[] {
    return [...rows].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (ta !== tb) return ta - tb;
      return a.name.localeCompare(b.name, 'vi');
    });
  }

  private normalizeRow(raw: CategoryRow | Record<string, unknown>): CategoryRow {
    const r = raw as Record<string, unknown>;
    return {
      _id: String(r['_id'] ?? r['id'] ?? ''),
      name: String(r['name'] ?? ''),
      slug: String(r['slug'] ?? ''),
      imageUrl: String(r['imageUrl'] ?? ''),
      productCount: Number(r['productCount'] ?? 0),
      description: String(r['description'] ?? ''),
      createdAt: r['createdAt'] ? String(r['createdAt']) : undefined
    };
  }
}
