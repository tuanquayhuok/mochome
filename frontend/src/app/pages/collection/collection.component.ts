import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-collection',
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
              <a routerLink="/san-pham">Sản phẩm</a>
              <span aria-hidden="true">›</span>
              <span>{{ title() }}</span>
            </nav>
            <h1>Bộ sưu tập: {{ title() }}</h1>
            <p>Sản phẩm thuộc bộ sưu tập này</p>
          </div>
          <a routerLink="/san-pham" class="store-btn store-btn-outline store-page-head__actions">Tất cả sản phẩm</a>
        </header>

        <div class="store-product-grid">
          @for (item of samples; track item) {
            <div class="product-item">
              <div class="product-img"><span class="img-placeholder"></span></div>
              <h3>{{ item }}</h3>
              <p class="product-price">Liên hệ</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .product-item {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
      }

      .product-img {
        aspect-ratio: 1;
        background: #f3f4f6;
      }

      .img-placeholder {
        display: block;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #eceef1, #dfe3e8);
      }

      .product-item h3 {
        margin: 0.65rem 0.75rem 0;
        font-size: 0.9375rem;
      }

      .product-price {
        margin: 0.25rem 0.75rem 0.85rem;
        font-weight: 600;
        color: #6b7280;
        font-size: 0.875rem;
      }
    `
  ]
})
export class CollectionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly title = signal('Bộ sưu tập');
  readonly samples = ['Sản phẩm mẫu 1', 'Sản phẩm mẫu 2', 'Sản phẩm mẫu 3', 'Sản phẩm mẫu 4'];

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.title.set(decodeURIComponent(slug.replace(/-/g, ' ')) || 'Bộ sưu tập');
  }
}
