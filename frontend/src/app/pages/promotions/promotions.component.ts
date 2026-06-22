import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';
import { ApiService } from '../../core/services/api.service';
import { VoucherRow } from '../../core/models/admin-list.models';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, RouterLink, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Mã giảm giá"
      subtitle="Voucher, mã giảm giá và điều kiện áp dụng"
      [breadcrumbs]="[
        { label: 'Trang chủ', route: '/admin/dashboard' },
        { label: 'Khuyến mãi', route: '/admin/promotions/vouchers' },
        { label: 'Mã giảm giá' }
      ]"
    >
      <a catalogActions routerLink="/admin/promotions/new" class="btn-action primary">+ Thêm voucher</a>

      <div pageToolbar class="catalog-filter-bar">
        <div class="filter-fields">
          <div class="search-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Tìm mã, tên chương trình..."
              [ngModel]="search()"
              (ngModelChange)="search.set($event); currentPage.set(1)"
            />
          </div>
          <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event); currentPage.set(1)">
            <option value="">Loại giảm</option>
            <option value="percent">Giảm theo %</option>
            <option value="fixed">Giảm cố định (đ)</option>
          </select>
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); currentPage.set(1)">
            <option value="">Trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm dừng</option>
            <option value="first">Khách mua lần đầu</option>
          </select>
        </div>
        <div class="filter-actions">
          <button type="button" class="btn-action secondary filter-btn" (click)="resetFilters()">Đặt lại</button>
        </div>
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải voucher...</div>
      } @else if (!filtered().length) {
        <div class="page-state">Không có voucher phù hợp.</div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table data-table--promotions">
            <thead>
              <tr>
                <th class="col-index">#</th>
                <th>Mã / Chương trình</th>
                <th>Giảm giá</th>
                <th>Đơn tối thiểu</th>
                <th>Điều kiện</th>
                <th>Đã dùng</th>
                <th>Cửa hàng</th>
                <th>Trạng thái</th>
                <th class="col-actions">Hành động</th>
              </tr>
            </thead>
            <tbody>
              @for (item of paged(); track item._id; let i = $index) {
                <tr>
                  <td class="col-index cell-muted">{{ rowIndex(i) }}</td>
                  <td>
                    <div class="code-cell">
                      <span class="code-badge">{{ item.code }}</span>
                      <div class="cell-strong">{{ item.name }}</div>
                      @if (item.description) {
                        <div class="cell-muted desc-line">{{ item.description }}</div>
                      }
                    </div>
                  </td>
                  <td>{{ discountLabel(item) }}</td>
                  <td>{{ item.minOrderAmount | number }} đ</td>
                  <td>
                    @if (item.firstOrderOnly) {
                      <span class="tag tag--first">Lần đầu mua</span>
                    } @else {
                      <span class="tag">Mọi khách</span>
                    }
                  </td>
                  <td class="cell-muted">
                    {{ item.usedCount | number }}
                    @if (item.usageLimit > 0) {
                      / {{ item.usageLimit | number }}
                    } @else {
                      / ∞
                    }
                  </td>
                  <td>
                    <label class="toggle" [attr.title]="item.showInStorePicker ? 'Đang hiển thị trên CH' : 'Ẩn trên CH'">
                      <input
                        type="checkbox"
                        [checked]="item.showInStorePicker"
                        (change)="toggleStorePicker(item, $event)"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <span class="status-badge" [class]="item.isActive ? 'completed' : 'cancelled'">
                      {{ item.isActive ? 'Hoạt động' : 'Tạm dừng' }}
                    </span>
                  </td>
                  <td class="col-actions">
                    <div class="icon-actions">
                      <button type="button" class="icon-round" title="Sửa" (click)="edit(item)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button type="button" class="icon-round" title="Bật/tắt" (click)="toggleActive(item)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
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
            <span>Hiển thị {{ rangeStart() }} – {{ rangeEnd() }} trong {{ filtered().length }} mã</span>
            <select class="page-size-select" [ngModel]="pageSize()" (ngModelChange)="setPageSize($event)">
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
    </app-admin-catalog-page>
  `,
  styles: [
    `
      .code-cell {
        min-width: 200px;
      }

      .code-badge {
        display: inline-block;
        padding: 0.15rem 0.5rem;
        margin-bottom: 0.25rem;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        background: #f3f4f6;
        border: 1px dashed #d1d5db;
        border-radius: 4px;
      }

      .desc-line {
        font-size: 0.75rem;
        margin-top: 0.15rem;
        max-width: 280px;
      }

      .tag {
        display: inline-block;
        padding: 0.2rem 0.45rem;
        font-size: 0.7rem;
        border-radius: 4px;
        background: #f3f4f6;
        color: var(--text-secondary);
      }

      .tag--first {
        background: #ecfdf5;
        color: #047857;
        font-weight: 600;
      }

      .data-table--promotions .col-actions {
        width: 120px;
      }
    `
  ]
})
export class PromotionsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly rows = signal<VoucherRow[]>([]);
  readonly search = signal('');
  readonly typeFilter = signal('');
  readonly statusFilter = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.rows().filter((row) => {
      if (q && !`${row.code} ${row.name} ${row.description || ''}`.toLowerCase().includes(q)) return false;
      if (this.typeFilter() && row.discountType !== this.typeFilter()) return false;
      if (this.statusFilter() === 'active' && !row.isActive) return false;
      if (this.statusFilter() === 'inactive' && row.isActive) return false;
      if (this.statusFilter() === 'first' && !row.firstOrderOnly) return false;
      return true;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));

  readonly paged = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list<VoucherRow>('vouchers').subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  discountLabel(item: VoucherRow): string {
    if (item.discountType === 'percent') {
      const cap =
        item.maxDiscountAmount && item.maxDiscountAmount > 0
          ? ` (tối đa ${item.maxDiscountAmount.toLocaleString('vi-VN')}đ)`
          : '';
      return `${item.discountValue}%${cap}`;
    }
    return `${item.discountValue.toLocaleString('vi-VN')} đ`;
  }

  resetFilters(): void {
    this.search.set('');
    this.typeFilter.set('');
    this.statusFilter.set('');
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
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
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

  edit(item: VoucherRow): void {
    this.router.navigate(['/admin/promotions', item._id, 'edit']);
  }

  toggleActive(item: VoucherRow): void {
    this.api.update<VoucherRow>('vouchers', item._id, { isActive: !item.isActive }).subscribe({
      next: () => this.load(),
      error: () => alert('Không cập nhật được trạng thái.')
    });
  }

  toggleStorePicker(item: VoucherRow, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.api.update<VoucherRow>('vouchers', item._id, { showInStorePicker: checked }).subscribe({
      next: () => this.load(),
      error: () => alert('Không cập nhật được hiển thị cửa hàng.')
    });
  }

  remove(item: VoucherRow): void {
    if (!confirm(`Xóa voucher "${item.code}"?`)) return;
    this.api.delete('vouchers', item._id).subscribe({
      next: () => this.load(),
      error: () => alert('Không xóa được voucher.')
    });
  }
}
