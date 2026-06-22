import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';
import { ApiService } from '../../core/services/api.service';
import { PostRow } from '../../core/models/admin-list.models';

interface DraftCounts {
  viewCount: number;
  likeCount: number;
  shareCount: number;
}

@Component({
  selector: 'app-post-interactions',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, RouterLink, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Lượt tương tác bài viết"
      subtitle="Theo dõi và chỉnh sửa lượt xem, thích, chia sẻ"
      [breadcrumbs]="[
        { label: 'Trang chủ', route: '/admin/dashboard' },
        { label: 'Quản lý bài viết', route: '/admin/posts' },
        { label: 'Lượt tương tác' }
      ]"
    >
      @if (loading()) {
        <div class="page-state">Đang tải thống kê...</div>
      } @else {
        <div class="interaction-stats" pageToolbar>
          <div class="stat-box">
            <span class="stat-label">Tổng lượt xem</span>
            <strong class="stat-value">{{ totals().viewCount | number }}</strong>
          </div>
          <div class="stat-box">
            <span class="stat-label">Tổng lượt thích</span>
            <strong class="stat-value">{{ totals().likeCount | number }}</strong>
          </div>
          <div class="stat-box">
            <span class="stat-label">Tổng lượt chia sẻ</span>
            <strong class="stat-value">{{ totals().shareCount | number }}</strong>
          </div>
        </div>

        <div class="catalog-filter-bar">
          <div class="filter-fields">
            <div class="search-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Tìm bài viết..."
                [ngModel]="search()"
                (ngModelChange)="search.set($event)"
              />
            </div>
          </div>
        </div>

        @if (!filtered().length) {
          <div class="page-state">Không có bài viết.</div>
        } @else {
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Bài viết</th>
                  <th>Lượt xem</th>
                  <th>Thích</th>
                  <th>Chia sẻ</th>
                  <th class="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (item of filtered(); track item._id) {
                  <tr>
                    <td>
                      <div class="cell-strong">{{ item.title }}</div>
                      <div class="cell-muted">/{{ item.slug }}</div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        class="count-input"
                        [ngModel]="draft(item).viewCount"
                        (ngModelChange)="patchDraft(item._id, 'viewCount', $event)"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        class="count-input"
                        [ngModel]="draft(item).likeCount"
                        (ngModelChange)="patchDraft(item._id, 'likeCount', $event)"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        class="count-input"
                        [ngModel]="draft(item).shareCount"
                        (ngModelChange)="patchDraft(item._id, 'shareCount', $event)"
                      />
                    </td>
                    <td class="col-actions">
                      <button
                        type="button"
                        class="btn-action primary compact"
                        [disabled]="savingId() === item._id"
                        (click)="saveCounts(item)"
                      >
                        {{ savingId() === item._id ? 'Đang lưu...' : 'Lưu' }}
                      </button>
                      <a [routerLink]="['/admin/posts', item._id, 'edit']" class="link-edit">Sửa bài</a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </app-admin-catalog-page>
  `,
  styles: [
    `
      .interaction-stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      @media (max-width: 768px) {
        .interaction-stats {
          grid-template-columns: 1fr;
        }
      }

      .stat-box {
        padding: 1rem 1.25rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
      }

      .stat-label {
        display: block;
        font-size: 0.75rem;
        color: var(--muted);
        margin-bottom: 0.25rem;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
      }

      .count-input {
        width: 100px;
        padding: 0.4rem 0.5rem;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 0.8125rem;
      }

      .col-actions {
        white-space: nowrap;
      }

      .btn-action.compact {
        padding: 0.35rem 0.75rem;
        font-size: 0.75rem;
      }

      .link-edit {
        display: inline-block;
        margin-left: 0.5rem;
        font-size: 0.75rem;
        color: var(--muted);
      }

      .link-edit:hover {
        color: var(--text);
      }
    `
  ]
})
export class PostInteractionsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly search = signal('');
  readonly savingId = signal<string | null>(null);
  readonly rows = signal<PostRow[]>([]);
  readonly totals = signal({ viewCount: 0, likeCount: 0, shareCount: 0 });
  private readonly drafts = signal<Record<string, DraftCounts>>({});

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.rows().filter((r) => !q || `${r.title} ${r.slug}`.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getPostInteractionStats().subscribe({
      next: (res) => {
        this.totals.set(res.totals);
        this.rows.set(res.posts);
        const map: Record<string, DraftCounts> = {};
        for (const p of res.posts) {
          map[p._id] = {
            viewCount: p.viewCount ?? 0,
            likeCount: p.likeCount ?? 0,
            shareCount: p.shareCount ?? 0
          };
        }
        this.drafts.set(map);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  draft(item: PostRow): DraftCounts {
    return (
      this.drafts()[item._id] ?? {
        viewCount: item.viewCount ?? 0,
        likeCount: item.likeCount ?? 0,
        shareCount: item.shareCount ?? 0
      }
    );
  }

  patchDraft(id: string, key: keyof DraftCounts, value: number): void {
    const n = Math.max(0, Number(value) || 0);
    this.drafts.update((m) => ({
      ...m,
      [id]: { ...m[id], [key]: n }
    }));
  }

  saveCounts(item: PostRow): void {
    const d = this.draft(item);
    this.savingId.set(item._id);
    this.api
      .update<PostRow>('posts', item._id, {
        viewCount: d.viewCount,
        likeCount: d.likeCount,
        shareCount: d.shareCount
      })
      .subscribe({
        next: () => {
          this.savingId.set(null);
          this.load();
        },
        error: () => {
          this.savingId.set(null);
          alert('Không cập nhật được số liệu.');
        }
      });
  }
}
