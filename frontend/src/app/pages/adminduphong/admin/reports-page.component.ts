import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminCatalogPageComponent } from '../../shared/admin-catalog-page.component';
import { ApiService } from '../../core/services/api.service';

type ReportSlug =
  | 'revenue'
  | 'top-products'
  | 'slow-products'
  | 'top-customers'
  | 'inventory'
  | 'chart';

interface DashboardPayload {
  cards: {
    revenueToday: number;
    revenueMonth: number;
    revenueAll: number;
    totalOrders: number;
    totalUsers: number;
    lowStockCount: number;
  };
  chart: { month: string; revenue: number }[];
  bestSellers: { _id: string; name: string; imageUrl?: string; price: number; categoryName?: string; sold: number; revenue: number; stock?: number }[];
  slowSellers: { _id: string; name: string; imageUrl?: string; price: number; categoryName?: string; sold: number; revenue: number; stock?: number }[];
  topCustomers: { name: string; email: string; phone?: string; isVip: boolean; createdAt: string; totalSpent: number; orderCount: number }[];
  lowStockProducts: { _id: string; name: string; imageUrl?: string; price: number; categoryName?: string; stock: number; level: string }[];
  categories: { name: string; count: number }[];
}

const PAGE_META: Record<
  ReportSlug,
  { title: string; subtitle: string }
> = {
  revenue: {
    title: 'Doanh thu theo ngày/tháng/năm',
    subtitle: 'Tổng hợp doanh thu từ đơn hàng đã xử lý'
  },
  'top-products': {
    title: 'Top sản phẩm bán chạy',
    subtitle: 'Sản phẩm bán nhiều nhất theo số lượng đã giao'
  },
  'slow-products': {
    title: 'Top sản phẩm bán chậm',
    subtitle: 'Sản phẩm bán ít nhất theo số lượng đã giao'
  },
  'top-customers': {
    title: 'Top khách hàng',
    subtitle: 'Khách hàng có giá trị đơn hàng cao nhất'
  },
  inventory: {
    title: 'Sản phẩm tồn kho',
    subtitle: 'Cảnh báo sản phẩm sắp hết hàng'
  },
  chart: {
    title: 'Biểu đồ doanh thu',
    subtitle: 'Thống kê doanh thu kết hợp (Cột, Đường, Tròn)'
  }
};

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink, AdminCatalogPageComponent],
  template: `
    <app-admin-catalog-page
      [title]="meta().title"
      [subtitle]="meta().subtitle"
      [breadcrumbs]="[
        { label: 'Trang chủ', route: '/admin/dashboard' },
        { label: 'Báo cáo & thống kê', route: '/admin/reports/revenue' },
        { label: meta().title }
      ]"
    >
      @if (loading()) {
        <div class="page-state">Đang tải báo cáo...</div>
      } @else if (loadError()) {
        <div class="page-state error">{{ loadError() }}</div>
      } @else if (slug() === 'top-customers') {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 60px;">#</th>
                <th>Khách hàng</th>
                <th>Phân hạng</th>
                <th>Email / SĐT</th>
                <th style="text-align: center;">Số đơn hàng</th>
                <th style="text-align: right;">Giá trị đơn TB (AOV)</th>
                <th style="text-align: right;">Tổng chi tiêu</th>
                <th style="text-align: center;">Ngày gia nhập</th>
              </tr>
            </thead>
            <tbody>
              @for (c of data()!.topCustomers; track c.email; let i = $index) {
                <tr>
                  <td>
                    <span class="rank-badge" [class]="'rank-' + (i + 1)">{{ i + 1 }}</span>
                  </td>
                  <td>
                    <span class="cell-strong">{{ c.name }}</span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="c.isVip ? 'vip' : 'member'">
                      {{ c.isVip ? 'Khách VIP' : 'Thành viên' }}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                      <span style="font-size: 0.8125rem;">{{ c.email }}</span>
                      <span style="font-size: 0.75rem; color: var(--muted);">{{ c.phone || '—' }}</span>
                    </div>
                  </td>
                  <td style="text-align: center;" class="cell-strong">{{ c.orderCount | number }}</td>
                  <td style="text-align: right; font-weight: 500;">{{ (c.totalSpent / c.orderCount) | number }} đ</td>
                  <td style="text-align: right; font-weight: 700; color: var(--primary);">{{ c.totalSpent | number }} đ</td>
                  <td style="text-align: center; font-size: 0.75rem; color: var(--muted);">
                    {{ c.createdAt | date:'dd/MM/yyyy' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="cell-muted" style="text-align: center;">Chưa có dữ liệu khách hàng.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (slug() === 'revenue') {
        <div class="stat-grid">
          <article class="stat-box">
            <span class="stat-label">Hôm nay</span>
            <strong>{{ data()!.cards.revenueToday | number }} đ</strong>
          </article>
          <article class="stat-box">
            <span class="stat-label">Tháng này</span>
            <strong>{{ data()!.cards.revenueMonth | number }} đ</strong>
          </article>
          <article class="stat-box">
            <span class="stat-label">Tổng cộng</span>
            <strong>{{ data()!.cards.revenueAll | number }} đ</strong>
          </article>
          <article class="stat-box">
            <span class="stat-label">Tổng đơn</span>
            <strong>{{ data()!.cards.totalOrders | number }}</strong>
          </article>
        </div>

        <div class="filter-row">
          <span style="font-size: 0.8125rem; color: var(--muted); margin-right: auto; font-weight: 500;">Khoảng thời gian hiển thị:</span>
          <button class="btn-filter" [class.active]="revenueMode() === 'day' && revenueDays() === 7" (click)="setRevenueFilter('day', 7)">7 ngày qua</button>
          <button class="btn-filter" [class.active]="revenueMode() === 'day' && revenueDays() === 30" (click)="setRevenueFilter('day', 30)">30 ngày qua</button>
          <button class="btn-filter" [class.active]="revenueMode() === 'month'" (click)="setRevenueFilter('month')">12 tháng qua</button>
        </div>

        <div class="panel chart-panel" style="margin-bottom: 1.25rem;">
          <h3>Biểu đồ cột: Doanh thu ({{ revenueMode() === 'day' ? (revenueDays() + ' ngày qua') : '12 tháng qua' }})</h3>
          @if (loadingRevenueChart()) {
            <div style="height: 160px; display: grid; place-items: center; font-size: 0.8125rem; color: var(--muted);">Đang tải dữ liệu biểu đồ...</div>
          } @else {
            <div class="bar-chart">
              @for (p of revenueChartData(); track p.label) {
                <div class="bar-col">
                  <div
                    class="bar"
                    [style.height.%]="dynamicBarHeight(p.revenue)"
                    [title]="(p.revenue | number) + ' đ'"
                  ></div>
                  <span class="bar-label">{{ p.label }}</span>
                </div>
              }
            </div>
          }
        </div>

        <div class="panel" style="padding: 0;">
          <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; font-size: 0.875rem; font-weight: 700; color: #8c6239;">Bảng thống kê doanh thu chi tiết</h3>
            <span style="font-size: 0.75rem; color: var(--muted);">Đơn vị: đ</span>
          </div>
          <div class="data-table-wrap" style="border: none; border-radius: 0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th style="text-align: right;">Doanh thu phát sinh</th>
                </tr>
              </thead>
              <tbody>
                @for (p of revenueChartData(); track p.label) {
                  <tr>
                    <td class="cell-strong">{{ p.label }}</td>
                    <td style="text-align: right; font-weight: 600; color: var(--primary);">{{ p.revenue | number }} đ</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="2" class="cell-muted" style="text-align: center;">Không có dữ liệu thời gian này.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else if (slug() === 'chart') {
        <div class="chart-layout-grid">
          <!-- 1. Biểu đồ Cột (Column Chart) -->
          <div class="panel chart-panel-card">
            <h3>Biểu đồ cột: Doanh thu theo tháng</h3>
            <div class="bar-chart bar-chart--tall">
              @for (p of data()!.chart; track p.month) {
                <div class="bar-col">
                  <span class="bar-value">{{ p.revenue | number }}</span>
                  <div class="bar" [style.height.%]="barHeight(p.revenue)"></div>
                  <span class="bar-label">{{ p.month }}</span>
                </div>
              }
            </div>
          </div>

          <!-- 2. Biểu đồ Đường (Line Chart) -->
          <div class="panel chart-panel-card">
            <h3>Biểu đồ đường: Xu hướng doanh thu</h3>
            <div class="line-chart-wrap">
              <svg viewBox="0 0 600 240" class="svg-chart" width="100%" height="100%">
                <!-- Grid lines -->
                <line x1="50" y1="30" x2="570" y2="30" stroke="#f3f4f6" stroke-width="1" />
                <line x1="50" y1="70" x2="570" y2="70" stroke="#f3f4f6" stroke-width="1" />
                <line x1="50" y1="110" x2="570" y2="110" stroke="#f3f4f6" stroke-width="1" />
                <line x1="50" y1="150" x2="570" y2="150" stroke="#f3f4f6" stroke-width="1" />
                <line x1="50" y1="190" x2="570" y2="190" stroke="#ebdcd0" stroke-width="1.5" />
                
                <!-- Area Gradient Fill -->
                <path [attr.d]="lineChartPaths().area" fill="url(#line-grad)" opacity="0.15" />
                
                <!-- Line Path -->
                <path [attr.d]="lineChartPaths().line" fill="none" stroke="#8c6239" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                
                <!-- Points circles -->
                @for (p of lineChartPaths().points; track p.label) {
                  <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#ffffff" stroke="#8c6239" stroke-width="2" class="chart-point" />
                  <text [attr.x]="p.x" y="210" text-anchor="middle" class="chart-lbl">{{ p.label }}</text>
                }

                <defs>
                  <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#8c6239" />
                    <stop offset="100%" stop-color="#8c6239" stop-opacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <!-- 3. Biểu đồ Tròn (Pie/Donut Chart) -->
          <div class="panel chart-panel-card donut-panel">
            <h3>Biểu đồ tròn: Cơ cấu danh mục sản phẩm</h3>
            <div class="donut-chart-wrap">
              <svg viewBox="0 0 200 200" class="donut-chart-svg">
                @for (item of categoryChartData().items; track item.name) {
                  <circle
                    cx="100"
                    cy="100"
                    r="50"
                    fill="transparent"
                    [attr.stroke]="item.color"
                    stroke-width="20"
                    [attr.stroke-dasharray]="item.dashArray"
                    [attr.stroke-dashoffset]="item.dashOffset"
                    class="donut-segment"
                  />
                }
                <circle cx="100" cy="100" r="40" fill="#ffffff" />
                <text x="100" y="96" text-anchor="middle" class="donut-center-lbl">Tổng sản phẩm</text>
                <text x="100" y="116" text-anchor="middle" class="donut-center-val cell-strong">{{ categoryChartData().total }}</text>
              </svg>
              <div class="donut-legend">
                @for (item of categoryChartData().items; track item.name) {
                  <div class="legend-item">
                    <span class="legend-color" [style.background-color]="item.color"></span>
                    <span class="legend-name">{{ item.name }}</span>
                    <span class="legend-val cell-strong">{{ item.count }} ({{ item.percent | number:'1.0-0' }}%)</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      } @else if (slug() === 'top-products') {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 60px;">#</th>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th style="text-align: right;">Đơn giá</th>
                <th style="text-align: center;">Đã bán</th>
                <th style="text-align: right;">Doanh thu mang lại</th>
                <th style="text-align: center;">Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              @for (p of data()!.bestSellers; track p._id; let i = $index) {
                <tr>
                  <td>
                    <span class="rank-badge" [class]="'rank-' + (i + 1)">{{ i + 1 }}</span>
                  </td>
                  <td>
                    <div class="prod-cell">
                      @if (p.imageUrl) {
                        <img [src]="p.imageUrl" class="prod-thumb" alt="{{ p.name }}" />
                      } @else {
                        <div class="prod-thumb-fallback"></div>
                      }
                      <span class="cell-strong">{{ p.name }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="cat-tag">{{ p.categoryName || 'Sản phẩm' }}</span>
                  </td>
                  <td style="text-align: right;">{{ p.price | number }} đ</td>
                  <td style="text-align: center;" class="cell-strong">{{ p.sold | number }}</td>
                  <td style="text-align: right; font-weight: 700; color: var(--primary);">{{ p.revenue | number }} đ</td>
                  <td style="text-align: center;">
                    <span class="status-badge" [class]="(p.stock ?? 0) <= 2 ? 'critical' : (p.stock ?? 0) <= 6 ? 'low' : 'active'">
                      {{ p.stock ?? 0 }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="cell-muted" style="text-align: center;">Chưa có dữ liệu bán hàng.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (slug() === 'slow-products') {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 60px;">#</th>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th style="text-align: right;">Đơn giá</th>
                <th style="text-align: center;">Đã bán</th>
                <th style="text-align: right;">Doanh thu</th>
                <th style="text-align: center;">Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              @for (p of data()!.slowSellers; track p._id; let i = $index) {
                <tr>
                  <td>
                    <span class="rank-badge">{{ i + 1 }}</span>
                  </td>
                  <td>
                    <div class="prod-cell">
                      @if (p.imageUrl) {
                        <img [src]="p.imageUrl" class="prod-thumb" alt="{{ p.name }}" />
                      } @else {
                        <div class="prod-thumb-fallback"></div>
                      }
                      <span class="cell-strong">{{ p.name }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="cat-tag">{{ p.categoryName || 'Sản phẩm' }}</span>
                  </td>
                  <td style="text-align: right;">{{ p.price | number }} đ</td>
                  <td style="text-align: center;" class="cell-strong">{{ p.sold | number }}</td>
                  <td style="text-align: right; font-weight: 600;">{{ p.revenue | number }} đ</td>
                  <td style="text-align: center;">
                    <span class="status-badge" [class]="(p.stock ?? 0) <= 2 ? 'critical' : (p.stock ?? 0) <= 6 ? 'low' : 'active'">
                      {{ p.stock ?? 0 }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="cell-muted" style="text-align: center;">Chưa có dữ liệu sản phẩm.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (slug() === 'inventory') {
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
          <p class="inv-summary" style="margin: 0;">
            Có <strong>{{ data()!.cards.lowStockCount }}</strong> sản phẩm sắp hết hàng cần xử lý.
          </p>
          <a routerLink="/admin/products" class="btn-action secondary">Quản lý kho hàng</a>
        </div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th style="text-align: right;">Đơn giá</th>
                <th style="text-align: center;">Tồn kho hiện tại</th>
                <th style="text-align: center;">Trạng thái cảnh báo</th>
                <th style="text-align: center; width: 120px;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (p of data()!.lowStockProducts; track p.name) {
                <tr>
                  <td>
                    <div class="prod-cell">
                      @if (p.imageUrl) {
                        <img [src]="p.imageUrl" class="prod-thumb" alt="{{ p.name }}" />
                      } @else {
                        <div class="prod-thumb-fallback"></div>
                      }
                      <span class="cell-strong">{{ p.name }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="cat-tag">{{ p.categoryName || 'Sản phẩm' }}</span>
                  </td>
                  <td style="text-align: right;">{{ p.price | number }} đ</td>
                  <td style="text-align: center;" class="cell-strong">{{ p.stock }}</td>
                  <td style="text-align: center;">
                    <span class="status-badge" [class]="p.level === 'critical' ? 'critical' : 'low'">
                      {{ p.level === 'critical' ? 'Nguy cấp (≤2)' : 'Tồn thấp (≤6)' }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <a [routerLink]="['/admin/products', p._id, 'edit']" class="btn-edit-action">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; margin-right: 4px; display: inline-block; vertical-align: middle;">
                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                      <span>Sửa</span>
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="cell-muted" style="text-align: center;">Không có sản phẩm nào sắp hết hàng.</td>
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
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }

      @media (max-width: 900px) {
        .stat-grid {
          grid-template-columns: repeat(2, 1fr);
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

      .stat-box strong {
        font-size: 1.125rem;
      }

      .panel {
        padding: 1.25rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
      }

      .panel h3 {
        margin: 0 0 1rem;
        font-size: 0.9375rem;
      }

      .bar-chart {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
        height: 160px;
        padding-top: 0.5rem;
      }

      .bar-chart--tall {
        height: 220px;
      }

      .bar-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        min-width: 0;
      }

      .bar {
        width: 100%;
        max-width: 40px;
        min-height: 4px;
        background: linear-gradient(180deg, #8b6914, #5c4033);
        border-radius: 4px 4px 0 0;
        transition: height 0.2s;
      }

      .bar-value {
        font-size: 0.65rem;
        color: var(--muted);
      }

      .bar-label {
        font-size: 0.7rem;
        color: var(--muted);
      }

      .coming-soon {
        padding: 2rem;
        text-align: center;
        border: 1px dashed var(--border);
        border-radius: 10px;
        background: #fafbfc;
      }

      .coming-soon p {
        margin: 0 0 1rem;
        color: var(--muted);
      }

      .inv-summary {
        margin: 0 0 1rem;
        font-size: 0.875rem;
      }

      .chart-layout-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }

      .chart-panel-card {
        padding: 1.25rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
      }

      .chart-panel-card h3 {
        margin: 0 0 1.25rem;
        font-size: 0.875rem;
        font-weight: 700;
        color: #8c6239;
        border-bottom: 1px solid var(--border-light);
        padding-bottom: 0.5rem;
      }

      .donut-panel {
        grid-column: span 2;
      }

      .line-chart-wrap {
        height: 220px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .svg-chart {
        overflow: visible;
      }

      .chart-point {
        transition: r 0.15s ease;
        cursor: pointer;
      }

      .chart-point:hover {
        r: 6;
      }

      .chart-lbl {
        font-size: 0.65rem;
        fill: var(--muted);
      }

      .donut-chart-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3rem;
        padding: 1rem 0;
      }

      @media (max-width: 768px) {
        .chart-layout-grid {
          grid-template-columns: 1fr;
        }
        .donut-panel {
          grid-column: span 1;
        }
        .donut-chart-wrap {
          flex-direction: column;
          gap: 1.5rem;
        }
        .stat-grid {
          grid-template-columns: 1fr;
        }
        .filter-row {
          flex-direction: column;
          align-items: stretch;
        }
      }

      .donut-chart-svg {
        width: 160px;
        height: 160px;
        transform: rotate(-90deg);
      }

      .donut-segment {
        transition: stroke-width 0.2s ease;
      }

      .donut-segment:hover {
        stroke-width: 24;
      }

      .donut-center-lbl {
        font-size: 8px;
        fill: var(--muted);
        font-weight: 600;
      }

      .donut-center-val {
        font-size: 14px;
        fill: var(--text);
        font-weight: 700;
      }

      .donut-legend {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 220px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        font-size: 0.8125rem;
      }

      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        flex-shrink: 0;
      }

      .legend-name {
        color: var(--text-secondary);
        flex: 1;
      }

      .legend-val {
        color: var(--text);
        font-weight: 600;
      }

      /* Rank Badges */
      .rank-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        font-weight: 700;
        font-size: 0.75rem;
        background: var(--border-light);
        color: var(--text-secondary);
      }
      .rank-1 {
        background: #fef08a; /* Gold */
        color: #854d0e;
        box-shadow: 0 2px 4px rgba(234,179,8,0.2);
      }
      .rank-2 {
        background: #e5e7eb; /* Silver */
        color: #374151;
      }
      .rank-3 {
        background: #fed7aa; /* Bronze */
        color: #9a3412;
      }

      /* Product Cells & Thumbnails */
      .prod-cell {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .prod-thumb {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        object-fit: cover;
        border: 1px solid var(--border-light);
        background: #f9f9f9;
      }
      .prod-thumb-fallback {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        background: #efebe9;
        border: 1px dashed var(--border);
        position: relative;
        flex-shrink: 0;
      }
      .prod-thumb-fallback::after {
        content: '🛋️';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.1rem;
      }

      /* Category Tags */
      .cat-tag {
        background: #f5efe6;
        color: #8c6239;
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        border: 1px solid #ebdcd0;
        display: inline-block;
      }

      /* Filter Row */
      .filter-row {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
        align-items: center;
        background: var(--surface);
        padding: 0.65rem 1rem;
        border: 1px solid var(--border);
        border-radius: 8px;
      }
      .btn-filter {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--text-secondary);
        padding: 0.35rem 0.75rem;
        font-size: 0.75rem;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.15s ease;
      }
      .btn-filter:hover {
        background: var(--border-light);
        color: var(--text);
      }
      .btn-filter.active {
        background: var(--primary);
        border-color: var(--primary);
        color: #ffffff;
        font-weight: 600;
      }

      /* VIP Badges */
      .status-badge.vip {
        background: #fef3c7;
        color: #d97706;
        border: 1px solid #fcd34d;
        font-size: 0.7rem;
        font-weight: 600;
      }
      .status-badge.member {
        background: #f3f4f6;
        color: #4b5563;
        border: 1px solid #e5e7eb;
        font-size: 0.7rem;
        font-weight: 600;
      }

      /* Edit Action Button */
      .btn-edit-action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 1px solid var(--border);
        color: var(--text-secondary);
        padding: 0.3rem 0.6rem;
        font-size: 0.75rem;
        font-weight: 500;
        border-radius: 6px;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn-edit-action:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: #fffbf7;
      }

      .page-state.error {
        color: #b91c1c;
      }
    `
  ]
})
export class ReportsPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly year = new Date().getFullYear();
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly data = signal<DashboardPayload | null>(null);

  readonly slug = signal<ReportSlug>('revenue');

  readonly meta = computed(() => PAGE_META[this.slug()] || PAGE_META.revenue);

  private maxRevenue = 1;

  // Dynamic Revenue Filter state
  readonly revenueMode = signal<'day' | 'month' | 'year'>('day');
  readonly revenueDays = signal<number>(7);
  readonly revenueChartData = signal<Array<{ label: string; revenue: number }>>([]);
  readonly loadingRevenueChart = signal<boolean>(false);

  readonly maxRevenueDynamic = computed(() => {
    const list = this.revenueChartData();
    return Math.max(1, ...list.map((c) => c.revenue));
  });

  dynamicBarHeight(revenue: number): number {
    return Math.max(4, Math.round((revenue / this.maxRevenueDynamic()) * 100));
  }

  loadRevenueChartData(): void {
    this.loadingRevenueChart.set(true);
    const mode = this.revenueMode();
    const days = mode === 'day' ? this.revenueDays() : undefined;
    this.api.getRevenueChart({ mode, days }).subscribe({
      next: (res) => {
        this.revenueChartData.set(res.chart);
        this.loadingRevenueChart.set(false);
      },
      error: () => {
        this.loadingRevenueChart.set(false);
      }
    });
  }

  setRevenueFilter(mode: 'day' | 'month' | 'year', days?: number): void {
    this.revenueMode.set(mode);
    if (days != null) {
      this.revenueDays.set(days);
    }
    this.loadRevenueChartData();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const s = (params.get('slug') || 'revenue') as ReportSlug;
      this.slug.set(s);
      if (s === 'revenue') {
        this.loadRevenueChartData();
      }
    });

    this.api.getDashboardSummary().subscribe({
      next: (res) => {
        this.data.set(res);
        this.maxRevenue = Math.max(1, ...res.chart.map((c) => c.revenue));
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Không tải được dữ liệu báo cáo.');
        this.loading.set(false);
      }
    });
  }

  barHeight(revenue: number): number {
    return Math.max(4, Math.round((revenue / this.maxRevenue) * 100));
  }

  readonly lineChartPaths = computed(() => {
    const list = this.data()?.chart || [];
    if (!list.length) return { line: '', area: '', points: [] as {x: number, y: number, label: string, value: number}[] };
    const max = Math.max(1, ...list.map(c => c.revenue));
    const width = 520;
    const height = 160;
    const paddingLeft = 50;
    const paddingTop = 30;
    
    const points = list.map((item, i) => {
      const x = paddingLeft + i * (width / 11);
      const y = paddingTop + height - (item.revenue / max) * height;
      return { x, y, label: item.month, value: item.revenue };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + height} L ${points[0].x} ${paddingTop + height} Z`;
    
    return { line: linePath, area: areaPath, points };
  });

  readonly categoryChartData = computed(() => {
    const list = this.data()?.categories || [];
    const total = list.reduce((sum, c) => sum + c.count, 0) || 1;
    let accumulatedPercent = 0;
    
    const colors = ['#8c6239', '#a07246', '#c29c68', '#5c4033', '#ebdcd0', '#3b82f6'];
    
    const items = list.map((item, index) => {
      const percent = (item.count / total) * 100;
      const color = colors[index % colors.length];
      const startAngle = (accumulatedPercent / 100) * 360;
      const endAngle = ((accumulatedPercent + percent) / 100) * 360;
      accumulatedPercent += percent;
      
      const r = 50;
      const circ = 2 * Math.PI * r;
      const dashArray = `${(percent / 100) * circ} ${circ}`;
      const dashOffset = `${- (startAngle / 360) * circ}`;
      
      return {
        name: item.name,
        count: item.count,
        percent,
        color,
        dashArray,
        dashOffset
      };
    });
    
    return { items, total };
  });
}
