import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';

interface StoreStockCell {
  storeId: string;
  storeName: string;
  stock: number;
}

interface ProductInventoryRow {
  productId: string;
  name: string;
  sku: string;
  stocks: StoreStockCell[];
  totalStock: number;
}

@Component({
  selector: 'app-stores-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Báo cáo Tồn kho Đại lý"
      subtitle="Theo dõi số lượng tồn kho chi tiết của từng dòng sản phẩm tại các chi nhánh đại lý liên kết"
      [breadcrumbs]="crumbs"
    >
      <div pageToolbar class="catalog-filter-bar catalog-filter-bar--simple">
        <div class="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Tìm theo sản phẩm hoặc SKU..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
        </div>
      </div>

      @if (loading()) {
        <div class="page-state">Đang đối chiếu dữ liệu tồn kho...</div>
      } @else if (!products().length) {
        <div class="page-state">Chưa có sản phẩm nào được thiết lập tồn kho.</div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã sản phẩm / Tên</th>
                @for (store of stores(); track store._id) {
                  <th class="text-center">{{ store.name }}</th>
                }
                <th class="text-right">Tổng tồn đại lý</th>
              </tr>
            </thead>
            <tbody>
              @for (row of filteredRows(); track row.productId) {
                <tr>
                  <td>
                    <div class="product-meta-cell">
                      <strong>{{ row.name }}</strong>
                      <span class="sku-subtext">{{ row.sku }}</span>
                    </div>
                  </td>
                  @for (cell of row.stocks; track cell.storeId) {
                    <td class="text-center">
                      <span
                        class="stock-number-indicator"
                        [class.out-of-stock]="cell.stock === 0"
                        [class.low-stock]="cell.stock > 0 && cell.stock < 10"
                      >
                        {{ cell.stock }}
                      </span>
                    </td>
                  }
                  <td class="text-right cell-strong">
                    {{ row.totalStock }}
                  </td>
                </tr>
              } @if (!filteredRows().length) {
                <tr>
                  <td [attr.colspan]="stores().length + 2" class="no-prods-msg">
                    Không tìm thấy sản phẩm phù hợp.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </app-admin-catalog-page>
  `,
  styles: [
    `
      .product-meta-cell {
        display: flex;
        flex-direction: column;
      }

      .sku-subtext {
        font-size: 0.75rem;
        color: #9ca3af;
      }

      .text-center {
        text-align: center;
      }

      .text-right {
        text-align: right;
      }

      .stock-number-indicator {
        font-weight: 700;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        background: #f0fdf4;
        color: #16a34a;
      }

      .stock-number-indicator.low-stock {
        background: #fffbeb;
        color: #d97706;
      }

      .stock-number-indicator.out-of-stock {
        background: #fef2f2;
        color: #dc2626;
      }

      .no-prods-msg {
        text-align: center;
        padding: 2rem;
        color: #9ca3af;
      }
    `
  ]
})
export class StoresInventoryComponent implements OnInit {
  private api = inject(ApiService);

  crumbs = [
    { label: 'Quản lý đại lý' },
    { label: 'Tồn kho đại lý', active: true }
  ];

  loading = signal(false);
  searchQuery = signal('');
  stores = signal<any[]>([]);
  products = signal<any[]>([]);

  // Computed matrix table rows
  filteredRows = computed<ProductInventoryRow[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const storeList = this.stores();
    const prodList = this.products();

    // Map each product to store stock cells
    const rowsList = prodList.map((p) => {
      const stocks: StoreStockCell[] = storeList.map((s) => {
        // Find if this store has this product in its inventory
        const invItem = s.inventory?.find((i: any) => {
          const pid = typeof i.product === 'object' ? i.product?._id : i.product;
          return pid === p._id;
        });
        return {
          storeId: s._id,
          storeName: s.name,
          stock: invItem ? invItem.stock : 0
        };
      });

      const totalStock = stocks.reduce((acc, curr) => acc + curr.stock, 0);

      return {
        productId: p._id,
        name: p.name,
        sku: p.sku,
        stocks,
        totalStock
      };
    });

    if (!q) return rowsList;
    return rowsList.filter(
      (r) => r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.api.list<any>('partner-stores').subscribe({
      next: (storeRes) => {
        this.stores.set(storeRes);

        this.api.list<any>('products').subscribe({
          next: (prodRes) => {
            this.products.set(prodRes);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }
}
