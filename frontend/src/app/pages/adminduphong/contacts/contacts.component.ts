import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { ContactRow } from '../../core/models/admin-list.models';
import { AdminPageShellComponent } from '../../shared/admin-page-shell.component';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, AdminPageShellComponent],
  template: `
    <app-admin-page-shell>
      @if (loading()) {
        <div class="page-state">Đang tải liên hệ...</div>
      } @else if (!rows.length) {
        <div class="page-state">Chưa có tin nhắn liên hệ.</div>
      } @else {
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Chủ đề</th>
                <th>Tin nhắn</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              @for (item of rows; track item._id || item.email) {
                <tr>
                  <td class="cell-strong">{{ item.fullName }}</td>
                  <td class="cell-muted">{{ item.email }}</td>
                  <td>{{ item.subject }}</td>
                  <td>{{ item.message }}</td>
                  <td>
                    <span class="status-badge pending">{{ item.status }}</span>
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
export class ContactsComponent implements OnInit {
  private readonly api = inject(ApiService);
  rows: ContactRow[] = [];
  loading = signal(true);

  ngOnInit(): void {
    this.api.list<ContactRow>('contacts').subscribe({
      next: (rows) => {
        this.rows = rows;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
