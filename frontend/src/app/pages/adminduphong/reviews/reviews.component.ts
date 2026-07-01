import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { ReviewRow } from '../../core/models/admin-list.models';
import { AdminPageShellComponent } from '../../shared/admin-page-shell.component';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, AdminPageShellComponent],
  template: `
    <app-admin-page-shell>
      @if (loading()) {
        <div class="page-state">Đang tải đánh giá...</div>
      } @else if (!rows.length) {
        <div class="page-state">Chưa có đánh giá sản phẩm.</div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Sản phẩm</th>
                <th>Số sao</th>
                <th>Nội dung</th>
                <th>Duyệt</th>
              </tr>
            </thead>
            <tbody>
              @for (item of rows; track item._id) {
                <tr>
                  <td class="cell-strong">
                    {{ item.user?.fullName || item.user?.email }}
                  </td>
                  <td>{{ item.product?.name }}</td>
                  <td>{{ item.rating }}/5</td>
                  <td class="cell-muted">{{ item.comment }}</td>
                  <td>
                    <span
                      class="status-badge"
                      [class.completed]="item.approved"
                      [class.pending]="!item.approved"
                    >
                      {{ item.approved ? 'Đã duyệt' : 'Chờ duyệt' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </app-admin-page-shell>
  `
})
export class ReviewsComponent implements OnInit {
  private readonly api = inject(ApiService);
  rows: ReviewRow[] = [];
  loading = signal(true);

  ngOnInit(): void {
    this.api.list<ReviewRow>('reviews').subscribe({
      next: (rows) => {
        this.rows = rows;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
