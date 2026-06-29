import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { PublicApiService, CollectionRow } from '../../core/services/public-api.service';

const COLLECTION_IMAGES: Record<string, string> = {
  'japandi': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
  'scandinavian': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  'co-dien': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

@Component({
  selector: 'app-collections-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="collections-page">
      <!-- Header Hero -->
      <section class="hero-header" aria-labelledby="collections-title">
        <div class="container hero-container">
          <h1 id="collections-title">BỘ SƯU TẬP NỔI BẬT</h1>
          <p class="hero-sub">Khám phá các phong cách nội thất đặc trưng được may đo theo các chủ đề thiết kế độc đáo của Mộc Home.</p>
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a routerLink="/">Trang chủ</a>
            <span aria-hidden="true">/</span>
            <span class="current">Bộ sưu tập</span>
          </nav>
        </div>
      </section>

      <!-- Collections Grid -->
      <section class="collections-list block">
        <div class="container">
          @if (loading()) {
            <div class="state-msg">Đang tải danh sách bộ sưu tập...</div>
          } @else if (error()) {
            <div class="state-msg error">{{ error() }}</div>
          } @else if (!collections().length) {
            <div class="state-msg">Chưa có bộ sưu tập nào được công bố.</div>
          } @else {
            <div class="collections-grid">
              @for (col of collections(); track col._id) {
                <div class="col-card">
                  <div class="col-image">
                    <img [src]="getCollectionImage(col.slug)" [alt]="col.name" />
                    <div class="col-overlay">
                      <a [routerLink]="['/bo-suu-tap', col.slug]" class="btn-discover">KHÁM PHÁ CHI TIẾT</a>
                    </div>
                  </div>
                  <div class="col-info">
                    <h3>{{ col.name }}</h3>
                    <p>{{ col.description || 'Bộ sưu tập nội thất cao cấp phong cách ' + col.name }}</p>
                    <a [routerLink]="['/bo-suu-tap', col.slug]" class="btn-text-link">Xem sản phẩm →</a>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .collections-page {
        background: #fff;
        color: #2c2520;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.25rem;
      }

      .block {
        padding: 4.5rem 0;
      }

      /* Hero */
      .hero-header {
        background: linear-gradient(180deg, #faf6f3 0%, #ffffff 100%);
        border-bottom: 1px solid #eae6e2;
        padding: 3rem 0;
        text-align: center;
      }

      .hero-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .hero-header h1 {
        margin: 0;
        font-size: clamp(1.5rem, 3.5vw, 2.25rem);
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #2c2520;
      }

      .hero-sub {
        margin: 0;
        font-size: 0.9375rem;
        color: #7a6e67;
        max-width: 600px;
        line-height: 1.6;
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: #a3978e;
        margin-top: 0.5rem;
      }

      .breadcrumb a {
        color: #8c7e74;
        text-decoration: none;
        transition: color 0.2s;
      }

      .breadcrumb a:hover {
        color: #2c2520;
      }

      .breadcrumb .current {
        color: #a3978e;
      }

      /* State msg */
      .state-msg {
        text-align: center;
        padding: 3rem;
        font-size: 1rem;
        color: #7a6e67;
      }

      .state-msg.error {
        color: #dc2626;
      }

      /* Grid Layout */
      .collections-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2.5rem 2rem;
      }

      .col-card {
        background: #fff;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #eae6e2;
        box-shadow: 0 4px 15px rgba(140, 113, 97, 0.02);
        display: flex;
        flex-direction: column;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }

      .col-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(140, 113, 97, 0.08);
      }

      .col-image {
        position: relative;
        aspect-ratio: 4 / 3;
        overflow: hidden;
        background: #fbf9f7;
      }

      .col-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s ease;
      }

      .col-card:hover .col-image img {
        transform: scale(1.08);
      }

      .col-overlay {
        position: absolute;
        inset: 0;
        background: rgba(44, 37, 32, 0.4);
        opacity: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.3s ease;
      }

      .col-card:hover .col-overlay {
        opacity: 1;
      }

      .btn-discover {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: #fff;
        color: #2c2520;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-decoration: none;
        border-radius: 4px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        transition: background 0.2s, transform 0.2s;
      }

      .btn-discover:hover {
        background: #faf6f3;
        transform: scale(1.05);
      }

      .col-info {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }

      .col-info h3 {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
        font-weight: 700;
        color: #2c2520;
      }

      .col-info p {
        margin: 0 0 1.25rem;
        font-size: 0.875rem;
        color: #7a6e67;
        line-height: 1.6;
        flex-grow: 1;
      }

      .btn-text-link {
        color: #8c7161;
        font-size: 0.8125rem;
        font-weight: 700;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        transition: color 0.2s;
      }

      .btn-text-link:hover {
        color: #4a3e35;
      }

      @media (max-width: 991px) {
        .collections-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
      }

      @media (max-width: 640px) {
        .collections-grid {
          grid-template-columns: 1fr;
        }
        .block {
          padding: 3rem 0;
        }
      }
    `
  ]
})
export class CollectionsListComponent implements OnInit {
  private readonly publicApi = inject(PublicApiService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  readonly collections = signal<CollectionRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.titleService.setTitle('Bộ sưu tập nổi bật — Mộc Home');
    this.metaService.updateTag({
      name: 'description',
      content: 'Khám phá các bộ sưu tập nội thất Japandi, Scandinavian, Cổ điển đặc trưng thiết kế độc bản bởi Mộc Home.'
    });

    this.publicApi.getCollections().subscribe({
      next: (res) => {
        this.collections.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching collections', err);
        this.error.set('Không thể tải danh sách bộ sưu tập. Vui lòng thử lại sau.');
        this.loading.set(false);
      }
    });
  }

  getCollectionImage(slug: string): string {
    return COLLECTION_IMAGES[slug] || DEFAULT_IMAGE;
  }
}
