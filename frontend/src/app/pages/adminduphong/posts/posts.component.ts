import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';
import { ApiService } from '../../core/services/api.service';
import { PostRow } from '../../core/models/admin-list.models';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Quản lý bài viết"
      subtitle="Tất cả bài viết trên website"
      [breadcrumbs]="[
        { label: 'Trang chủ', route: '/admin/dashboard' },
        { label: 'Quản lý bài viết' }
      ]"
    >
      <a catalogActions routerLink="/admin/posts/new" class="btn-action primary">+ Viết bài mới</a>

      <div pageToolbar class="catalog-filter-bar">
        <div class="filter-fields">
          <div class="search-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Tìm bài viết, slug..."
              [ngModel]="search()"
              (ngModelChange)="search.set($event); currentPage.set(1)"
            />
          </div>
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); currentPage.set(1)">
            <option value="">Trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Nháp</option>
            <option value="hidden">Đã ẩn</option>
          </select>
        </div>
        <div class="filter-actions">
          <button type="button" class="btn-action secondary filter-btn" (click)="resetFilters()">Đặt lại</button>
        </div>
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải bài viết...</div>
      } @else if (!filtered().length) {
        <div class="page-state">Không có bài viết phù hợp.</div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table data-table--posts">
            <thead>
              <tr>
                <th class="col-index">#</th>
                <th>Bài viết</th>
                <th>Lượt xem</th>
                <th>Thích</th>
                <th>Trạng thái</th>
                <th>Hiển thị</th>
                <th>Ngày tạo</th>
                <th class="col-actions">Hành động</th>
              </tr>
            </thead>
            <tbody>
              @for (item of paged(); track item._id; let i = $index) {
                <tr>
                  <td class="col-index cell-muted">{{ rowIndex(i) }}</td>
                  <td>
                    <div class="post-cell">
                      <div class="post-thumb">
                        @if (item.thumbnail) {
                          <img [src]="item.thumbnail" [alt]="item.title" />
                        }
                      </div>
                      <div>
                        <div class="cell-strong">{{ item.title }}</div>
                        <div class="cell-muted slug-line">/{{ item.slug }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ (item.viewCount ?? 0) | number }}</td>
                  <td>{{ (item.likeCount ?? 0) | number }}</td>
                  <td>
                    <span class="status-badge" [class]="statusClass(item)">
                      {{ statusLabel(item) }}
                    </span>
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
                      <button type="button" class="icon-round" title="Xuất bản/Nháp" (click)="togglePublish(item)">
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
            <span>Hiển thị {{ rangeStart() }} – {{ rangeEnd() }} trong {{ filtered().length }} bài</span>
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
      .post-cell {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 220px;
      }

      .post-thumb {
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        border-radius: 6px;
        border: 1px solid var(--border-light);
        background: #f3f4f6;
        overflow: hidden;
      }

      .post-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .slug-line {
        font-size: 0.75rem;
        margin-top: 0.15rem;
      }

      .data-table--posts .col-actions {
        width: 120px;
      }
    `
  ]
})
export class PostsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly rows = signal<PostRow[]>([]);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.rows().filter((row) => {
      if (q && !`${row.title} ${row.slug} ${row.excerpt || ''}`.toLowerCase().includes(q)) return false;
      if (this.statusFilter() === 'published' && !row.published) return false;
      if (this.statusFilter() === 'draft' && row.published) return false;
      if (this.statusFilter() === 'hidden' && row.isVisible !== false) return false;
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
    this.api.list<PostRow>('posts').subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  resetFilters(): void {
    this.search.set('');
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

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('vi-VN');
  }

  statusLabel(item: PostRow): string {
    if (!item.published) return 'Nháp';
    return 'Đã xuất bản';
  }

  statusClass(item: PostRow): string {
    if (!item.published) return 'pending';
    return 'completed';
  }

  edit(item: PostRow): void {
    this.router.navigate(['/admin/posts', item._id, 'edit']);
  }

  toggleVisible(item: PostRow, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.api.update<PostRow>('posts', item._id, { isVisible: checked }).subscribe({
      next: () => this.load(),
      error: () => alert('Không cập nhật được trạng thái hiển thị.')
    });
  }

  togglePublish(item: PostRow): void {
    const next = !item.published;
    const msg = next ? `Xuất bản "${item.title}"?` : `Chuyển "${item.title}" về nháp?`;
    if (!confirm(msg)) return;
    this.api.update<PostRow>('posts', item._id, { published: next }).subscribe({
      next: () => this.load(),
      error: () => alert('Thao tác thất bại.')
    });
  }

  remove(item: PostRow): void {
    if (!confirm(`Xóa bài viết "${item.title}"?`)) return;
    this.api.delete('posts', item._id).subscribe({
      next: () => this.load(),
      error: () => alert('Không xóa được bài viết.')
    });
  }
}
