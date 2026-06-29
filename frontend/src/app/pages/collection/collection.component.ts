import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { PublicApiService, CollectionRow } from '../../core/services/public-api.service';
import { ProductRow } from '../../core/models/admin-list.models';
import { FavoritesService } from '../../core/services/favorites.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <main class="collection-detail-page">
      <!-- Breadcrumb & Header Hero -->
      <section class="collection-hero" aria-labelledby="collection-title">
        <div class="container hero-container">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a routerLink="/">Trang chủ</a>
            <span class="sep">/</span>
            <a routerLink="/bo-suu-tap">Bộ sưu tập</a>
            <span class="sep">/</span>
            <span class="current">{{ collectionName() }}</span>
          </nav>
          
          <span class="hero-tag">BỘ SƯU TẬP NỘI THẤT</span>
          <h1 id="collection-title">{{ collectionName() }}</h1>
          <p class="hero-desc">{{ collectionDesc() || 'Các sản phẩm thiết kế theo phong cách riêng của Mộc Home.' }}</p>
        </div>
      </section>

      <!-- Products Grid -->
      <section class="collection-products block">
        <div class="container">
          @if (loading()) {
            <div class="state-msg">Đang tải sản phẩm bộ sưu tập...</div>
          } @else if (error()) {
            <div class="state-msg error">{{ error() }}</div>
          } @else if (!products().length) {
            <div class="state-msg">Chưa có sản phẩm nào thuộc bộ sưu tập này.</div>
          } @else {
            <div class="products-grid">
              @for (p of products(); track p._id) {
                <div class="product-card">
                  <div class="product-img-wrap">
                    <a [routerLink]="['/san-pham', p.slug]">
                      <img [src]="p.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'" [alt]="p.name" />
                    </a>
                    
                    <div class="product-actions">
                      <button
                        type="button"
                        class="action-btn"
                        [class.active]="favorites.isFavorite(p._id)"
                        title="Yêu thích"
                        (click)="toggleFavorite(p, $event)"
                      >
                        <svg viewBox="0 0 24 24" [attr.fill]="favorites.isFavorite(p._id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="action-btn"
                        title="Thêm vào giỏ"
                        (click)="addToCart(p, $event)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div class="product-info">
                    <h3><a [routerLink]="['/san-pham', p.slug]">{{ p.name }}</a></h3>
                    <p class="product-price">
                      @if (p.price) {
                        {{ p.price | number }} đ
                      } @else {
                        Liên hệ
                      }
                    </p>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- Toast ToastNotification -->
      @if (toastText()) {
        <div class="toast-notification">{{ toastText() }}</div>
      }
    </main>
  `,
  styles: [
    `
      .collection-detail-page {
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
      .collection-hero {
        background: linear-gradient(180deg, #faf6f3 0%, #ffffff 100%);
        border-bottom: 1px solid #eae6e2;
        padding: 3.5rem 0 3rem;
        text-align: center;
      }

      .hero-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .hero-tag {
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.15em;
        color: #8c7161;
        margin-top: 1rem;
        text-transform: uppercase;
      }

      .collection-hero h1 {
        margin: 0.25rem 0 0.5rem;
        font-size: clamp(1.75rem, 4vw, 2.5rem);
        font-weight: 800;
        letter-spacing: 0.05em;
        color: #2c2520;
      }

      .hero-desc {
        margin: 0;
        font-size: 0.95rem;
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
      }

      .breadcrumb a {
        color: #8c7e74;
        text-decoration: none;
        transition: color 0.2s;
      }

      .breadcrumb a:hover {
        color: #2c2520;
      }

      .breadcrumb .sep {
        color: #dcd0c9;
      }

      .breadcrumb .current {
        color: #a3978e;
        font-weight: 500;
      }

      /* States */
      .state-msg {
        text-align: center;
        padding: 4rem;
        font-size: 1rem;
        color: #7a6e67;
      }

      .state-msg.error {
        color: #dc2626;
      }

      /* Product Grid */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2rem 1.5rem;
      }

      .product-card {
        background: #fff;
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid #eae6e2;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        display: flex;
        flex-direction: column;
      }

      .product-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 25px rgba(140, 113, 97, 0.06);
      }

      .product-img-wrap {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
        background: #fbf9f7;
      }

      .product-img-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      .product-card:hover .product-img-wrap img {
        transform: scale(1.05);
      }

      /* Actions Overlay on Image */
      .product-actions {
        position: absolute;
        bottom: 12px;
        right: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        opacity: 0;
        transform: translateY(8px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: 5;
      }

      .product-card:hover .product-actions {
        opacity: 1;
        transform: translateY(0);
      }

      .action-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #fff;
        border: 1px solid #eae6e2;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #2c2520;
        cursor: pointer;
        box-shadow: 0 3px 8px rgba(0,0,0,0.06);
        transition: background 0.2s, color 0.2s, transform 0.2s;
      }

      .action-btn:hover {
        background: #2c2520;
        color: #fff;
        transform: scale(1.08);
      }

      .action-btn.active {
        color: #dc2626;
      }

      .action-btn.active:hover {
        background: #dc2626;
        color: #fff;
        border-color: #dc2626;
      }

      .action-btn svg {
        width: 16px;
        height: 16px;
      }

      .product-info {
        padding: 1.25rem 1rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }

      .product-info h3 {
        margin: 0 0 0.5rem;
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.4;
      }

      .product-info h3 a {
        color: #2c2520;
        text-decoration: none;
        transition: color 0.2s;
      }

      .product-info h3 a:hover {
        color: #8c7161;
      }

      .product-price {
        margin-top: auto;
        font-size: 0.9rem;
        font-weight: 700;
        color: #8c7161;
      }

      /* Toast Notification */
      .toast-notification {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #2c2520;
        color: #fff;
        padding: 0.75rem 2rem;
        border-radius: 4px;
        font-size: 0.8125rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.25);
        animation: toastFadeIn 0.3s ease;
      }

      @keyframes toastFadeIn {
        from { opacity: 0; transform: translate(-50%, 15px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }

      @media (max-width: 991px) {
        .products-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem 1rem;
        }
      }

      @media (max-width: 768px) {
        .products-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .block {
          padding: 3rem 0;
        }
      }
    `
  ]
})
export class CollectionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicApi = inject(PublicApiService);
  readonly favorites = inject(FavoritesService);
  readonly cart = inject(CartService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  readonly collectionName = signal('Bộ sưu tập');
  readonly collectionDesc = signal('');
  readonly products = signal<ProductRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly toastText = signal<string | null>(null);
  private toastTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    
    this.publicApi.getCollectionBySlug(slug).subscribe({
      next: (res) => {
        this.collectionName.set(res.collection.name);
        this.collectionDesc.set(res.collection.description);
        this.products.set(res.products);
        
        this.titleService.setTitle(`Bộ sưu tập ${res.collection.name} — Mộc Home`);
        this.metaService.updateTag({
          name: 'description',
          content: res.collection.description || `Xem danh sách các sản phẩm nội thất thuộc bộ sưu tập ${res.collection.name} thiết kế độc bản bởi Mộc Home.`
        });
        
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching collection products', err);
        this.error.set('Không thể tải sản phẩm bộ sưu tập. Vui lòng thử lại sau.');
        this.loading.set(false);
      }
    });
  }

  addToCart(product: ProductRow, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cart.add({
      productId: product._id,
      slug: product.slug || '',
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl
    });
    this.showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
  }

  toggleFavorite(product: ProductRow, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const isFav = this.favorites.isFavorite(product._id);
    this.favorites.toggle({
      productId: product._id,
      slug: product.slug || '',
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl
    });
    this.showToast(isFav ? `Đã bỏ thích "${product.name}"` : `Đã thêm "${product.name}" vào danh sách yêu thích`);
  }

  private showToast(text: string): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastText.set(text);
    this.toastTimeout = setTimeout(() => {
      this.toastText.set(null);
    }, 2500);
  }
}
