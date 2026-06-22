import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="store-section store-section--white">
      <div class="store-container post-wrap">
        <nav class="store-breadcrumb" aria-label="Đường dẫn">
          <a routerLink="/">Trang chủ</a>
          <span aria-hidden="true">›</span>
          <a routerLink="/tin-tuc">Bài viết</a>
          <span aria-hidden="true">›</span>
          <span>{{ title() }}</span>
        </nav>

        <article class="post">
          <h1>{{ title() }}</h1>
          <p class="meta">Đăng bởi Mộc Home • 01/06/2026</p>
          <div class="post-body">
            <p>Nội dung bài viết sẽ được cập nhật từ hệ thống quản trị.</p>
            <p>Trong thời gian chờ, bạn có thể khám phá thêm sản phẩm và bộ sưu tập nội thất gỗ tự nhiên tại Mộc Home.</p>
          </div>
          <a routerLink="/tin-tuc" class="back-link">← Quay lại danh sách bài viết</a>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .post-wrap {
        max-width: 760px;
      }

      .post h1 {
        margin: 0 0 0.5rem;
        font-size: clamp(1.35rem, 4vw, 1.75rem);
        line-height: 1.25;
        color: #1a1d21;
      }

      .meta {
        margin: 0 0 1.25rem;
        font-size: 0.8125rem;
        color: #9ca3af;
      }

      .post-body {
        background: #fff;
        padding: 1.25rem 1.35rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9375rem;
        line-height: 1.7;
        color: #374151;
      }

      .post-body p {
        margin: 0 0 1rem;
      }

      .back-link {
        display: inline-block;
        margin-top: 1.25rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #5c4033;
        text-decoration: none;
      }

      .back-link:hover {
        text-decoration: underline;
      }
    `
  ]
})
export class PostDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly title = signal('Bài viết');

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.title.set(decodeURIComponent(slug.replace(/-/g, ' ')) || 'Bài viết');
  }
}
