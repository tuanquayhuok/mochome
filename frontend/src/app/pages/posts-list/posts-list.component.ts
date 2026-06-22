import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="store-section store-section--white">
      <div class="store-container">
        <header class="store-page-head">
          <div>
            <nav class="store-breadcrumb" aria-label="Đường dẫn">
              <a routerLink="/">Trang chủ</a>
              <span aria-hidden="true">›</span>
              <span>Bài viết</span>
            </nav>
            <h1>Bài viết</h1>
            <p>Cẩm nang nội thất & xu hướng trang trí</p>
          </div>
        </header>

        <div class="news-grid">
          @for (post of posts(); track post.slug) {
            <article class="news-card">
              <a [routerLink]="['/bai-viet', post.slug]" class="news-thumb" aria-hidden="true"></a>
              <div class="news-body">
                <h3>
                  <a [routerLink]="['/bai-viet', post.slug]">{{ post.title }}</a>
                </h3>
                <p>{{ post.excerpt }}</p>
                <a [routerLink]="['/bai-viet', post.slug]" class="read-more">Đọc tiếp →</a>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .news-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.25rem;
      }

      .news-card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
        display: flex;
        flex-direction: column;
      }

      .news-thumb {
        display: block;
        aspect-ratio: 16 / 10;
        background: linear-gradient(135deg, #eceef1, #dfe3e8);
      }

      .news-body {
        padding: 1rem 1.1rem 1.15rem;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .news-body h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
        line-height: 1.35;
      }

      .news-body h3 a {
        color: #1a1d21;
        text-decoration: none;
      }

      .news-body h3 a:hover {
        color: #5c4033;
      }

      .news-body p {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        color: #6b7280;
        line-height: 1.5;
        flex: 1;
      }

      .read-more {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #5c4033;
        text-decoration: none;
      }

      .read-more:hover {
        text-decoration: underline;
      }

      @media (max-width: 640px) {
        .news-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class PostsListComponent implements OnInit {
  readonly posts = signal<{ title: string; slug: string; excerpt?: string }[]>([]);

  ngOnInit(): void {
    this.posts.set([
      {
        title: '5 xu hướng nội thất hiện đại 2026',
        slug: 'xu-huong-2026',
        excerpt: 'Tổng hợp xu hướng nội thất được ưa chuộng nhất năm nay...'
      },
      {
        title: 'Cách chọn sofa phù hợp',
        slug: 'cach-chon-sofa',
        excerpt: 'Hướng dẫn chọn sofa theo không gian và phong cách...'
      }
    ]);
  }
}
