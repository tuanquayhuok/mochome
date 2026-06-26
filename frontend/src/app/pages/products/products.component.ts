import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CategoryRow, ProductRow, ProductSaleStatus } from '../../core/models/admin-list.models';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';
import { productSectionCrumbs } from '../../shared/admin-product-section.config';

const STATUS_LABEL: Record<ProductSaleStatus, string> = {
  selling: 'Đang bán',
  out_of_stock: 'Hết hàng',
  stopped: 'Ngừng bán'
};

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, RouterLink, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Quản lý sản phẩm"
      subtitle="Danh sách tất cả sản phẩm trong hệ thống"
      [breadcrumbs]="crumbs"
    >
      <a catalogActions routerLink="/admin/products/new" class="btn-action primary">+ Thêm sản phẩm mới</a>

      <div pageToolbar class="catalog-filter-bar">
        <div class="filter-fields">
          <div class="search-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Tìm kiếm sản phẩm..."
              [ngModel]="search()"
              (ngModelChange)="search.set($event); currentPage.set(1)"
            />
          </div>
          <select [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event); currentPage.set(1)">
            <option value="">Danh mục</option>
            @for (c of categories(); track c._id) {
              <option [value]="c._id">{{ c.name }}</option>
            }
          </select>
          <select [ngModel]="collectionFilter()" (ngModelChange)="collectionFilter.set($event); currentPage.set(1)">
            <option value="">Bộ sưu tập</option>
            @for (col of collectionOptions(); track col) {
              <option [value]="col">{{ col }}</option>
            }
          </select>
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); currentPage.set(1)">
            <option value="">Trạng thái</option>
            <option value="selling">Đang bán</option>
            <option value="out_of_stock">Hết hàng</option>
            <option value="stopped">Ngừng bán</option>
          </select>
          <select [ngModel]="visibleFilter()" (ngModelChange)="visibleFilter.set($event); currentPage.set(1)">
            <option value="">Hiển thị</option>
            <option value="yes">Đang hiển thị</option>
            <option value="no">Đã ẩn</option>
          </select>
        </div>
        <div class="filter-actions">
          <button type="button" class="btn-action secondary filter-btn" (click)="applyFilters()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            Bộ lọc
          </button>
          <button type="button" class="btn-action secondary filter-btn" (click)="resetFilters()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M3 12a9 9 0 0115-6.7L21 3v6h-6M21 12a9 9 0 01-15 6.7L3 21v-6h6" />
            </svg>
            Đặt lại
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải danh sách sản phẩm...</div>
      } @else if (!filtered().length) {
        <div class="page-state">Không có sản phẩm phù hợp bộ lọc.</div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table data-table--products">
            <thead>
              <tr>
                <th class="col-check">
                  <input
                    type="checkbox"
                    [checked]="allPageSelected()"
                    (change)="toggleSelectAll($event)"
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th class="col-index">#</th>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Bộ sưu tập</th>
                <th>Giá (đ)</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Nổi bật</th>
                <th>Hiển thị</th>
                <th>Ngày tạo</th>
                <th class="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (item of paged(); track item._id; let i = $index) {
                <tr [class.row-selected]="isSelected(item._id)">
                  <td class="col-check">
                    <input
                      type="checkbox"
                      [checked]="isSelected(item._id)"
                      (change)="toggleSelect(item._id)"
                    />
                  </td>
                  <td class="col-index cell-muted">{{ rowIndex(i) }}</td>
                  <td>
                    <div class="product-cell">
                      <div class="product-thumb">
                        @if (item.imageUrl) {
                          <img [src]="item.imageUrl" [alt]="item.name" />
                        }
                      </div>
                      <div>
                        <div class="cell-strong">{{ item.name }}</div>
                        <div class="cell-muted sku-line">SKU: {{ item.sku }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ item.category?.name || '—' }}</td>
                  <td>{{ item.collection || '—' }}</td>
                  <td>{{ item.price | number }}</td>
                  <td>{{ item.stock }}</td>
                  <td>
                    <span class="status-badge" [class]="saleStatusClass(item)">
                      {{ statusLabel(item) }}
                    </span>
                  </td>
                  <td>
                    <label class="toggle" [attr.title]="item.featured ? 'Sản phẩm nổi bật' : 'Bình thường'">
                      <input
                        type="checkbox"
                        [checked]="item.featured === true"
                        (change)="toggleFeatured(item, $event)"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <label class="toggle" [attr.title]="item.isVisible !== false ? 'Đang hiển thị' : 'Đã ẩn'">
                      <input
                        type="checkbox"
                        [checked]="item.isVisible !== false"
                        (change)="toggleVisible(item, $event)"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                  </td>
                  <td class="cell-muted">{{ formatDate(item.createdAt) }}</td>
                  <td class="col-actions">
                    <div class="icon-actions">
                      <button type="button" class="icon-round" title="Sửa" (click)="edit(item)">
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
          <div class="bulk-left">
            <select class="bulk-select" [(ngModel)]="bulkAction">
              <option value="">Chọn hành động</option>
              <option value="show">Hiển thị</option>
              <option value="hide">Ẩn</option>
              <option value="delete">Xóa</option>
            </select>
            <button type="button" class="btn-action secondary" (click)="applyBulk()">Áp dụng</button>
          </div>
          <div class="bulk-right">
            <span>
              Hiển thị {{ rangeStart() }} – {{ rangeEnd() }} trong {{ filtered().length }} kết quả
            </span>
            <select class="page-size-select" [ngModel]="pageSize()" (ngModelChange)="setPageSize($event)">
              <option [ngValue]="10">10 / trang</option>
              <option [ngValue]="20">20 / trang</option>
              <option [ngValue]="50">50 / trang</option>
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
  `
})
export class ProductsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly crumbs = productSectionCrumbs('Sản phẩm');

  readonly loading = signal(true);
  readonly rows = signal<ProductRow[]>([]);
  readonly categories = signal<CategoryRow[]>([]);

  readonly search = signal('');
  readonly categoryFilter = signal('');
  readonly collectionFilter = signal('');
  readonly statusFilter = signal('');
  readonly visibleFilter = signal('');

  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly selectedIds = signal<Set<string>>(new Set());
  bulkAction = '';

  readonly collectionOptions = computed(() => {
    const set = new Set<string>();
    this.rows().forEach((r) => {
      if (r.collection) set.add(r.collection);
    });
    return [...set].sort();
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.rows().filter((row) => {
      if (q && !`${row.name} ${row.sku}`.toLowerCase().includes(q)) return false;
      const catId =
        typeof row.category === 'string' ? row.category : row.category?._id;
      if (this.categoryFilter() && catId !== this.categoryFilter()) return false;
      if (this.collectionFilter() && row.collection !== this.collectionFilter()) return false;
      const status = row.saleStatus || this.inferStatus(row);
      if (this.statusFilter() && status !== this.statusFilter()) return false;
      if (this.visibleFilter() === 'yes' && row.isVisible === false) return false;
      if (this.visibleFilter() === 'no' && row.isVisible !== false) return false;
      return true;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize()))
  );

  readonly paged = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.api.list<CategoryRow>('categories').subscribe({
      next: (cats) => this.categories.set(cats)
    });

    this.api.list<ProductRow>('products').subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.categoryFilter.set('');
    this.collectionFilter.set('');
    this.statusFilter.set('');
    this.visibleFilter.set('');
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
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (cur > 3) pages.push('…');
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) {
      pages.push(p);
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

  inferStatus(row: ProductRow): ProductSaleStatus {
    if (row.stock === 0) return 'out_of_stock';
    if (row.stock <= 2) return 'stopped';
    return 'selling';
  }

  statusLabel(row: ProductRow): string {
    return STATUS_LABEL[row.saleStatus || this.inferStatus(row)];
  }

  saleStatusClass(row: ProductRow): string {
    const s = row.saleStatus || this.inferStatus(row);
    if (s === 'selling') return 'completed';
    if (s === 'out_of_stock') return 'cancelled';
    return 'pending';
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('vi-VN');
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  allPageSelected(): boolean {
    const page = this.paged();
    return page.length > 0 && page.every((r) => this.selectedIds().has(r._id));
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds.update((set) => {
      const next = new Set(set);
      this.paged().forEach((r) => {
        if (checked) next.add(r._id);
        else next.delete(r._id);
      });
      return next;
    });
  }

  toggleVisible(item: ProductRow, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.api.update<ProductRow>('products', item._id, { isVisible: checked }).subscribe({
      next: (updated) => {
        this.rows.update((list) => list.map((r) => (r._id === item._id ? { ...r, ...updated } : r)));
      }
    });
  }

  toggleFeatured(item: ProductRow, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.api.update<ProductRow>('products', item._id, { featured: checked }).subscribe({
      next: (updated) => {
        this.rows.update((list) => list.map((r) => (r._id === item._id ? { ...r, ...updated } : r)));
      }
    });
  }

  edit(item: ProductRow): void {
    this.router.navigate(['/admin/products', item._id, 'edit']);
  }

  remove(item: ProductRow): void {
    if (!confirm(`Xóa sản phẩm "${item.name}"?`)) return;
    this.api.delete('products', item._id).subscribe({
      next: () => {
        this.rows.update((list) => list.filter((r) => r._id !== item._id));
        this.selectedIds.update((set) => {
          const next = new Set(set);
          next.delete(item._id);
          return next;
        });
      }
    });
  }

  applyBulk(): void {
    const ids = [...this.selectedIds()];
    if (!ids.length || !this.bulkAction) return;

    if (this.bulkAction === 'delete') {
      if (!confirm(`Xóa ${ids.length} sản phẩm đã chọn?`)) return;
      ids.forEach((id) => {
        this.api.delete('products', id).subscribe({
          next: () => this.rows.update((list) => list.filter((r) => r._id !== id))
        });
      });
      this.selectedIds.set(new Set());
      return;
    }

    const isVisible = this.bulkAction === 'show';
    ids.forEach((id) => {
      this.api.update('products', id, { isVisible }).subscribe({
        next: () =>
          this.rows.update((list) =>
            list.map((r) => (r._id === id ? { ...r, isVisible } : r))
          )
      });
    });
    this.selectedIds.set(new Set());
    this.bulkAction = '';
  }
}
