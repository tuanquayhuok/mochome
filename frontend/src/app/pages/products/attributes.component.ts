import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AttributeRow } from '../../core/models/admin-list.models';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';
import { productSectionCrumbs } from '../../shared/admin-product-section.config';

const TYPE_LABEL: Record<string, string> = {
  text: 'Văn bản',
  color: 'Màu sắc',
  size: 'Kích thước'
};

@Component({
  selector: 'app-attributes',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Thuộc tính"
      subtitle="Màu sắc, kích thước và thuộc tính tùy chỉnh cho sản phẩm"
      [breadcrumbs]="crumbs"
    >
      <button catalogActions type="button" class="btn-action primary">+ Thêm thuộc tính</button>

      <div pageToolbar class="catalog-filter-bar catalog-filter-bar--simple">
        <div class="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="search" placeholder="Tìm thuộc tính..." [(ngModel)]="search" />
        </div>
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải thuộc tính...</div>
      } @else if (!filtered().length) {
        <div class="page-state">Chưa có thuộc tính nào.</div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên thuộc tính</th>
                <th>Loại</th>
                <th>Giá trị</th>
                <th>Trạng thái</th>
                <th class="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filtered(); track item._id; let i = $index) {
                <tr>
                  <td class="cell-muted">{{ i + 1 }}</td>
                  <td class="cell-strong">{{ item.name }}</td>
                  <td>{{ typeLabel(item.type) }}</td>
                  <td class="cell-muted values-cell">{{ item.values?.join(', ') || '—' }}</td>
                  <td>
                    <span class="status-badge" [class.completed]="item.isActive" [class.pending]="!item.isActive">
                      {{ item.isActive ? 'Hoạt động' : 'Tạm ẩn' }}
                    </span>
                  </td>
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
  `,
  styles: [
    `
      .values-cell {
        max-width: 280px;
      }
    `
  ]
})
export class AttributesComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly crumbs = productSectionCrumbs('Thuộc tính');
  readonly loading = signal(true);
  readonly rows = signal<AttributeRow[]>([]);
  search = '';

  filtered = () => {
    const q = this.search.trim().toLowerCase();
    return this.rows().filter((r) => !q || `${r.name} ${r.slug}`.toLowerCase().includes(q));
  };

  ngOnInit(): void {
    this.api.list<AttributeRow>('attributes').subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  typeLabel(type: string): string {
    return TYPE_LABEL[type] || type;
  }

  remove(item: AttributeRow): void {
    if (!confirm(`Xóa thuộc tính "${item.name}"?`)) return;
    this.api.delete('attributes', item._id).subscribe({
      next: () => this.rows.update((list) => list.filter((r) => r._id !== item._id))
    });
  }
}
