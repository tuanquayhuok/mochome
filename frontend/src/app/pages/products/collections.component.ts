import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CatalogCollectionRow } from '../../core/models/admin-list.models';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';
import { productSectionCrumbs } from '../../shared/admin-product-section.config';

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
      <button catalogActions type="button" class="btn-action primary">+ Thêm bộ sưu tập</button>

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
                      <button type="button" class="icon-round" title="Sửa">
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
    </app-admin-catalog-page>
  `
})
export class CollectionsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly crumbs = productSectionCrumbs('Bộ sưu tập');
  readonly loading = signal(true);
  readonly rows = signal<CatalogCollectionRow[]>([]);
  search = '';

  filtered = () => {
    const q = this.search.trim().toLowerCase();
    return this.rows().filter(
      (r) => !q || `${r.name} ${r.slug}`.toLowerCase().includes(q)
    );
  };

  ngOnInit(): void {
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

  remove(item: CatalogCollectionRow): void {
    if (!confirm(`Xóa bộ sưu tập "${item.name}"?`)) return;
    this.api.delete('collections', item._id).subscribe({
      next: () => this.rows.update((list) => list.filter((r) => r._id !== item._id))
    });
  }
}
