import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface LookbookItem {
  id: string;
  category: 'living' | 'dining' | 'bedroom' | 'office';
  image: string;
  clientName: string;
  location: string;
  feedback: string;
  rating: number;
  productName: string;
  productLink: string;
}

@Component({
  selector: 'app-lookbook',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="lookbook-page">
      <div class="lookbook-hero">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1>Góc Thực Tế Mộc Home</h1>
          <p>Hình ảnh thực tế lắp đặt nội thất tại nhà khách hàng — Minh chứng cho chất lượng và độ hoàn thiện tinh xảo.</p>
        </div>
      </div>

      <div class="store-container">
        <!-- Action bar to upload image -->
        <div class="action-bar-lookbook">
          <button type="button" class="upload-trigger-btn" (click)="openUploadModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-ico">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Đăng ảnh góc thực tế của bạn
          </button>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-bar">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              class="filter-tab"
              [class.active]="activeTab() === tab.id"
              (click)="activeTab.set(tab.id)"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Gallery Grid -->
        <div class="gallery-grid">
          @for (item of filteredItems(); track item.id) {
            <div class="gallery-card">
              <div class="card-image-wrap">
                <img [src]="item.image" [alt]="item.clientName" class="gallery-img" />
                <div class="card-overlay">
                  <div class="overlay-top">
                    <span class="stars">
                      @for (s of [1, 2, 3, 4, 5]; track s) {
                        ★
                      }
                    </span>
                    <span class="location">{{ item.location }}</span>
                  </div>
                  <p class="feedback-quote">“{{ item.feedback }}”</p>
                  <div class="overlay-bottom">
                    <strong class="client-name">{{ item.clientName }}</strong>
                    <a [routerLink]="item.productLink" class="product-tag">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tag-ico">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      {{ item.productName }}
                    </a>
                  </div>
                </div>
              </div>
              <div class="card-details-mobile">
                <div class="card-mobile-header">
                  <strong>{{ item.clientName }}</strong>
                  <span class="location-mobile">{{ item.location }}</span>
                </div>
                <p class="feedback-mobile">“{{ item.feedback }}”</p>
                <a [routerLink]="item.productLink" class="product-tag-mobile">
                  {{ item.productName }}
                </a>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Upload Photo Modal -->
      @if (showModal()) {
        <div class="lookbook-modal-backdrop" (click)="closeModal()">
          <div class="lookbook-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Đăng ảnh thực tế căn hộ</h3>
              <button type="button" class="close-modal-btn" (click)="closeModal()">&times;</button>
            </div>
            <form class="modal-form" (submit)="submitPhoto($event)">
              <div class="form-group">
                <label>Họ và tên của bạn *</label>
                <input type="text" [(ngModel)]="formName" name="formName" required placeholder="Ví dụ: Anh Hoàng" />
              </div>
              <div class="form-group">
                <label>Địa điểm / Tên chung cư *</label>
                <input type="text" [(ngModel)]="formLocation" name="formLocation" required placeholder="Ví dụ: Vinhomes Central Park, Bình Thạnh" />
              </div>
              <div class="form-group mb-row">
                <div class="sub-group">
                  <label>Không gian phòng *</label>
                  <select [(ngModel)]="formCategory" name="formCategory">
                    <option value="living">Phòng khách</option>
                    <option value="dining">Phòng ăn</option>
                    <option value="bedroom">Phòng ngủ</option>
                    <option value="office">Phòng làm việc</option>
                  </select>
                </div>
                <div class="sub-group">
                  <label>Sản phẩm đã mua *</label>
                  <input type="text" [(ngModel)]="formProduct" name="formProduct" required placeholder="Ví dụ: Sofa góc chữ L" />
                </div>
              </div>
              <div class="form-group">
                <label>Cảm nhận / Đánh giá của bạn *</label>
                <textarea [(ngModel)]="formFeedback" name="formFeedback" required placeholder="Sản phẩm rất đẹp và chắc chắn..." rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>Đường dẫn hình ảnh thực tế (URL) *</label>
                <input type="text" [(ngModel)]="formImage" name="formImage" required />
                <div class="sample-images-helper">
                  <span>Chọn ảnh mẫu nội thất gỗ:</span>
                  <div class="helper-pics">
                    <img src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=300" (click)="formImage.set('https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=300')" alt="" />
                    <img src="https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?q=80&w=300" (click)="formImage.set('https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?q=80&w=300')" alt="" />
                    <img src="https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=300" (click)="formImage.set('https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=300')" alt="" />
                  </div>
                </div>
              </div>
              <button type="submit" class="submit-modal-btn">Gửi Đăng Ảnh</button>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .lookbook-page {
        background: #fcfaf8;
        padding-bottom: 5rem;
      }

      .lookbook-hero {
        position: relative;
        height: 320px;
        background-image: url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop');
        background-size: cover;
        background-position: center;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: #fff;
        margin-bottom: 2rem;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        background: rgba(44, 34, 27, 0.65);
      }

      .hero-content {
        position: relative;
        z-index: 2;
        max-width: 700px;
        padding: 0 1rem;
      }

      .hero-content h1 {
        font-size: 2.25rem;
        font-weight: 700;
        margin: 0 0 0.75rem;
        letter-spacing: -0.02em;
        text-transform: uppercase;
      }

      .hero-content p {
        font-size: 1rem;
        opacity: 0.9;
        line-height: 1.6;
        margin: 0;
      }

      .action-bar-lookbook {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 1.5rem;
        padding: 0 0.5rem;
      }

      .upload-trigger-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 1.25rem;
        background: #ebdcd0;
        border: 1px solid #ebdcd0;
        color: #5c4033;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .upload-trigger-btn:hover {
        background: #8c7161;
        color: #fff;
        border-color: #8c7161;
        box-shadow: 0 4px 12px rgba(140, 113, 97, 0.15);
      }

      .btn-ico {
        width: 16px;
        height: 16px;
      }

      .filter-bar {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
        margin-bottom: 2.5rem;
        overflow-x: auto;
        padding-bottom: 0.5rem;
      }

      .filter-tab {
        padding: 0.5rem 1.25rem;
        border: 1px solid #ebdcd0;
        border-radius: 999px;
        background: #fff;
        color: #5c524a;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.25s ease;
      }

      .filter-tab:hover,
      .filter-tab.active {
        background: #8c7161;
        color: #fff;
        border-color: #8c7161;
        box-shadow: 0 4px 12px rgba(140, 113, 97, 0.25);
      }

      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 2rem;
      }

      .gallery-card {
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #ebdcd0;
        box-shadow: 0 4px 20px rgba(62, 42, 30, 0.03);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }

      .gallery-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 12px 30px rgba(62, 42, 30, 0.08);
      }

      .card-image-wrap {
        position: relative;
        aspect-ratio: 4/3;
        overflow: hidden;
        background: #eaeaea;
      }

      .gallery-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      .gallery-card:hover .gallery-img {
        transform: scale(1.05);
      }

      .card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(26, 17, 12, 0.9), rgba(26, 17, 12, 0.4));
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        opacity: 0;
        transition: opacity 0.3s ease;
        color: #fff;
      }

      .card-image-wrap:hover .card-overlay {
        opacity: 1;
      }

      .overlay-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8125rem;
      }

      .stars {
        color: #f59e0b;
        font-size: 0.9375rem;
      }

      .location {
        opacity: 0.9;
      }

      .feedback-quote {
        font-style: italic;
        font-size: 0.9rem;
        line-height: 1.6;
        margin: 1rem 0;
        text-align: center;
      }

      .overlay-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .client-name {
        font-size: 0.9375rem;
      }

      .product-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.75rem;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        color: #fff;
        text-decoration: none;
        font-size: 0.75rem;
        font-weight: 600;
        transition: background 0.2s;
      }

      .product-tag:hover {
        background: #fff;
        color: #5c4033;
      }

      .tag-ico {
        width: 12px;
        height: 12px;
      }

      /* Modal Styles */
      .lookbook-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: grid;
        place-items: center;
        padding: 1rem;
        animation: fadeIn 0.25s ease;
      }

      .lookbook-modal-card {
        background: #ffffff;
        border-radius: 16px;
        width: 100%;
        max-width: 500px;
        border: 1px solid #ebdcd0;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem;
        background: #fcfaf8;
        border-bottom: 1px solid #ebdcd0;
      }

      .modal-header h3 {
        margin: 0;
        color: #5c4033;
        font-weight: 700;
      }

      .close-modal-btn {
        background: none;
        border: none;
        font-size: 1.75rem;
        color: #8c7161;
        cursor: pointer;
        line-height: 1;
      }

      .modal-form {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .form-group label {
        font-size: 0.8125rem;
        font-weight: 700;
        color: #5c4033;
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        padding: 0.6rem 0.8rem;
        border: 1px solid #ebdcd0;
        border-radius: 8px;
        font-size: 0.875rem;
        color: #374151;
        background: #fdfcfb;
      }

      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        border-color: #8c7161;
        outline: none;
        box-shadow: 0 0 0 3px rgba(140, 113, 97, 0.15);
      }

      .mb-row {
        flex-direction: row;
        gap: 1rem;
      }

      .sub-group {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .sample-images-helper {
        margin-top: 0.5rem;
      }

      .sample-images-helper span {
        font-size: 0.75rem;
        color: #8c8175;
      }

      .helper-pics {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.25rem;
      }

      .helper-pics img {
        width: 60px;
        height: 45px;
        object-fit: cover;
        border-radius: 4px;
        cursor: pointer;
        border: 2px solid transparent;
        transition: border 0.2s;
      }

      .helper-pics img:hover {
        border-color: #8c7161;
      }

      .submit-modal-btn {
        margin-top: 0.5rem;
        padding: 0.75rem;
        background: #8c7161;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
        text-align: center;
      }

      .submit-modal-btn:hover {
        background: #705648;
      }

      /* Mobile Details (always visible underneath image on small devices) */
      .card-details-mobile {
        display: none;
        padding: 1rem;
        border-top: 1px solid #ebdcd0;
      }

      @media (max-width: 768px) {
        .lookbook-hero {
          height: 200px;
          margin-bottom: 1.5rem;
        }

        .lookbook-hero h1 {
          font-size: 1.75rem;
        }

        .lookbook-hero p {
          font-size: 0.875rem;
        }

        .action-bar-lookbook {
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .gallery-grid {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .card-overlay {
          display: none; /* Hide hover details on mobile */
        }

        .card-details-mobile {
          display: block;
        }

        .card-mobile-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .location-mobile {
          color: #8c8175;
        }

        .feedback-mobile {
          font-size: 0.8125rem;
          font-style: italic;
          color: #5c524a;
          line-height: 1.5;
          margin: 0 0 0.75rem;
        }

        .product-tag-mobile {
          display: inline-block;
          font-size: 0.75rem;
          color: #8c7161;
          text-decoration: none;
          font-weight: 700;
          border-bottom: 1.5px solid #8c7161;
        }

        .mb-row {
          flex-direction: column;
          gap: 1rem;
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes scaleUp {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `
  ]
})
export class LookbookComponent {
  readonly activeTab = signal<'all' | 'living' | 'dining' | 'bedroom' | 'office'>('all');
  readonly showModal = signal(false);

  readonly formName = signal('');
  readonly formLocation = signal('');
  readonly formCategory = signal<'living' | 'dining' | 'bedroom' | 'office'>('living');
  readonly formProduct = signal('');
  readonly formFeedback = signal('');
  readonly formImage = signal('https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600');

  readonly tabs: { id: 'all' | 'living' | 'dining' | 'bedroom' | 'office'; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'living', label: 'Phòng khách' },
    { id: 'dining', label: 'Phòng ăn' },
    { id: 'bedroom', label: 'Phòng ngủ' },
    { id: 'office', label: 'Phòng làm việc' }
  ];

  readonly galleryItems = signal<LookbookItem[]>([
    {
      id: 'lb-1',
      category: 'living',
      image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=600&auto=format&fit=crop',
      clientName: 'Anh Tuấn',
      location: 'Vinhomes Grand Park, Q.9',
      feedback: 'Sofa ngồi rất êm, gỗ sồi hoàn thiện tự nhiên vân gỗ rất đẹp. Dịch vụ giao hàng lắp đặt nhanh chóng.',
      rating: 5,
      productName: 'Chế sofa góc L hiện đại',
      productLink: '/san-pham'
    },
    {
      id: 'lb-2',
      category: 'dining',
      image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?q=80&w=600&auto=format&fit=crop',
      clientName: 'Chị Ngọc',
      location: 'Thảo Điền Pearl, Q.2',
      feedback: 'Bàn ăn walnut sang trọng, bề mặt sơn phủ mịn màng dễ lau chùi. Ai đến chơi cũng khen hết lời.',
      rating: 5,
      productName: 'Bàn ăn gỗ cao cấp',
      productLink: '/san-pham'
    },
    {
      id: 'lb-3',
      category: 'bedroom',
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=600&auto=format&fit=crop',
      clientName: 'Anh Khoa',
      location: 'Sunrise City, Q.7',
      feedback: 'Giường ngủ vô cùng chắc chắn, không hề bị rung lắc hay có tiếng động. Màu gỗ xoan đào rất ấm áp.',
      rating: 5,
      productName: 'Giường ngủ gỗ cao cấp',
      productLink: '/san-pham'
    },
    {
      id: 'lb-4',
      category: 'living',
      image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=600&auto=format&fit=crop',
      clientName: 'Chị Lan',
      location: 'Masteri Thảo Điền, Q.2',
      feedback: 'Kệ tivi thiết kế tối giản nhưng rất tinh tế, hộc kéo mở êm ái nhờ ray giảm chấn cao cấp.',
      rating: 5,
      productName: 'Kệ tivi gỗ sồi',
      productLink: '/san-pham'
    },
    {
      id: 'lb-5',
      category: 'office',
      image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=600&auto=format&fit=crop',
      clientName: 'Anh Minh',
      location: 'Estella Heights, Q.2',
      feedback: 'Bàn làm việc rộng rãi, chiều cao chuẩn nên ngồi rất thoải mái. Gỗ thông tự nhiên có mùi thơm nhẹ rất dễ chịu.',
      rating: 5,
      productName: 'Bàn làm việc gỗ thông',
      productLink: '/san-pham'
    },
    {
      id: 'lb-6',
      category: 'dining',
      image: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?q=80&w=600&auto=format&fit=crop',
      clientName: 'Gia đình chị Hạnh',
      location: 'Landmark 81, Bình Thạnh',
      feedback: 'Bộ tủ bếp kết hợp bàn đảo gỗ gõ đỏ đỉnh cao. Các đường nét soi huỳnh rất tinh xảo và sang trọng.',
      rating: 5,
      productName: 'Bộ tủ bếp gỗ cao cấp',
      productLink: '/san-pham'
    }
  ]);

  filteredItems() {
    const tab = this.activeTab();
    if (tab === 'all') return this.galleryItems();
    return this.galleryItems().filter((i) => i.category === tab);
  }

  openUploadModal(): void {
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submitPhoto(event: Event): void {
    event.preventDefault();
    if (!this.formName() || !this.formLocation() || !this.formProduct() || !this.formFeedback()) return;

    const newItem: LookbookItem = {
      id: `lb-custom-${Date.now()}`,
      category: this.formCategory(),
      image: this.formImage(),
      clientName: this.formName(),
      location: this.formLocation(),
      feedback: this.formFeedback(),
      rating: 5,
      productName: this.formProduct(),
      productLink: '/san-pham'
    };

    // Prepend to top of lookbook items list
    this.galleryItems.update((items) => [newItem, ...items]);

    // Reset form & close
    this.formName.set('');
    this.formLocation.set('');
    this.formProduct.set('');
    this.formFeedback.set('');
    this.formImage.set('https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600');
    this.closeModal();
  }
}
