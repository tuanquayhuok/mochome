import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ReviewRow } from '../../core/models/admin-list.models';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';
import { productSectionCrumbs } from '../../shared/admin-product-section.config';

@Component({
  selector: 'app-product-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Đánh giá sản phẩm"
      subtitle="Duyệt và quản lý đánh giá từ khách hàng"
      [breadcrumbs]="crumbs"
    >
      <div pageToolbar class="catalog-filter-bar catalog-filter-bar--simple">
        <div class="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="search" placeholder="Tìm sản phẩm, khách hàng..." [(ngModel)]="search" />
        </div>
        <select [(ngModel)]="approvedFilter">
          <option value="">Tất cả trạng thái</option>
          <option value="yes">Đã duyệt</option>
          <option value="no">Chờ duyệt</option>
        </select>
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải đánh giá...</div>
      } @else if (!filtered().length) {
        <div class="page-state">Chưa có đánh giá sản phẩm.</div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Khách hàng</th>
                <th>Sản phẩm</th>
                <th>Số sao</th>
                <th>Nội dung</th>
                <th>Trạng thái</th>
                <th class="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filtered(); track item._id; let i = $index) {
                <tr>
                  <td class="cell-muted">{{ i + 1 }}</td>
                  <td class="cell-strong">{{ item.user?.fullName || item.user?.email || '—' }}</td>
                  <td>{{ item.product?.name || '—' }}</td>
                  <td>{{ item.rating }}/5</td>
                  <td class="cell-muted comment-cell">{{ item.comment || '—' }}</td>
                  <td>
                    <span
                      class="status-badge"
                      [class.completed]="item.approved"
                      [class.pending]="!item.approved"
                    >
                      {{ item.approved ? 'Đã duyệt' : 'Chờ duyệt' }}
                    </span>
                  </td>
                  <td class="col-actions">
                    <div class="icon-actions">
                      @if (!item.approved) {
                        <button type="button" class="btn-action secondary btn-sm" (click)="approve(item)">
                          Duyệt
                        </button>
                      }
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
      .comment-cell {
        max-width: 320px;
      }

      .btn-sm {
        padding: 0.35rem 0.65rem;
        font-size: 0.75rem;
      }
    `
  ]
})
export class ProductReviewsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly crumbs = productSectionCrumbs('Đánh giá sản phẩm');
  readonly loading = signal(true);
  readonly rows = signal<ReviewRow[]>([]);
  search = '';
  approvedFilter = '';

  filtered = () => {
    const q = this.search.trim().toLowerCase();
    return this.rows().filter((r) => {
      if (this.approvedFilter === 'yes' && !r.approved) return false;
      if (this.approvedFilter === 'no' && r.approved) return false;
      if (!q) return true;
      const hay = `${r.user?.fullName} ${r.user?.email} ${r.product?.name} ${r.comment}`;
      return hay.toLowerCase().includes(q);
    });
  };

  ngOnInit(): void {
    this.api.list<ReviewRow>('reviews').subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  approve(item: ReviewRow): void {
    this.api.update<ReviewRow>('reviews', item._id, { approved: true }).subscribe({
      next: () =>
        this.rows.update((list) =>
          list.map((r) => (r._id === item._id ? { ...r, approved: true } : r))
        )
    });
  }

  remove(item: ReviewRow): void {
    if (!confirm('Xóa đánh giá này?')) return;
    this.api.delete('reviews', item._id).subscribe({
      next: () => this.rows.update((list) => list.filter((r) => r._id !== item._id))
    });
  }
}
