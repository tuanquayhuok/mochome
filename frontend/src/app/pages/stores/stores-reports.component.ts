import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';

@Component({
  selector: 'app-stores-reports',
  standalone: true,
  imports: [CommonModule, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      title="Báo cáo Cung ứng & Phân phối"
      subtitle="Thống kê doanh số cung cấp hàng hóa cho đại lý và tỷ trọng đóng góp doanh thu đại lý"
      [breadcrumbs]="crumbs"
    >
      @if (loading()) {
        <div class="page-state">Đang tổng hợp dữ liệu báo cáo...</div>
      } @else {
        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-title">Tổng Giá Trị Phân Phối</span>
            <strong class="kpi-value text-primary">{{ totalSupplyVolume() | number }} đ</strong>
            <span class="kpi-note">Tổng doanh số hàng cung ứng cấp dưới</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Đại Lý Hoạt Động</span>
            <strong class="kpi-value">{{ activeStoresCount() }} / {{ totalStoresCount() }}</strong>
            <span class="kpi-note">Số lượng đại lý đang mở cửa</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Đại Lý Doanh Số Cao Nhất</span>
            <strong class="kpi-value text-gold">{{ topResellerName() }}</strong>
            <span class="kpi-note">Platinum Partner miền Bắc</span>
          </div>
        </div>

        <!-- Charts and Breakdown -->
        <div class="analytics-layout">
          <!-- Reseller Share Chart -->
          <div class="analytics-card">
            <h3>Tỷ trọng phân phối hàng hóa</h3>
            <div class="share-chart-list">
              @for (store of stores(); track store._id) {
                <div class="share-row">
                  <div class="share-label">
                    <span>{{ store.name }}</span>
                    <strong>{{ getSharePercentage(store.supplyVolume) }}%</strong>
                  </div>
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      [style.width.%]="getSharePercentage(store.supplyVolume)"
                      [class]="store.tier.toLowerCase()"
                    ></div>
                  </div>
                  <span class="share-volume">{{ store.supplyVolume | number }} đ</span>
                </div>
              }
            </div>
          </div>

          <!-- Reseller Performance Table -->
          <div class="analytics-card">
            <h3>Chi tiết hiệu suất nhập hàng</h3>
            <div class="mini-table-wrap">
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>Đại lý / Chi nhánh</th>
                    <th>Hạng</th>
                    <th class="text-right">Tổng Nhập Lũy Kế</th>
                  </tr>
                </thead>
                <tbody>
                  @for (store of stores(); track store._id) {
                    <tr>
                      <td>
                        <div class="mini-store-meta">
                          <strong>{{ store.name }}</strong>
                          <span>Phụ trách: {{ store.manager }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="tier-indicator" [class]="store.tier.toLowerCase()">
                          {{ store.tier }}
                        </span>
                      </td>
                      <td class="text-right cell-strong">
                        {{ store.supplyVolume | number }} đ
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </app-admin-catalog-page>
  `,
  styles: [
    `
      .crumbs-row {
        margin-bottom: 1.5rem;
      }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.25rem;
        margin-bottom: 2rem;
      }

      .kpi-card {
        background: #fff;
        border-radius: 16px;
        padding: 1.5rem;
        border: 1px solid #ebdcd0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .kpi-title {
        font-size: 0.8125rem;
        font-weight: 700;
        color: #6b7280;
        text-transform: uppercase;
      }

      .kpi-value {
        font-size: 1.75rem;
        font-weight: 800;
        color: #374151;
      }

      .kpi-value.text-primary {
        color: #8c7161;
      }

      .kpi-value.text-gold {
        color: #d97706;
      }

      .kpi-note {
        font-size: 0.75rem;
        color: #9ca3af;
      }

      .analytics-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }

      @media (max-width: 992px) {
        .analytics-layout {
          grid-template-columns: 1fr;
        }
      }

      .analytics-card {
        background: #fff;
        border-radius: 20px;
        border: 1px solid #ebdcd0;
        padding: 1.5rem;
      }

      .analytics-card h3 {
        margin-top: 0;
        margin-bottom: 1.25rem;
        font-size: 1.1rem;
        color: #5c4033;
        font-weight: 700;
      }

      .share-chart-list {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .share-row {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .share-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        color: #374151;
        font-weight: 600;
      }

      .bar-container {
        height: 10px;
        background: #f3f4f6;
        border-radius: 999px;
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        border-radius: 999px;
        background: #9ca3af;
      }

      .bar-fill.platinum {
        background: #64748b;
      }

      .bar-fill.gold {
        background: #f59e0b;
      }

      .bar-fill.silver {
        background: #9ca3af;
      }

      .bar-fill.standard {
        background: #3b82f6;
      }

      .share-volume {
        font-size: 0.75rem;
        color: #9ca3af;
        text-align: right;
      }

      /* Mini table styling */
      .mini-table-wrap {
        overflow-x: auto;
      }

      .mini-table {
        width: 100%;
        border-collapse: collapse;
      }

      .mini-table th {
        background: #faf8f6;
        padding: 0.6rem 0.8rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: #6b7280;
        text-align: left;
        border-bottom: 1px solid #eae6e2;
      }

      .mini-table td {
        padding: 0.75rem 0.8rem;
        border-bottom: 1px solid #f9f7f5;
        font-size: 0.875rem;
      }

      .mini-store-meta {
        display: flex;
        flex-direction: column;
      }

      .mini-store-meta strong {
        color: #374151;
      }

      .mini-store-meta span {
        font-size: 0.75rem;
        color: #9ca3af;
      }

      .tier-indicator {
        display: inline-block;
        padding: 0.15rem 0.45rem;
        font-size: 0.7rem;
        font-weight: 700;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .tier-indicator.platinum {
        background: #f1f5f9;
        color: #475569;
      }

      .tier-indicator.gold {
        background: #fef3c7;
        color: #d97706;
      }

      .tier-indicator.silver {
        background: #f3f4f6;
        color: #4b5563;
      }

      .tier-indicator.standard {
        background: #eff6ff;
        color: #2563eb;
      }

      .text-right {
        text-align: right;
      }

      .cell-strong {
        font-weight: 700;
        color: #374151;
      }
    `
  ]
})
export class StoresReportsComponent implements OnInit {
  private api = inject(ApiService);

  crumbs = [
    { label: 'Quản lý đại lý' },
    { label: 'Báo cáo phân phối', active: true }
  ];

  loading = signal(false);
  stores = signal<any[]>([]);

  // Computed metrics
  totalSupplyVolume = computed(() => {
    return this.stores().reduce((acc, s) => acc + (s.supplyVolume || 0), 0);
  });

  totalStoresCount = computed(() => this.stores().length);

  activeStoresCount = computed(() => {
    return this.stores().filter((s) => s.isActive).length;
  });

  topResellerName = computed(() => {
    const list = [...this.stores()];
    if (!list.length) return '—';
    list.sort((a, b) => b.supplyVolume - a.supplyVolume);
    return list[0].name.split(' (')[0];
  });

  ngOnInit(): void {
    this.loadStores();
  }

  getSharePercentage(volume: number): number {
    const total = this.totalSupplyVolume();
    if (!total) return 0;
    return Math.round((volume / total) * 100);
  }

  private loadStores(): void {
    this.loading.set(true);
    this.api.list<any>('partner-stores').subscribe({
      next: (res) => {
        this.stores.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
