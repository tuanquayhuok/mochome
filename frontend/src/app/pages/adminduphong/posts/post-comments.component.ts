import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';
import { ApiService } from '../../core/services/api.service';
import { PostRow } from '../../core/models/admin-list.models';

interface CommentUser {
  _id: string;
  fullName: string;
  email: string;
}

interface CommentRow {
  _id: string;
  post: PostRow | null;
  user: CommentUser | null;
  content: string;
  parentId: string | null;
  likes: string[];
  isHidden?: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-post-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Quản lý bình luận"
      subtitle="Xem, duyệt ẩn/hiện hoặc xóa bình luận của các bài viết"
      [breadcrumbs]="[
        { label: 'Trang chủ', route: '/admin/dashboard' },
        { label: 'Quản lý bài viết', route: '/admin/posts' },
        { label: 'Quản lý bình luận' }
      ]"
    >
      <div pageToolbar class="catalog-filter-bar">
        <div class="filter-fields">
          <div class="search-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Tìm nội dung, tên người gửi..."
              [ngModel]="search()"
              (ngModelChange)="search.set($event); currentPage.set(1)"
            />
          </div>
          
          <select [ngModel]="postFilter()" (ngModelChange)="postFilter.set($event); currentPage.set(1)">
            <option value="">Tất cả bài viết</option>
            @for (p of posts(); track p._id) {
              <option [value]="p._id">{{ p.title }}</option>
            }
          </select>

          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); currentPage.set(1)">
            <option value="">Trạng thái</option>
            <option value="visible">Đang hiển thị</option>
            <option value="hidden">Đã ẩn</option>
          </select>
        </div>
        <div class="filter-actions">
          <button type="button" class="btn-action secondary filter-btn" (click)="resetFilters()">Đặt lại</button>
        </div>
      </div>

      @if (loading()) {
        <div class="page-state">Đang tải bình luận...</div>
      } @else if (!filtered().length) {
        <div class="page-state">Không tìm thấy bình luận nào.</div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table data-table--comments">
            <thead>
              <tr>
                <th class="col-index">#</th>
                <th>Người gửi</th>
                <th>Bài viết</th>
                <th>Nội dung</th>
                <th>Lượt thích</th>
                <th>Ngày gửi</th>
                <th>Hiển thị</th>
                <th class="col-actions">Hành động</th>
              </tr>
            </thead>
            <tbody>
              @for (item of paged(); track item._id; let i = $index) {
                <tr [class.comment-hidden]="item.isHidden">
                  <td class="col-index cell-muted">{{ rowIndex(i) }}</td>
                  <td>
                    <div class="user-info">
                      <div class="cell-strong">{{ item.user?.fullName || 'Khách' }}</div>
                      <div class="cell-muted">{{ item.user?.email || '—' }}</div>
                    </div>
                  </td>
                  <td>
                    @if (item.post) {
                      <div class="cell-strong text-ellipsis" [title]="item.post.title">{{ item.post.title }}</div>
                      <a [routerLink]="['/admin/posts', item.post._id, 'edit']" class="link-post-edit">Sửa bài viết</a>
                    } @else {
                      <span class="cell-muted">[Đã xóa bài viết]</span>
                    }
                  </td>
                  <td class="comment-content-cell">
                    <div class="comment-text">{{ item.content }}</div>
                    @if (item.parentId) {
                      <span class="reply-badge">Phản hồi</span>
                    }
                  </td>
                  <td>
                    <span class="badge badge-likes">
                      ♥ {{ item.likes?.length || 0 }}
                    </span>
                  </td>
                  <td class="cell-muted">{{ formatDate(item.createdAt) }}</td>
                  <td>
                    <label class="toggle" [attr.title]="!item.isHidden ? 'Đang hiển thị' : 'Đã ẩn'">
                      <input
                        type="checkbox"
                        [checked]="!item.isHidden"
                        (change)="toggleHide(item, $event)"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                  </td>
                  <td class="col-actions">
                    <div class="icon-actions">
                      <button type="button" class="icon-round danger" title="Xóa bình luận" (click)="remove(item)">
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
            <span>Hiển thị {{ rangeStart() }} – {{ rangeEnd() }} trong {{ filtered().length }} bình luận</span>
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
  `,
  styles: [
    `
      .text-ellipsis {
        max-width: 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .link-post-edit {
        font-size: 0.75rem;
        color: var(--primary);
        text-decoration: none;
      }
      .link-post-edit:hover {
        text-decoration: underline;
      }
      .comment-content-cell {
        max-width: 250px;
      }
      .comment-text {
        white-space: normal;
        word-break: break-word;
        font-size: 0.875rem;
        line-height: 1.4;
      }
      .reply-badge {
        display: inline-block;
        font-size: 0.7rem;
        background: #e2e8f0;
        color: #4a5568;
        padding: 0.1rem 0.35rem;
        border-radius: 4px;
        margin-top: 0.25rem;
      }
      .badge-likes {
        font-size: 0.75rem;
        color: #e53e3e;
        background: #fff5f5;
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        border: 1px solid #fed7d7;
      }
      .comment-hidden {
        background-color: rgba(0, 0, 0, 0.02);
      }
      .comment-hidden .comment-text {
        color: var(--muted);
        text-decoration: line-through;
      }
      .data-table--comments th,
      .data-table--comments td {
        vertical-align: middle;
      }
    `
  ]
})
export class PostCommentsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly comments = signal<CommentRow[]>([]);
  readonly posts = signal<PostRow[]>([]);
  readonly search = signal('');
  readonly postFilter = signal('');
  readonly statusFilter = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const targetPost = this.postFilter();
    const status = this.statusFilter();

    return this.comments().filter((c) => {
      // Search query
      const matchSearch =
        !q ||
        (c.content || '').toLowerCase().includes(q) ||
        (c.user?.fullName || '').toLowerCase().includes(q) ||
        (c.user?.email || '').toLowerCase().includes(q);
      if (!matchSearch) return false;

      // Post filter
      if (targetPost && (!c.post || c.post._id !== targetPost)) return false;

      // Status filter
      if (status === 'visible' && c.isHidden) return false;
      if (status === 'hidden' && !c.isHidden) return false;

      return true;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));

  readonly paged = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadComments();
    this.loadPosts();
  }

  loadComments(): void {
    this.loading.set(true);
    this.api.list<CommentRow>('comments').subscribe({
      next: (rows) => {
        this.comments.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadPosts(): void {
    this.api.list<PostRow>('posts').subscribe({
      next: (rows) => this.posts.set(rows),
      error: () => {}
    });
  }

  resetFilters(): void {
    this.search.set('');
    this.postFilter.set('');
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
    return new Date(value).toLocaleString('vi-VN');
  }

  toggleHide(item: CommentRow, event: Event): void {
    const isVisible = (event.target as HTMLInputElement).checked;
    const isHidden = !isVisible;
    this.api.update<CommentRow>('comments', item._id, { isHidden }).subscribe({
      next: () => this.loadComments(),
      error: () => alert('Không cập nhật được trạng thái ẩn/hiện.')
    });
  }

  remove(item: CommentRow): void {
    const sender = item.user?.fullName || 'Khách';
    if (!confirm(`Xóa vĩnh viễn bình luận của "${sender}"?`)) return;
    this.api.delete('comments', item._id).subscribe({
      next: () => this.loadComments(),
      error: () => alert('Không xóa được bình luận.')
    });
  }
}
