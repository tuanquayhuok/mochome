import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';

interface SummaryCards {
  revenueToday: number;
  revenueMonth: number;
  revenueAll: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  lowStockCount: number;
}

interface ChartPoint {
  label: string;
  revenue: number;
}

type ChartPeriod = 'day30' | 'month' | 'year';

interface RecentOrderRow {
  id: string;
  customer: string;
  total: number;
  status: string;
}

interface ProductRow {
  name: string;
  sold: number;
  image?: string;
}

interface CategoryRow {
  name: string;
  count: number;
}

interface LowStockRow {
  name: string;
  stock: number;
  level: 'low' | 'critical';
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  returned: 'Hoàn trả'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dash">
      @if (loading()) {
        <div class="dash-loading muted">Đang tải dữ liệu...</div>
      }

      <section class="kpi-row">
        @for (kpi of kpis(); track kpi.label) {
          <article class="kpi panel">
            <div class="kpi-head">
              <span class="kpi-ico" [innerHTML]="kpi.icon"></span>
              <span class="kpi-label">{{ kpi.label }}</span>
            </div>
            <p class="kpi-value">{{ kpi.display }}</p>
            <p class="kpi-sub muted">{{ kpi.sub }}</p>
            <svg class="kpi-spark" viewBox="0 0 120 32" preserveAspectRatio="none">
              <polyline [attr.points]="kpi.spark" fill="none" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </article>
        }
      </section>

      <section class="mid-row">
        <article class="panel chart-card">
          <div class="card-head">
            <h2 class="card-title">{{ chartTitle() }}</h2>
            <div class="card-actions">
              <select class="select-sm" [value]="chartPeriod()" (change)="onChartPeriodChange($event)">
                <option value="day30">30 ngày gần đây</option>
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>
            </div>
          </div>
          @if (chartLoading()) {
            <p class="chart-loading muted">Đang tải biểu đồ...</p>
          } @else {
            <div class="line-chart-wrap">
              <div class="y-axis">
                @for (tick of chartYTicks(); track $index) {
                  <span>{{ tick.label }}</span>
                }
              </div>
              <div class="chart-body">
                <svg class="line-chart" [attr.viewBox]="'0 0 ' + chartW + ' ' + chartH" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="rgba(55,65,81,0.12)" />
                      <stop offset="100%" stop-color="rgba(55,65,81,0)" />
                    </linearGradient>
                  </defs>
                  @for (tick of chartYTicks(); track $index) {
                    <line
                      [attr.x1]="pad.l"
                      [attr.y1]="tick.y"
                      [attr.x2]="chartW - pad.r"
                      [attr.y2]="tick.y"
                      class="grid-line"
                    />
                  }
                  @if (chartData().length) {
                    <path [attr.d]="areaPath()" fill="url(#areaFill)" />
                    <path [attr.d]="linePath()" class="line-path" fill="none" />
                    @for (p of chartPoints(); track $index) {
                      <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" class="line-dot">
                        <title>{{ p.revenue | number }} đ</title>
                      </circle>
                    }
                  }
                </svg>
                <div class="chart-labels" [class.chart-labels--dense]="chartPeriod() === 'day30'">
                  @for (pt of chartData(); track $index) {
                    <span [title]="pt.label">{{ pt.label }}</span>
                  }
                </div>
              </div>
            </div>
          }
        </article>

        <article class="panel orders-card">
          <div class="card-head">
            <h2 class="card-title">Đơn hàng mới nhất</h2>
            <a routerLink="/admin/orders" class="link-muted">Xem tất cả</a>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã đơn hàng</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                @for (o of recentOrders(); track o.id) {
                  <tr>
                    <td class="mono">{{ o.id }}</td>
                    <td>{{ o.customer }}</td>
                    <td>{{ o.total | number }} đ</td>
                    <td>
                      <span class="status-badge" [class]="o.status">{{ statusLabel(o.status) }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="bottom-row">
        <article class="panel list-card">
          <h2 class="card-title">Sản phẩm bán chạy</h2>
          <ul class="product-list">
            @for (p of bestSellers(); track p.name) {
              <li>
                <div class="thumb"></div>
                <div class="product-meta">
                  <span class="product-name">{{ p.name }}</span>
                  <span class="muted">{{ p.sold }} sản phẩm</span>
                </div>
              </li>
            }
          </ul>
        </article>

        <article class="panel list-card">
          <h2 class="card-title">Danh mục sản phẩm</h2>
          <ul class="cat-list">
            @for (c of categories(); track c.name) {
              <li>
                <span class="cat-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </span>
                <span class="cat-name">{{ c.name }}</span>
                <span class="cat-count muted">{{ c.count }} sản phẩm</span>
              </li>
            }
          </ul>
        </article>

        <article class="panel list-card">
          <h2 class="card-title">Sản phẩm tồn kho thấp</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                @for (p of lowStock(); track p.name) {
                  <tr>
                    <td>
                      <div class="stock-name">
                        <div class="thumb sm"></div>
                        <span>{{ p.name }}</span>
                      </div>
                    </td>
                    <td>{{ p.stock }}</td>
                    <td>
                      <span class="status-badge" [class]="p.level === 'critical' ? 'critical' : 'low'">
                        {{ p.level === 'critical' ? 'Rất thấp' : 'Thấp' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  `,
  styles: [
    `
      .dash {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        max-width: 1440px;
      }

      .dash-loading {
        padding: 2rem;
        text-align: center;
      }

      .kpi-row {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 1rem;
      }

      .kpi {
        padding: 1rem 1rem 0.65rem;
        position: relative;
        overflow: hidden;
      }

      .kpi-head {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.65rem;
      }

      .kpi-ico {
        display: flex;
        width: 16px;
        height: 16px;
        color: var(--muted);
      }

      .kpi-ico :deep(svg) {
        width: 16px;
        height: 16px;
      }

      .kpi-label {
        font-size: 0.8125rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .kpi-value {
        margin: 0;
        font-size: 1.375rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        line-height: 1.2;
      }

      .kpi-sub {
        margin: 0.2rem 0 0.5rem;
        font-size: 0.75rem;
      }

      .kpi-spark {
        width: 100%;
        height: 28px;
        color: #9ca3af;
        opacity: 0.85;
      }

      .mid-row {
        display: grid;
        grid-template-columns: 1.45fr 1fr;
        gap: 1rem;
        align-items: stretch;
      }

      .bottom-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }

      .panel {
        padding: 1.15rem 1.25rem;
      }

      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .card-title {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
      }

      .card-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .select-sm {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.35rem 0.65rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
        background: var(--surface);
      }

      .icon-btn-sm {
        width: 32px;
        height: 32px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
        display: grid;
        place-items: center;
        cursor: pointer;
        color: var(--text-secondary);
      }

      .icon-btn-sm svg {
        width: 16px;
        height: 16px;
      }

      .line-chart-wrap {
        display: flex;
        gap: 0.5rem;
        align-items: stretch;
      }

      .y-axis {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-width: 2.75rem;
        padding-top: 0.75rem;
        padding-bottom: 1.75rem;
        font-size: 0.625rem;
        color: var(--muted);
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      .chart-body {
        flex: 1;
        min-width: 0;
      }

      .chart-loading {
        margin: 0;
        padding: 2rem 0;
        text-align: center;
        font-size: 0.8125rem;
      }

      .line-chart {
        width: 100%;
        height: 220px;
        display: block;
      }

      .grid-line {
        stroke: var(--border-light);
        stroke-width: 1;
      }

      .line-path {
        stroke: var(--chart-line);
        stroke-width: 2;
      }

      .line-dot {
        fill: var(--chart-line);
      }

      .chart-labels {
        display: flex;
        justify-content: space-between;
        gap: 0.15rem;
        margin-top: 0.35rem;
        padding: 0 0.25rem;
        font-size: 0.6875rem;
        color: var(--muted);
      }

      .chart-labels span {
        flex: 1;
        min-width: 0;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .chart-labels--dense {
        gap: 0;
        font-size: 0.5rem;
        letter-spacing: -0.02em;
      }

      .chart-labels--dense span {
        overflow: visible;
        text-overflow: clip;
      }

      .mono {
        font-variant-numeric: tabular-nums;
        font-weight: 500;
      }

      .product-list,
      .cat-list {
        list-style: none;
        margin: 0.75rem 0 0;
        padding: 0;
      }

      .product-list li {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.65rem 0;
        border-bottom: 1px solid var(--border-light);
      }

      .product-list li:last-child {
        border-bottom: none;
      }

      .thumb {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: linear-gradient(135deg, #e5e7eb, #d1d5db);
        flex-shrink: 0;
      }

      .thumb.sm {
        width: 32px;
        height: 32px;
      }

      .product-meta {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }

      .product-name {
        font-size: 0.8125rem;
        font-weight: 500;
      }

      .cat-list li {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.55rem 0;
        border-bottom: 1px solid var(--border-light);
        font-size: 0.8125rem;
      }

      .cat-list li:last-child {
        border-bottom: none;
      }

      .cat-ico {
        display: flex;
        color: var(--muted);
      }

      .cat-ico svg {
        width: 16px;
        height: 16px;
      }

      .cat-name {
        flex: 1;
        font-weight: 500;
      }

      .stock-name {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      @media (max-width: 1280px) {
        .kpi-row {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .mid-row {
          grid-template-columns: 1fr;
        }

        .bottom-row {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .kpi-row {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `
  ]
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly currentYear = new Date().getFullYear();
  readonly chartW = 560;
  readonly chartH = 180;
  readonly pad = { t: 12, r: 8, b: 8, l: 12 };

  loading = signal(true);
  chartLoading = signal(true);
  chartPeriod = signal<ChartPeriod>('month');
  chartMax = signal(1);
  cards = signal<SummaryCards>({
    revenueToday: 0,
    revenueMonth: 0,
    revenueAll: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    lowStockCount: 0
  });
  chartData = signal<ChartPoint[]>([]);
  recentOrders = signal<RecentOrderRow[]>([]);
  bestSellers = signal<ProductRow[]>([]);
  categories = signal<CategoryRow[]>([]);
  lowStock = signal<LowStockRow[]>([]);
  private summaryChartFallback = signal<ChartPoint[]>([]);

  ngOnInit(): void {
    this.api.getDashboardSummary().subscribe({
      next: (data) => {
        this.cards.set({
          revenueToday: data.cards.revenueToday ?? 0,
          revenueMonth: data.cards.revenueMonth ?? 0,
          revenueAll: data.cards.revenueAll ?? 0,
          totalOrders: data.cards.totalOrders ?? 0,
          totalUsers: data.cards.totalUsers ?? 0,
          totalProducts: data.cards.totalProducts ?? 0,
          lowStockCount: data.cards.lowStockCount ?? 0
        });
        if (data.chart?.length) {
          this.summaryChartFallback.set(
            data.chart.map((c) => ({
              label: c.month,
              revenue: c.revenue ?? 0
            }))
          );
        }
        this.loadChartData();
        if (data.recentOrders?.length) {
          this.recentOrders.set(
            data.recentOrders.map((o: Record<string, unknown>) => ({
              id: `#${String(o['_id'] ?? '').slice(-6).toUpperCase()}`,
              customer:
                (o['user'] as { fullName?: string })?.fullName ?? 'Khách lẻ',
              total: Number(o['totalAmount'] ?? 0),
              status: String(o['status'] ?? 'pending')
            }))
          );
        }
        if (data.bestSellers?.length) {
          this.bestSellers.set(
            data.bestSellers.map((p) => ({
              name: p.name,
              sold: p.sold
            }))
          );
        }
        if (data.categories?.length) {
          this.categories.set(data.categories);
        }
        if (data.lowStockProducts?.length) {
          this.lowStock.set(
            data.lowStockProducts.map((p) => ({
              name: p.name,
              stock: p.stock,
              level: p.level === 'critical' ? 'critical' : 'low'
            }))
          );
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadChartData();
      }
    });
  }

  kpis() {
    const c = this.cards();
    return [
      {
        label: 'Tổng doanh thu',
        display: this.formatMoney(c.revenueAll),
        sub: 'Tất cả thời gian',
        icon: this.ico('coin'),
        spark: this.spark(42, 55, 48, 62, 58, 70, 75)
      },
      {
        label: 'Đơn hàng',
        display: this.formatNum(c.totalOrders),
        sub: 'Tất cả thời gian',
        icon: this.ico('cart'),
        spark: this.spark(30, 38, 35, 45, 42, 50, 48)
      },
      {
        label: 'Khách hàng',
        display: this.formatNum(c.totalUsers),
        sub: 'Tất cả thời gian',
        icon: this.ico('users'),
        spark: this.spark(20, 28, 32, 30, 38, 40, 44)
      },
      {
        label: 'Sản phẩm',
        display: this.formatNum(c.totalProducts),
        sub: 'Tất cả thời gian',
        icon: this.ico('box'),
        spark: this.spark(25, 30, 28, 35, 33, 38, 36)
      },
      {
        label: 'Tồn kho thấp',
        display: this.formatNum(c.lowStockCount),
        sub: 'Tất cả thời gian',
        icon: this.ico('alert'),
        spark: this.spark(50, 45, 40, 38, 35, 32, 28)
      }
    ];
  }

  chartTitle(): string {
    switch (this.chartPeriod()) {
      case 'day30':
        return 'Doanh thu 30 ngày gần đây';
      case 'month':
        return 'Doanh thu theo tháng';
      case 'year':
        return 'Doanh thu theo năm';
      default:
        return 'Doanh thu';
    }
  }

  onChartPeriodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ChartPeriod;
    this.chartPeriod.set(value);
    this.loadChartData();
  }

  chartYTicks(): Array<{ label: string; y: number }> {
    const max = this.chartMax();
    const innerH = this.chartH - this.pad.t - this.pad.b;
    const steps = 4;
    const ticks: Array<{ label: string; y: number }> = [];
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const value = max * (1 - ratio);
      ticks.push({
        label: this.formatAxisMoney(value, max),
        y: this.pad.t + ratio * innerH
      });
    }
    return ticks;
  }

  chartPoints(): Array<{ x: number; y: number; revenue: number }> {
    const data = this.chartData();
    if (!data.length) return [];
    const innerW = this.chartW - this.pad.l - this.pad.r;
    const innerH = this.chartH - this.pad.t - this.pad.b;
    const max = this.chartMax();
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;
    return data.map((d, i) => ({
      x: this.pad.l + i * step,
      y: this.pad.t + innerH - (d.revenue / max) * innerH,
      revenue: d.revenue
    }));
  }

  linePath(): string {
    const pts = this.chartPoints();
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  }

  areaPath(): string {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    const base = this.chartH - this.pad.b;
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L${last.x},${base} L${first.x},${base} Z`;
  }

  yGrid(): number[] {
    return this.chartYTicks().map((t) => t.y);
  }

  private loadChartData(): void {
    this.chartLoading.set(true);
    const period = this.chartPeriod();
    const query =
      period === 'day30'
        ? { mode: 'day' as const, days: 30 }
        : period === 'month'
          ? { mode: 'month' as const }
          : { mode: 'year' as const, year: this.currentYear };

    this.api.getRevenueChart(query).subscribe({
      next: (res) => {
        let chart = (res.chart ?? []).map((c) => ({
          label: c.label,
          revenue: c.revenue ?? 0
        }));
        if (period === 'day30') {
          chart = this.ensureDayChart(chart, 30);
        }
        if (chart.length) {
          this.applyChart(chart);
        } else {
          this.applyFallbackChart(period);
        }
      },
      error: () => this.applyFallbackChart(period)
    });
  }

  private ensureDayChart(chart: ChartPoint[], days: number): ChartPoint[] {
    const slots = this.buildDayChart(days);
    if (chart.length === days) {
      return chart.map((c, i) => ({
        label: slots[i].label,
        revenue: c.revenue ?? 0
      }));
    }
    const byKey = new Map(chart.map((c) => [c.label, c.revenue]));
    return slots.map((slot) => ({
      label: slot.label,
      revenue: byKey.get(slot.label) ?? 0
    }));
  }

  private buildDayChart(days: number): ChartPoint[] {
    const chart: ChartPoint[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      chart.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        revenue: 0
      });
    }
    return chart;
  }

  private applyFallbackChart(period: ChartPeriod): void {
    const fallback = this.summaryChartFallback();
    if (period === 'day30') {
      this.applyChart(this.buildDayChart(30));
      return;
    }
    if (period === 'year' && fallback.length) {
      this.applyChart(fallback);
      return;
    }
    if (period === 'month' && fallback.length) {
      this.applyChart(fallback);
      return;
    }
    this.applyChart([]);
  }

  private applyChart(chart: ChartPoint[]): void {
    this.chartData.set(chart);
    this.chartMax.set(this.computeChartMax(chart.map((c) => c.revenue)));
    this.chartLoading.set(false);
  }

  private computeChartMax(revenues: number[]): number {
    const raw = Math.max(...revenues, 0);
    if (raw === 0) return 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    return Math.ceil(raw / magnitude) * magnitude;
  }

  private formatAxisMoney(value: number, scaleMax?: number): string {
    const max = scaleMax ?? value;
    const n = Math.round(value);
    if (max >= 1_000_000_000) {
      const v = value / 1_000_000_000;
      return `${v >= 10 ? Math.round(v) : v.toFixed(1)} tỷ`;
    }
    if (max >= 1_000_000) {
      const v = value / 1_000_000;
      return `${v >= 10 ? Math.round(v) : v.toFixed(1)} tr`;
    }
    if (max >= 1_000) {
      const v = value / 1_000;
      return `${v >= 10 ? Math.round(v) : v.toFixed(1)} k`;
    }
    return n.toLocaleString('vi-VN');
  }

  statusLabel(status: string): string {
    return STATUS_LABEL[status] ?? status;
  }

  private formatMoney(n: number): string {
    return `${n.toLocaleString('vi-VN')} đ`;
  }

  private formatNum(n: number): string {
    return n.toLocaleString('vi-VN');
  }

  private spark(...values: number[]): string {
    const w = 120;
    const h = 32;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return `${x},${y}`;
      })
      .join(' ');
  }

  private ico(type: string): string {
    const icons: Record<string, string> = {
      coin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9 12h6"/></svg>`,
      cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>`,
      users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
      box: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>`,
      alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    };
    return icons[type] ?? icons['box'];
  }
}
