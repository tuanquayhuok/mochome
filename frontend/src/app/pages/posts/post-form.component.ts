import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { PostRow } from '../../core/models/admin-list.models';
import { slugify } from '../../core/utils/slugify';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="post-form-page">
      <header class="form-page-head">
        <nav class="catalog-crumbs" aria-label="Breadcrumb">
          <a routerLink="/admin/dashboard">Trang chủ</a>
          <span class="sep">›</span>
          <a routerLink="/admin/posts">Quản lý bài viết</a>
          <span class="sep">›</span>
          <span class="current">{{ pageTitle() }}</span>
        </nav>
        <h1>{{ pageTitle() }}</h1>
      </header>

      @if (loadError()) {
        <div class="form-alert error">{{ loadError() }}</div>
      }
      @if (saveError()) {
        <div class="form-alert error">{{ saveError() }}</div>
      }

      <form class="form-layout" (ngSubmit)="submit(false)">
        <div class="form-main">
          <section class="form-card">
            <h2 class="card-title">Nội dung bài viết</h2>

            <label class="field">
              <span class="label">Tiêu đề <em>*</em></span>
              <input
                type="text"
                name="title"
                [(ngModel)]="title"
                (ngModelChange)="onTitleChange($event)"
                placeholder="Nhập tiêu đề bài viết"
                required
              />
            </label>

            <label class="field">
              <span class="label">Slug</span>
              <input
                type="text"
                name="slug"
                [(ngModel)]="slug"
                (ngModelChange)="slugTouched = true"
                placeholder="slug-bai-viet"
              />
              <span class="hint">Tự sinh từ tiêu đề nếu để trống khi lưu.</span>
            </label>

            <label class="field">
              <span class="label">Mô tả ngắn</span>
              <textarea name="excerpt" [(ngModel)]="excerpt" rows="3" placeholder="Tóm tắt hiển thị danh sách..."></textarea>
            </label>

            <label class="field">
              <span class="label">Nội dung <em>*</em></span>
              <textarea
                name="content"
                [(ngModel)]="content"
                rows="12"
                placeholder="Nội dung bài viết (HTML hoặc văn bản)..."
                required
              ></textarea>
            </label>
          </section>
        </div>

        <aside class="form-side">
          <section class="form-card">
            <h2 class="card-title">Xuất bản</h2>

            <label class="field checkbox-field">
              <input type="checkbox" name="published" [(ngModel)]="published" />
              <span>Xuất bản ngay</span>
            </label>

            <label class="field checkbox-field">
              <input type="checkbox" name="isVisible" [(ngModel)]="isVisible" />
              <span>Hiển thị trên website</span>
            </label>

            <label class="field">
              <span class="label">Ảnh thumbnail (URL)</span>
              <input type="url" name="thumbnail" [(ngModel)]="thumbnail" placeholder="https://..." />
            </label>

            @if (thumbnail) {
              <img class="thumb-preview" [src]="thumbnail" alt="" />
            }

            <div class="side-actions">
              <button type="submit" class="btn-action primary" [disabled]="saving()">
                {{ saving() ? 'Đang lưu...' : postId ? 'Cập nhật' : 'Tạo bài viết' }}
              </button>
              <button type="button" class="btn-action secondary" [disabled]="saving()" (click)="submit(true)">
                Lưu nháp
              </button>
              <a routerLink="/admin/posts" class="btn-action ghost">Hủy</a>
            </div>
          </section>
        </aside>
      </form>
    </div>
  `,
  styles: [
    `
      .post-form-page {
        width: 100%;
        padding-bottom: 3rem;
      }

      .form-page-head {
        margin-bottom: 1.25rem;
      }

      .form-page-head h1 {
        margin: 0.35rem 0 0;
        font-size: 1.35rem;
        font-weight: 600;
      }

      .catalog-crumbs {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.8125rem;
        color: var(--muted);
      }

      .catalog-crumbs a {
        color: var(--muted);
        text-decoration: none;
      }

      .catalog-crumbs a:hover {
        color: var(--text);
      }

      .catalog-crumbs .current {
        color: var(--text);
      }

      .sep {
        opacity: 0.5;
      }

      .form-layout {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 1rem;
        align-items: start;
      }

      @media (max-width: 900px) {
        .form-layout {
          grid-template-columns: 1fr;
        }
      }

      .form-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 1.25rem;
      }

      .card-title {
        margin: 0 0 1rem;
        font-size: 0.9375rem;
        font-weight: 600;
      }

      .field {
        display: block;
        margin-bottom: 1rem;
      }

      .label {
        display: block;
        margin-bottom: 0.35rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      .label em {
        color: #dc2626;
        font-style: normal;
      }

      .field input,
      .field textarea {
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.8125rem;
        background: var(--surface);
      }

      .field textarea {
        resize: vertical;
        min-height: 80px;
      }

      .hint {
        display: block;
        margin-top: 0.35rem;
        font-size: 0.75rem;
        color: var(--muted);
      }

      .checkbox-field {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
      }

      .checkbox-field input {
        width: auto;
      }

      .thumb-preview {
        width: 100%;
        max-height: 140px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 1rem;
        border: 1px solid var(--border);
      }

      .side-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .btn-action.ghost {
        text-align: center;
        text-decoration: none;
        color: var(--muted);
      }

      .form-alert {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.8125rem;
      }

      .form-alert.error {
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fecaca;
      }
    `
  ]
})
export class PostFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  postId: string | null = null;
  slugTouched = false;

  title = '';
  slug = '';
  excerpt = '';
  content = '';
  thumbnail = '';
  published = false;
  isVisible = true;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);

  readonly pageTitle = computed(() => (this.postId ? 'Sửa bài viết' : 'Viết bài mới'));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.postId = id;
      this.loadPost(id);
    }
  }

  onTitleChange(value: string): void {
    if (!this.slugTouched) {
      this.slug = slugify(value);
    }
  }

  loadPost(id: string): void {
    this.loading.set(true);
    this.api.get<PostRow>('posts', id).subscribe({
      next: (p) => {
        this.title = p.title;
        this.slug = p.slug;
        this.slugTouched = true;
        this.excerpt = p.excerpt || '';
        this.content = p.content || '';
        this.thumbnail = p.thumbnail || '';
        this.published = Boolean(p.published);
        this.isVisible = p.isVisible !== false;
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Không tải được bài viết.');
        this.loading.set(false);
      }
    });
  }

  submit(asDraft: boolean): void {
    this.saveError.set(null);

    if (!this.title.trim()) {
      this.saveError.set('Vui lòng nhập tiêu đề.');
      return;
    }
    if (!this.content.trim()) {
      this.saveError.set('Vui lòng nhập nội dung.');
      return;
    }

    const payload = {
      title: this.title.trim(),
      slug: slugify(this.slug || this.title),
      excerpt: this.excerpt,
      content: this.content,
      thumbnail: this.thumbnail.trim(),
      published: asDraft ? false : this.published,
      isVisible: this.isVisible
    };

    this.saving.set(true);

    const done = () => {
      this.saving.set(false);
      this.router.navigate(['/admin/posts']);
    };

    const onError = (err: { error?: { message?: string } }) => {
      this.saving.set(false);
      this.saveError.set(err?.error?.message || 'Không lưu được bài viết.');
    };

    if (this.postId) {
      this.api.update<PostRow>('posts', this.postId, payload).subscribe({ next: done, error: onError });
    } else {
      this.api.create<PostRow>('posts', payload).subscribe({ next: done, error: onError });
    }
  }
}
