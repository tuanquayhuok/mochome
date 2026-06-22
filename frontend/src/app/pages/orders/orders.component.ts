import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2 class="page-title">Quan ly don hang</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ma don</th>
            <th>Khach hang</th>
            <th>Tong tien</th>
            <th>Trang thai</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of rows">
            <td>{{ item._id }}</td>
            <td>{{ item.user?.fullName || item.user?.email || '-' }}</td>
            <td>{{ item.totalAmount | number }} VND</td>
            <td><span class="status status-{{ item.status }}">{{ item.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class OrdersComponent implements OnInit {
  private readonly api = inject(ApiService);
  rows: Array<any> = [];

  ngOnInit(): void {
    this.api.list('orders').subscribe((rows) => (this.rows = rows));
  }
}
