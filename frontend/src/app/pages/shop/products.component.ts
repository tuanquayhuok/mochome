import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicApiService } from '../../core/services/public-api.service';
import { ProductRow, CategoryRow } from '../../core/models/admin-list.models';
import { FavoritesService } from '../../core/services/favorites.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-shop-products',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe, FormsModule],
  template: `
    <section class="store-section store-section--white">
      <div class="store-container">
        <!-- Header -->
        <header class="store-block-head">
          <div>
            <nav class="store-breadcrumb" aria-label="Đường dẫn">
              <a routerLink="/">Trang chủ</a>
              <span aria-hidden="true">›</span>
              <span>Sản phẩm</span>
            </nav>
            <h2>Cửa Hàng Sản Phẩm</h2>
          </div>
          <a routerLink="/" class="see-all">← Trang chủ</a>
        </header>

        <!-- Two Column Shop Layout -->
        <div class="shop-layout">
          <!-- Sidebar Filters -->
          <aside class="shop-sidebar">
            <!-- Search inside Shop -->
            <div class="filter-group">
              <h3>Tìm kiếm</h3>
              <div class="search-input-wrap">
                <input
                  type="text"
                  [(ngModel)]="localSearch"
                  (ngModelChange)="onSearchChange($event)"
                  placeholder="Nhập tên sản phẩm..."
                />
              </div>
            </div>

            <!-- Categories Radio Filters -->
            <div class="filter-group">
              <h3>Danh mục</h3>
              <div class="filter-list">
                <label class="filter-item">
                  <input
                    type="radio"
                    name="category"
                    [checked]="selectedCategory() === ''"
                    (change)="setCategory('')"
                  />
                  <span>Tất cả sản phẩm</span>
                </label>
                @for (cat of categories(); track cat._id) {
                  <label class="filter-item">
                    <input
                      type="radio"
                      name="category"
                      [checked]="selectedCategory() === cat.slug"
                      (change)="setCategory(cat.slug)"
                    />
                    <span>{{ cat.name }}</span>
                  </label>
                }
              </div>
            </div>

            <!-- Price Range Filter -->
            <div class="filter-group">
              <h3>Khoảng giá (đ)</h3>
              <div class="price-inputs">
                <input
                  type="number"
                  [(ngModel)]="localMinPrice"
                  placeholder="Từ"
                  min="0"
                />
                <span class="price-divider">-</span>
                <input
                  type="number"
                  [(ngModel)]="localMaxPrice"
                  placeholder="Đến"
                  min="0"
                />
              </div>
              <button class="btn-apply-price" (click)="applyPriceFilter()">Áp dụng</button>
            </div>

            <!-- Stock Status Checkbox -->
            <div class="filter-group">
              <h3>Trạng thái</h3>
              <label class="filter-item checkbox-label">
                <input
                  type="checkbox"
                  [checked]="inStockOnly()"
                  (change)="toggleStockOnly()"
                />
                <span>Chỉ hiện sản phẩm còn hàng</span>
              </label>
            </div>

            <!-- Reset Filters -->
            <button class="btn-reset-filters" (click)="resetFilters()">
              Xóa bộ lọc
            </button>
          </aside>

          <!-- Main Shop Grid -->
          <div class="shop-main">
            <!-- Toolbar -->
            <div class="shop-toolbar">
              <span class="results-count">
                Hiển thị <strong>{{ filteredProducts().length }}</strong> sản phẩm
              </span>
              
              <div class="sort-wrap">
                <label for="sort">Sắp xếp:</label>
                <select id="sort" [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)">
                  <option value="newest">Mới nhất</option>
                  <option value="priceAsc">Giá: Thấp đến Cao</option>
                  <option value="priceDesc">Giá: Cao đến Thấp</option>
                  <option value="nameAsc">Tên: A - Z</option>
                </select>
              </div>
            </div>

            <!-- Product Grid Area -->
            @if (loading()) {
              <p class="state">Đang tải danh sách sản phẩm...</p>
            } @else if (!filteredProducts().length) {
              <div class="no-results-msg">
                <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc của bạn.</p>
                <button class="btn-clear-filters" (click)="resetFilters()">Xóa tất cả bộ lọc</button>
              </div>
            } @else {
              <div class="store-product-grid">
                @for (p of filteredProducts(); track p._id) {
                  <div class="product-card">
                    <div class="product-img-wrap">
                      <a [routerLink]="linkFor(p)">
                        <img
                          [src]="p.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'"
                          [alt]="p.name"
                          loading="lazy"
                        />
                      </a>
                      
                      @if (p.inStock !== false && p.stock > 0) {
                        <span class="stock-badge in-stock">Còn hàng</span>
                      } @else {
                        <span class="stock-badge out-of-stock">Hết hàng</span>
                      }

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
                      <h3><a [routerLink]="linkFor(p)">{{ p.name }}</a></h3>
                      <p class="product-price">{{ p.price | number }} đ</p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
      
      @if (toastText()) {
        <div class="toast-notification">{{ toastText() }}</div>
      }
    </section>
  `,
  styles: [
    `
      .store-section {
        background: #fff;
        padding: 2.5rem 0 4.5rem;
        color: #2c2520;
      }

      .store-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.25rem;
      }

      .store-block-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        border-bottom: 1px solid #eae6e2;
        padding-bottom: 1.5rem;
        margin-bottom: 2rem;
      }

      .store-block-head h2 {
        margin: 0.5rem 0 0;
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: 0.02em;
      }

      .store-breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.8125rem;
        color: #a3978e;
      }

      .store-breadcrumb a {
        color: #8c7e74;
        text-decoration: none;
      }

      .store-breadcrumb a:hover {
        color: #2c2520;
      }

      .see-all {
        font-size: 0.875rem;
        color: #8c7e74;
        text-decoration: none;
        font-weight: 600;
      }

      .see-all:hover {
        color: #2c2520;
      }

      /* Two Column Layout */
      .shop-layout {
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: 2.5rem;
        align-items: start;
      }

      /* Sidebar Filters styling */
      .shop-sidebar {
        background: #faf8f6;
        border: 1px solid #eae6e2;
        border-radius: 8px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
      }

      .filter-group h3 {
        margin: 0 0 1rem;
        font-size: 0.9375rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #2c2520;
        border-bottom: 1px solid #eae6e2;
        padding-bottom: 0.5rem;
      }

      .search-input-wrap input {
        width: 100%;
        padding: 0.65rem 0.75rem;
        border: 1px solid #e2dbd5;
        border-radius: 6px;
        font-size: 0.875rem;
        color: #2c2520;
        background: #fff;
      }

      .search-input-wrap input:focus {
        outline: none;
        border-color: #a39185;
      }

      .filter-list {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .filter-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.875rem;
        color: #5c5047;
        cursor: pointer;
      }

      .filter-item input[type='radio'],
      .filter-item input[type='checkbox'] {
        accent-color: #8c7161;
        width: 15px;
        height: 15px;
        cursor: pointer;
      }

      .price-inputs {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .price-inputs input {
        width: 100%;
        padding: 0.55rem;
        border: 1px solid #e2dbd5;
        border-radius: 6px;
        font-size: 0.8125rem;
        text-align: center;
        background: #fff;
      }

      .price-inputs input:focus {
        outline: none;
        border-color: #a39185;
      }

      .price-divider {
        color: #a3978e;
      }

      .btn-apply-price {
        width: 100%;
        padding: 0.55rem;
        background: #2c2520;
        color: #fff;
        border: none;
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
      }

      .btn-apply-price:hover {
        background: #4a3e35;
      }

      .btn-reset-filters {
        width: 100%;
        padding: 0.65rem;
        background: transparent;
        color: #8c7e74;
        border: 1px dashed #dcd0c9;
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-reset-filters:hover {
        color: #2c2520;
        border-color: #8c7e74;
        background: #fff;
      }

      /* Main toolbar styling */
      .shop-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
        color: #7a6e67;
      }

      .results-count strong {
        color: #2c2520;
      }

      .sort-wrap {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .sort-wrap select {
        padding: 0.45rem 1rem;
        border: 1px solid #e2dbd5;
        border-radius: 6px;
        background: #fff;
        color: #2c2520;
        font-size: 0.875rem;
        font-weight: 500;
        outline: none;
        cursor: pointer;
      }

      .sort-wrap select:focus {
        border-color: #a39185;
      }

      /* Product Grid and Card */
      .store-product-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem 1.5rem;
      }

      .product-card {
        background: #fff;
        border: 1px solid #eae6e2;
        border-radius: 6px;
        overflow: hidden;
        transition: transform 0.3s, box-shadow 0.3s;
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

      .stock-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 5;
        font-size: 0.6875rem;
        font-weight: 700;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .stock-badge.in-stock {
        background: rgba(240, 253, 244, 0.95);
        color: #16a34a;
        border: 1px solid #bbf7d0;
      }

      .stock-badge.out-of-stock {
        background: rgba(254, 242, 242, 0.95);
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      /* Hover Actions */
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
        background: #fff;
        border-color: #eae6e2;
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

      /* No results */
      .no-results-msg {
        text-align: center;
        padding: 4rem 2rem;
        color: #7a6e67;
        border: 1px dashed #dcd0c9;
        border-radius: 8px;
        background: #faf8f6;
      }

      .no-results-msg p {
        margin: 0 0 1.5rem;
        font-size: 1rem;
      }

      .btn-clear-filters {
        padding: 0.75rem 1.5rem;
        background: #2c2520;
        color: #fff;
        border: none;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.8125rem;
        cursor: pointer;
        transition: background 0.2s;
      }

      .btn-clear-filters:hover {
        background: #4a3e35;
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

      /* Responsive Shop Layout */
      @media (max-width: 991px) {
        .shop-layout {
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        .store-product-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (max-width: 768px) {
        .store-product-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      /* Dark Mode Specific Overrides for Shop/Products Page */
      :host-context([data-theme="dark"]) {
        .store-section {
          background: #0f172a !important;
        }

        .store-block-head h2,
        .see-all,
        .filter-group h3,
        .filter-item span,
        .results-count,
        .sort-wrap label,
        .product-info h3 a {
          color: #f8fafc !important;
        }

        .filter-group input[type="text"],
        .price-inputs input,
        .sort-wrap select {
          background: #1e293b !important;
          border-color: #334155 !important;
          color: #f8fafc !important;
        }

        .product-card {
          background: #1e293b !important;
          border-color: #334155 !important;
        }

        .product-price {
          color: #fb923c !important;
        }

        .btn-apply-price,
        .btn-reset-filters {
          background: #3e2a1e !important;
          color: #ffffff !important;
          border: 1px solid #4a3e35 !important;
        }

        .btn-apply-price:hover,
        .btn-reset-filters:hover {
          background: #5c4033 !important;
        }
      }
    `
  ]
})
export class ShopProductsComponent implements OnInit {
  private readonly publicApi = inject(PublicApiService);
  private readonly route = inject(ActivatedRoute);
  readonly favorites = inject(FavoritesService);
  readonly cart = inject(CartService);

  readonly products = signal<ProductRow[]>([]);
  readonly categories = signal<CategoryRow[]>([]);
  readonly loading = signal(true);

  // Filters State
  readonly selectedCategory = signal<string>('');
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);
  readonly inStockOnly = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly sortBy = signal<string>('newest');

  // Local binding variables for form fields
  localSearch = '';
  localMinPrice: number | null = null;
  localMaxPrice: number | null = null;

  // Filtered and Sorted Products computation
  readonly filteredProducts = computed(() => {
    let result = [...this.products()];

    // 1. Search Query Filter
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      result = result.filter((p) => p.name.toLowerCase().includes(query));
    }

    // 2. Category Filter
    const catSlug = this.selectedCategory();
    if (catSlug) {
      result = result.filter(
        (p) => p.category && (p.category as any).slug === catSlug
      );
    }

    // 3. Price Filters
    const min = this.minPrice();
    if (min !== null && min >= 0) {
      result = result.filter((p) => p.price >= min);
    }
    const max = this.maxPrice();
    if (max !== null && max >= 0) {
      result = result.filter((p) => p.price <= max);
    }

    // 4. Availability Filter
    if (this.inStockOnly()) {
      result = result.filter((p) => p.inStock !== false && p.stock > 0);
    }

    // 5. Sorting
    const sort = this.sortBy();
    if (sort === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === 'nameAsc') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else {
      // 'newest' - sorted by creation date (desc)
      result.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
    }

    return result;
  });

  ngOnInit(): void {
    // Fetch both catalog products and categories on load
    this.publicApi.getCatalog().subscribe({
      next: (data) => {
        this.products.set(data.products);
        this.categories.set(data.categories || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    // Subscribe to query parameters to handle deep links (e.g. ?category=sofa)
    this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        this.selectedCategory.set(params['category']);
      } else {
        this.selectedCategory.set('');
      }

      if (params['search']) {
        this.searchQuery.set(params['search']);
        this.localSearch = params['search'];
      }
    });
  }

  setCategory(slug: string): void {
    this.selectedCategory.set(slug);
  }

  toggleStockOnly(): void {
    this.inStockOnly.update((v) => !v);
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
  }

  applyPriceFilter(): void {
    this.minPrice.set(this.localMinPrice);
    this.maxPrice.set(this.localMaxPrice);
  }

  resetFilters(): void {
    this.selectedCategory.set('');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.inStockOnly.set(false);
    this.searchQuery.set('');
    this.sortBy.set('newest');

    this.localSearch = '';
    this.localMinPrice = null;
    this.localMaxPrice = null;
  }

  linkFor(p: ProductRow): string[] {
    return p.slug ? ['/san-pham', p.slug] : ['/san-pham'];
  }

  readonly toastText = signal('');
  private toastTimeout?: ReturnType<typeof setTimeout>;

  showToast(msg: string): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastText.set(msg);
    this.toastTimeout = setTimeout(() => {
      this.toastText.set('');
    }, 2500);
  }

  toggleFavorite(p: ProductRow, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const added = this.favorites.toggle({
      productId: p._id,
      slug: p.slug || '',
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl
    });
    this.showToast(added ? `Đã thêm "${p.name}" vào danh sách yêu thích!` : `Đã xóa "${p.name}" khỏi danh sách yêu thích!`);
  }

  addToCart(p: ProductRow, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cart.add({
      productId: p._id,
      slug: p.slug || '',
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl
    });
    this.showToast(`Đã thêm "${p.name}" vào giỏ hàng!`);
  }
}
