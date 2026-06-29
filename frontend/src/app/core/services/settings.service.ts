import { Injectable, signal } from '@angular/core';

export interface SystemContact {
  address: string;
  phone: string;
  email: string;
  workingHoursWeekdays: string;
  workingHoursSunday: string;
  mapUrl: string;
  mapLink: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  content: string;
  time: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly CONTACT_KEY = 'mochome_system_contact';
  private readonly NOTIFICATIONS_KEY = 'mochome_notifications';

  // Default contact settings
  private defaultContact: SystemContact = {
    address: '123 Đường ABC, Phường XYZ, Quận 1, TP. Hồ Chí Minh',
    phone: '0901 234 567',
    email: 'support@mochome.vn',
    workingHoursWeekdays: 'Thứ 2 - Thứ 7: 8:00 - 17:30',
    workingHoursSunday: 'Chủ nhật: 8:30 - 12:00',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.954!2d106.701!3d10.7769!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752a4139c8d0b1%3A0x9b8f3c8e8e8e8e8e!2zSOG7jWMgQ2jDrSBNaW5o!5e0!3m2!1svi!2s!4v1',
    mapLink: 'https://www.google.com/maps/search/?api=1&query=123+Duong+ABC+Quan+1+Ho+Chi+Minh'
  };

  // Default notifications
  private defaultNotifications: NotificationItem[] = [
    { id: 1, title: 'Chào mừng quý khách', content: 'Cảm ơn quý khách đã tin dùng sản phẩm nội thất gỗ tự nhiên của Mộc Home!', time: '1 giờ trước', read: false },
    { id: 2, title: 'Khuyến mãi hè cực khủng', content: 'Nhập mã MOCHOMEHE26 để được giảm thêm 15% cho mọi sản phẩm thiết kế gỗ sồi.', time: '5 giờ trước', read: false },
    { id: 3, title: 'Đơn hàng thành công', content: 'Chúc mừng! Đơn hàng #MH-992 của bạn đã hoàn thành giao hàng thành công.', time: '1 ngày trước', read: true }
  ];

  readonly contactSettings = signal<SystemContact>(this.loadContact());
  readonly notifications = signal<NotificationItem[]>(this.loadNotifications());

  private loadContact(): SystemContact {
    const data = localStorage.getItem(this.CONTACT_KEY);
    if (data) {
      try {
        return { ...this.defaultContact, ...JSON.parse(data) };
      } catch (e) {
        return this.defaultContact;
      }
    }
    return this.defaultContact;
  }

  private loadNotifications(): NotificationItem[] {
    const data = localStorage.getItem(this.NOTIFICATIONS_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return this.defaultNotifications;
      }
    }
    return this.defaultNotifications;
  }

  saveContact(settings: SystemContact): void {
    this.contactSettings.set(settings);
    localStorage.setItem(this.CONTACT_KEY, JSON.stringify(settings));
  }

  saveNotifications(list: NotificationItem[]): void {
    this.notifications.set(list);
    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(list));
  }

  addNotification(title: string, content: string): void {
    const newItem: NotificationItem = {
      id: Date.now(),
      title,
      content,
      time: 'Vừa xong',
      read: false
    };
    const updated = [newItem, ...this.notifications()];
    this.saveNotifications(updated);
  }

  markAllRead(): void {
    const updated = this.notifications().map(n => ({ ...n, read: true }));
    this.saveNotifications(updated);
  }

  clearNotification(id: number): void {
    const updated = this.notifications().filter(n => n.id !== id);
    this.saveNotifications(updated);
  }
}
