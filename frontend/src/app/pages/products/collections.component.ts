import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CatalogCollectionRow } from '../../core/models/admin-list.models';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';
import { productSectionCrumbs } from '../../shared/admin-product-section.config';
import { slugify } from '../../core/utils/slugify';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Bộ sưu tập"
      subtitle="Nhóm sản phẩm theo phong cách hoặc chủ đề"
      [breadcrumbs]="crumbs"
    >
      <button catalogActions type="button" class="btn-action primary" (click)="openAddModal()">
        + Thêm bộ sưu tập
      </button>

      <div pageToolbar class="catalog-filter-bar catalog-filter-bar--simple">
        <div class="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Tìm bộ sưu tập..."
            [(ngModel)]="search"
          />
        </div>
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải bộ sưu tập...</div>
      } @else if (!filtered().length) {
        <div class="page-state">Chưa có bộ sưu tập nào.</div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên bộ sưu tập</th>
                <th>Slug</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th class="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filtered(); track item._id; let i = $index) {
                <tr>
                  <td class="cell-muted">{{ i + 1 }}</td>
                  <td class="cell-strong">{{ item.name }}</td>
                  <td class="cell-muted">{{ item.slug }}</td>
                  <td>{{ item.description || '—' }}</td>
                  <td>
                    <span class="status-badge" [class.completed]="item.isActive" [class.pending]="!item.isActive">
                      {{ item.isActive ? 'Hoạt động' : 'Tạm ẩn' }}
                    </span>
                  </td>
                  <td class="cell-muted">{{ formatDate(item.createdAt) }}</td>
                  <td class="col-actions">
                    <div class="icon-actions">
                      <button type="button" class="icon-round" title="Sửa" (click)="openEditModal(item)">
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
      }

      <!-- Add/Edit Modal Dialog -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()"></div>
        <div class="modal-dialog">
          <div class="modal-content">
            <header class="modal-header">
              <h3>{{ modalTitle() }}</h3>
              <button type="button" class="close-btn" (click)="closeModal()">×</button>
            </header>
            <form (submit)="save($event)">
              <div class="modal-body">
                @if (submitError()) {
                  <div class="alert error">{{ submitError() }}</div>
                }
                <label class="form-field">
                  <span class="label-text">Tên bộ sưu tập *</span>
                  <input
                    type="text"
                    [(ngModel)]="modalData.name"
                    name="name"
                    required
                    placeholder="Ví dụ: Japandi, Scandinavian"
                  />
                </label>
                <label class="form-field">
                  <span class="label-text">Slug (để trống sẽ tự sinh)</span>
                  <input
                    type="text"
                    [(ngModel)]="modalData.slug"
                    name="slug"
                    placeholder="ten-bo-suu-tap"
                  />
                </label>
                <label class="form-field">
                  <span class="label-text">Mô tả</span>
                  <textarea
                    [(ngModel)]="modalData.description"
                    name="description"
                    rows="3"
                    placeholder="Nhập mô tả bộ sưu tập..."
                  ></textarea>
                </label>
                <label class="form-field checkbox-field">
                  <input
                    type="checkbox"
                    [(ngModel)]="modalData.isActive"
                    name="isActive"
                  />
                  <span class="label-text">Đang hoạt động (hiển thị công khai)</span>
                </label>
              </div>
              <footer class="modal-footer">
                <button type="button" class="btn-action secondary" (click)="closeModal()">Hủy</button>
                <button type="submit" class="btn-action primary">Lưu lại</button>
              </footer>
            </form>
          </div>
        </div>
      }
    </app-admin-catalog-page>
  `,
  styles: [
    `
      /* Modal styling */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 1000;
        backdrop-filter: blur(4px);
      }
      .modal-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        width: 100%;
        max-width: 480px;
        overflow: hidden;
      }
      .modal-content {
        display: flex;
        flex-direction: column;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #eae6e2;
      }
      .modal-header h3 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
      }
      .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #9ca3af;
        transition: color 0.2s;
        padding: 0;
        line-height: 1;
      }
      .close-btn:hover {
        color: #111827;
      }
      .modal-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .form-field .label-text {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #374151;
      }
      .form-field input[type='text'],
      .form-field textarea {
        width: 100%;
        padding: 0.65rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        color: #111827;
        background: #fff;
      }
      .form-field input[type='text']:focus,
      .form-field textarea:focus {
        outline: none;
        border-color: #8c7161;
        box-shadow: 0 0 0 3px rgba(140, 113, 97, 0.12);
      }
      .checkbox-field {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }
      .checkbox-field input {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: #8c7161;
      }
      .modal-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid #eae6e2;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        background: #f9fafb;
      }
      .alert.error {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #b91c1c;
        padding: 0.75rem;
        border-radius: 6px;
        font-size: 0.8125rem;
      }
    `
  ]
})
export class CollectionsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly crumbs = productSectionCrumbs('Bộ sưu tập');
  readonly loading = signal(true);
  readonly rows = signal<CatalogCollectionRow[]>([]);
  search = '';

  // Modal states
  readonly showModal = signal(false);
  readonly modalTitle = signal('Thêm bộ sưu tập mới');
  readonly submitError = signal('');
  modalData = {
    _id: '',
    name: '',
    slug: '',
    description: '',
    isActive: true
  };

  filtered = () => {
    const q = this.search.trim().toLowerCase();
    return this.rows().filter(
      (r) => !q || `${r.name} ${r.slug}`.toLowerCase().includes(q)
    );
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.list<CatalogCollectionRow>('collections').subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('vi-VN');
  }

  openAddModal(): void {
    this.modalData = {
      _id: '',
      name: '',
      slug: '',
      description: '',
      isActive: true
    };
    this.modalTitle.set('Thêm bộ sưu tập mới');
    this.submitError.set('');
    this.showModal.set(true);
  }

  openEditModal(item: CatalogCollectionRow): void {
    this.modalData = {
      _id: item._id,
      name: item.name,
      slug: item.slug || '',
      description: item.description || '',
      isActive: item.isActive ?? true
    };
    this.modalTitle.set('Cập nhật bộ sưu tập');
    this.submitError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  save(event: Event): void {
    event.preventDefault();
    this.submitError.set('');

    const payload: Partial<CatalogCollectionRow> = {
      name: this.modalData.name.trim(),
      slug: this.modalData.slug.trim() || slugify(this.modalData.name),
      description: this.modalData.description.trim(),
      isActive: this.modalData.isActive
    };

    if (!payload.name) {
      this.submitError.set('Vui lòng nhập tên bộ sưu tập');
      return;
    }

    if (this.modalData._id) {
      // Update existing
      this.api.update<CatalogCollectionRow>('collections', this.modalData._id, payload).subscribe({
        next: (updated) => {
          this.rows.update((list) =>
            list.map((r) => (r._id === updated._id ? updated : r))
          );
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          this.submitError.set(err?.error?.message || 'Có lỗi xảy ra khi cập nhật bộ sưu tập.');
        }
      });
    } else {
      // Create new
      this.api.create<CatalogCollectionRow>('collections', payload).subscribe({
        next: (created) => {
          this.rows.update((list) => [...list, created]);
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          this.submitError.set(err?.error?.message || 'Có lỗi xảy ra khi tạo bộ sưu tập.');
        }
      });
    }
  }

  remove(item: CatalogCollectionRow): void {
    if (!confirm(`Xóa bộ sưu tập "${item.name}"?`)) return;
    this.api.delete('collections', item._id).subscribe({
      next: () => this.rows.update((list) => list.filter((r) => r._id !== item._id))
    });
  }
}
