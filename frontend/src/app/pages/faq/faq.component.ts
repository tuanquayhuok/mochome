import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="faq-page">
      <!-- Hero Header -->
      <section class="faq-hero" aria-labelledby="faq-title">
        <div class="hero-overlay"></div>
        <div class="container hero-content">
          <span class="hero-tag">HỖ TRỢ KHÁCH HÀNG</span>
          <h1 id="faq-title">Câu Hỏi Thường Gặp (FAQ)</h1>
          <p class="hero-sub">Tìm câu trả lời cho các thắc mắc về mua sắm, thanh toán, giao hàng và chính sách bảo hành tại Mộc Home.</p>
          
          <!-- Interactive Live Search -->
          <div class="search-box-wrap">
            <span class="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Nhập từ khóa tìm kiếm câu hỏi..." 
              (input)="onSearchChange($event)"
              [value]="searchQuery()"
            />
          </div>
        </div>
      </section>

      <div class="container faq-layout block">
        <!-- Sidebar Navigation -->
        <aside class="faq-sidebar">
          <div class="sidebar-sticky">
            <h3>Danh Mục Hỗ Trợ</h3>
            <nav class="category-nav">
              <button 
                type="button"
                [class.active]="selectedCategory() === 'all'"
                (click)="setCategory('all')"
              >
                <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
                Tất cả câu hỏi
              </button>
              <button 
                type="button"
                [class.active]="selectedCategory() === 'buying'"
                (click)="setCategory('buying')"
              >
                <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Hướng dẫn mua hàng
              </button>
              <button 
                type="button"
                [class.active]="selectedCategory() === 'delivery'"
                (click)="setCategory('delivery')"
              >
                <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13" rx="2" ry="2"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                Giao hàng & Lắp đặt
              </button>
              <button 
                type="button"
                [class.active]="selectedCategory() === 'payment'"
                (click)="setCategory('payment')"
              >
                <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Phương thức thanh toán
              </button>
              <button 
                type="button"
                [class.active]="selectedCategory() === 'warranty'"
                (click)="setCategory('warranty')"
              >
                <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Bảo hành & Đổi trả
              </button>
            </nav>
            
            <div class="support-card">
              <h4>Bạn cần hỗ trợ thêm?</h4>
              <p>Liên hệ hotline hoặc gửi tin nhắn cho bộ phận tư vấn để được giải đáp 24/7.</p>
              <a routerLink="/lien-he" class="btn-sidebar">GỬI YÊU CẦU HỖ TRỢ</a>
            </div>
          </div>
        </aside>

        <!-- FAQ Accordion List -->
        <section class="faq-content" aria-label="FAQ items list">
          @if (filteredFaqs().length === 0) {
            <div class="no-results">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <p>Không tìm thấy câu hỏi nào phù hợp với từ khóa của bạn.</p>
              <button type="button" class="btn-clear" (click)="clearSearch()">Xóa tìm kiếm</button>
            </div>
          } @else {
            <div class="accordion-group">
              @for (faq of filteredFaqs(); track faq.id) {
                <div class="accordion-item" [class.expanded]="expandedItems().has(faq.id)">
                  <button 
                    type="button"
                    class="accordion-trigger" 
                    (click)="toggleItem(faq.id)"
                    [attr.aria-expanded]="expandedItems().has(faq.id)"
                  >
                    <span class="faq-cat-badge">{{ getCategoryLabel(faq.category) }}</span>
                    <span class="faq-question">{{ faq.question }}</span>
                    <span class="faq-chevron" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </span>
                  </button>
                  <div class="accordion-panel">
                    <div class="panel-content" [innerHTML]="faq.answer"></div>
                  </div>
                </div>
              }
            </div>
          }
        </section>
      </div>

      <!-- Quick Contact Info -->
      <section class="faq-contact block block-gray">
        <div class="container text-center">
          <span class="section-tag">LIÊN HỆ TRỰC TIẾP</span>
          <h2>Kênh Hỗ Trợ Trực Tuyến</h2>
          <p class="section-desc">Nếu bạn không tìm thấy câu hỏi cần thiết, vui lòng liên hệ với chúng tôi qua các kênh dưới đây:</p>
          
          <div class="contact-channels">
            <div class="channel-card">
              <span class="channel-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
              <h3>Hotline 24/7</h3>
              <p class="channel-val">1900 1234</p>
              <p class="channel-note">Hỗ trợ miễn phí cước gọi</p>
            </div>
            <div class="channel-card">
              <span class="channel-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <h3>Email Hỗ Trợ</h3>
              <p class="channel-val">support&#64;mochome.com</p>
              <p class="channel-note">Phản hồi trong vòng 2 giờ</p>
            </div>
            <div class="channel-card">
              <span class="channel-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </span>
              <h3>Chat Trực Tuyến</h3>
              <p class="channel-val">Live Chat</p>
              <p class="channel-note">Nhấn biểu tượng chat ở góc màn hình</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .faq-page {
        background: #fff;
        color: #2c2520;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.25rem;
      }

      .block {
        padding: 5.5rem 0;
      }

      .block-gray {
        background: #fbf9f7;
      }

      .section-tag {
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.15em;
        color: #8c7161;
        display: block;
        margin-bottom: 0.75rem;
      }

      .faq-hero {
        position: relative;
        background: url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80') no-repeat center center/cover;
        padding: 6.5rem 0;
        text-align: center;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        background: rgba(44, 37, 32, 0.75);
      }

      .hero-content {
        position: relative;
        z-index: 2;
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .hero-tag {
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.2em;
        color: #dcd0c9;
        margin-bottom: 1rem;
      }

      .faq-hero h1 {
        font-size: clamp(1.75rem, 4vw, 2.75rem);
        font-weight: 800;
        color: #fff;
        letter-spacing: 0.08em;
        margin: 0 0 1rem;
      }

      .hero-sub {
        font-size: clamp(0.95rem, 2.5vw, 1.15rem);
        color: #eae1db;
        max-width: 600px;
        line-height: 1.6;
        margin: 0 0 2rem;
      }

      /* Search Box */
      .search-box-wrap {
        position: relative;
        width: 100%;
        max-width: 540px;
      }

      .search-icon {
        position: absolute;
        left: 1.25rem;
        top: 50%;
        transform: translateY(-50%);
        color: #a3978c;
        display: flex;
        align-items: center;
      }

      .search-icon svg {
        width: 20px;
        height: 20px;
      }

      .search-box-wrap input {
        width: 100%;
        height: 54px;
        padding: 0 1.5rem 0 3.25rem;
        border: 1.5px solid rgba(235, 220, 208, 0.2);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.95);
        color: #3e2a1e;
        font-size: 0.95rem;
        outline: none;
        box-shadow: 0 8px 32px rgba(44, 37, 32, 0.15);
        transition: all 0.3s ease;
      }

      .search-box-wrap input:focus {
        background: #ffffff;
        border-color: #8c7161;
        box-shadow: 0 8px 32px rgba(140, 113, 97, 0.25);
      }

      /* Layout */
      .faq-layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 3.5rem;
        align-items: start;
      }

      /* Sidebar Navigation */
      .faq-sidebar {
        position: relative;
      }

      .sidebar-sticky {
        position: sticky;
        top: 100px;
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .sidebar-sticky h3 {
        font-size: 1.15rem;
        font-weight: 800;
        margin: 0;
        color: #2c2520;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .category-nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .category-nav button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        text-align: left;
        padding: 0.85rem 1.25rem;
        border: 1px solid #eae6e2;
        border-radius: 8px;
        background: transparent;
        color: #5c5047;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .cat-icon {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        transition: stroke 0.2s ease;
      }

      .category-nav button:hover {
        background: #fbf9f7;
        border-color: #dcd0c9;
        color: #8c7161;
      }

      .category-nav button.active {
        background: #fbf9f7;
        border-color: #8c7161;
        color: #8c7161;
        box-shadow: 0 4px 10px rgba(140, 113, 97, 0.05);
      }

      .support-card {
        background: #fbf9f7;
        border: 1px solid #eae6e2;
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .support-card h4 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
        color: #2c2520;
      }

      .support-card p {
        margin: 0;
        font-size: 0.8125rem;
        color: #7a6e67;
        line-height: 1.5;
      }

      .btn-sidebar {
        display: block;
        text-align: center;
        padding: 0.75rem;
        background: #8c7161;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-decoration: none;
        border-radius: 6px;
        transition: background 0.2s;
        margin-top: 0.5rem;
      }

      .btn-sidebar:hover {
        background: #a38b7b;
      }

      /* FAQ Content */
      .faq-content {
        display: flex;
        flex-direction: column;
      }

      .accordion-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .accordion-item {
        border: 1px solid #eae6e2;
        border-radius: 10px;
        background: #ffffff;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .accordion-item:hover {
        border-color: #dcd0c9;
        box-shadow: 0 4px 15px rgba(0,0,0,0.02);
      }

      .accordion-item.expanded {
        border-color: #dcd0c9;
        box-shadow: 0 8px 25px rgba(140, 113, 97, 0.06);
      }

      .accordion-trigger {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 1.5rem;
        background: transparent;
        border: none;
        text-align: left;
        cursor: pointer;
        position: relative;
      }

      .faq-cat-badge {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: #f5efe9;
        color: #8c7161;
        padding: 0.35rem 0.65rem;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .faq-question {
        font-size: 1rem;
        font-weight: 700;
        color: #2c2520;
        flex-grow: 1;
        line-height: 1.4;
      }

      .faq-chevron {
        color: #a3978c;
        display: flex;
        align-items: center;
        transition: transform 0.3s ease;
      }

      .faq-chevron svg {
        width: 20px;
        height: 20px;
      }

      .accordion-item.expanded .faq-chevron {
        transform: rotate(180deg);
        color: #8c7161;
      }

      /* Panel smooth transition */
      .accordion-panel {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        background: #fdfdfd;
      }

      .accordion-item.expanded .accordion-panel {
        max-height: 500px;
      }

      .panel-content {
        padding: 0 1.5rem 1.5rem 1.5rem;
        border-top: 1px solid #faf8f6;
        color: #5c5047;
        font-size: 0.9375rem;
        line-height: 1.7;
      }

      .panel-content p {
        margin: 0 0 1rem;
      }

      .panel-content p:last-child {
        margin: 0;
      }

      .panel-content strong {
        color: #2c2520;
      }

      /* No Results */
      .no-results {
        text-align: center;
        padding: 4rem 2rem;
        border: 2px dashed #eae6e2;
        border-radius: 12px;
        color: #7a6e67;
      }

      .no-results svg {
        width: 48px;
        height: 48px;
        margin-bottom: 1.25rem;
        color: #c4b8ae;
      }

      .no-results p {
        font-size: 0.95rem;
        margin: 0 0 1.5rem;
      }

      .btn-clear {
        padding: 0.75rem 1.5rem;
        background: #fbf9f7;
        border: 1px solid #eae6e2;
        border-radius: 6px;
        color: #8c7161;
        font-size: 0.8125rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-clear:hover {
        background: #f5efe9;
        border-color: #dcd0c9;
      }

      /* Channels */
      .faq-contact h2 {
        font-size: clamp(1.75rem, 3.5vw, 2.25rem);
        font-weight: 800;
        margin: 0 0 1rem;
      }

      .section-desc {
        color: #7a6e67;
        line-height: 1.6;
        max-width: 600px;
        margin: 0 auto 3.5rem;
      }

      .contact-channels {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
      }

      .channel-card {
        background: #ffffff;
        border: 1px solid #eae6e2;
        border-radius: 12px;
        padding: 2.5rem 1.5rem;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.01);
      }

      .channel-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 54px;
        height: 54px;
        margin: 0 auto 1.5rem;
        background: #fbf9f7;
        border-radius: 50%;
        color: #8c7161;
      }
      .channel-icon svg {
        width: 24px;
        height: 24px;
      }

      .channel-card h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
        color: #2c2520;
      }

      .channel-val {
        font-size: 1.25rem;
        font-weight: 800;
        color: #8c7161;
        margin: 0 0 0.25rem;
      }

      .channel-note {
        font-size: 0.75rem;
        color: #a3978c;
        margin: 0;
      }

      /* Responsive */
      @media (max-width: 992px) {
        .faq-layout {
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }

        .sidebar-sticky {
          position: relative;
          top: 0;
        }

        .category-nav {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.5rem;
        }
      }

      @media (max-width: 768px) {
        .contact-channels {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .block {
          padding: 3.5rem 0;
        }
      }
    `
  ]
})
export class FaqComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly searchQuery = signal('');
  readonly selectedCategory = signal('all');
  readonly expandedItems = signal<Set<string>>(new Set());

  // FAQ data relating to buying & delivery
  private readonly faqs: FaqItem[] = [
    {
      id: 'buy-1',
      category: 'buying',
      question: 'Làm thế nào để tôi đặt mua hàng trực tuyến hoặc trực tiếp tại Mộc Home?',
      answer: '<p>Quý khách có thể mua sắm nội thất Mộc Home qua 2 hình thức tiện lợi sau:</p><ul><li><strong>Đặt hàng trực tuyến qua website:</strong> Duyệt danh mục sản phẩm, lựa chọn quy cách, màu sắc, thêm vào giỏ hàng và nhập thông tin giao nhận. Nhân viên tổng đài của Mộc Home sẽ gọi điện xác nhận đơn hàng trong vòng 15 phút.</li><li><strong>Mua hàng trực tiếp tại Showroom:</strong> Chúng tôi khuyến khích quý khách ghé thăm hệ thống showroom tại Hà Nội và TP.HCM để trực tiếp trải nghiệm chất lượng hoàn thiện của gỗ tự nhiên và độ đàn hồi của các mẫu sofa bọc da/nỉ cao cấp trước khi đặt mua.</li></ul>'
    },
    {
      id: 'buy-2',
      category: 'buying',
      question: 'Quy trình đặt hàng thiết kế may đo & sản xuất theo yêu cầu riêng như thế nào?',
      answer: '<p>Đối với các đơn hàng cần thiết kế riêng biệt hoặc điều chỉnh kích thước may đo cho phù hợp với không gian căn hộ, Mộc Home áp dụng quy trình chuẩn 4 bước:</p><ol><li><strong>Tiếp nhận & Tư vấn:</strong> Kiến trúc sư trao đổi ý tưởng, đo đạc kích thước hiện trạng thực tế.</li><li><strong>Phác thảo 3D:</strong> Mộc Home dựng phối cảnh 3D nội thất trong phòng để bạn dễ dàng hình dung (dịch vụ này hoàn toàn miễn phí).</li><li><strong>Duyệt bản vẽ kỹ thuật:</strong> Quý khách kiểm duyệt chi tiết cấu tạo cơ học, màu sơn và mẫu da/nỉ gỗ thực tế.</li><li><strong>Ký hợp đồng & Sản xuất:</strong> Tiến hành cọc và đưa đơn hàng vào lịch sản xuất tại xưởng sản xuất quy mô của Mộc Home.</li></ol>'
    },
    {
      id: 'buy-3',
      category: 'buying',
      question: 'Hệ thống Showroom thực tế của Mộc Home ở đâu?',
      answer: '<p>Để trải nghiệm trực tiếp chất lượng gỗ tự nhiên và kiểu dáng sản phẩm, quý khách có thể ghé qua hệ thống cửa hàng:</p><ul><li><strong>Showroom Hà Nội:</strong> Số 12 Khu đô thị mới Trung Hòa - Nhân Chính, Quận Cầu Giấy, Hà Nội. (Mở cửa từ 8:00 - 21:00 hàng ngày).</li><li><strong>Showroom TP. Hồ Chí Minh:</strong> Số 450 Đường Cộng Hòa, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh. (Mở cửa từ 8:30 - 21:30 hàng ngày).</li></ul>'
    },
    {
      id: 'del-1',
      category: 'delivery',
      question: 'Thời gian sản xuất và giao nhận sản phẩm mất bao lâu?',
      answer: '<p>Thời gian giao nhận được cam kết rõ ràng dựa trên dòng sản phẩm:</p><ul><li><strong>Đối với hàng có sẵn tại kho:</strong> Giao hàng và lắp đặt hoàn thiện ngay trong vòng 24 giờ tại khu vực Nội thành Hà Nội và TP.HCM.</li><li><strong>Đối với sản phẩm đặt may đo/sản xuất theo yêu cầu:</strong> Thời gian sản xuất hoàn thiện và kiểm định chất lượng tại xưởng dao động từ 7 - 12 ngày làm việc tùy thuộc vào độ phức tạp của bản thiết kế.</li><li><strong>Giao hàng liên tỉnh ngoài Hà Nội/TP.HCM:</strong> Thời gian vận chuyển đường dài mất từ 2 - 5 ngày tùy theo địa lý của tỉnh thành nhận hàng.</li></ul>'
    },
    {
      id: 'del-2',
      category: 'delivery',
      question: 'Chính sách tính phí vận chuyển và lắp đặt tại nhà cụ thể như thế nào?',
      answer: '<p>Chính sách vận chuyển của Mộc Home được thiết kế tối đa hóa lợi ích cho khách hàng:</p><ul><li><strong>Miễn phí vận chuyển & công lắp đặt 100%:</strong> Áp dụng cho mọi hóa đơn mua hàng có tổng trị giá trên 10.000.000đ nhận hàng tại địa bàn nội thành Hà Nội và TP.HCM.</li><li><strong>Hóa đơn dưới 10.000.000đ:</strong> Tính phí vận chuyển đồng giá ưu đãi là 150.000đ/chuyến (bao gồm cả nhân viên hỗ trợ mang lên chung cư và lắp ráp).</li><li><strong>Khách hàng ở tỉnh xa:</strong> Phí ship được tính tối ưu dựa trên số km thực tế từ showroom gần nhất hoặc gửi xe tải chuyên dụng giao nội thất của các đối tác liên kết với mức giá rẻ nhất thị trường.</li></ul>'
    },
    {
      id: 'del-3',
      category: 'delivery',
      question: 'Nếu nhà tôi ở chung cư cao tầng không có thang máy lớn, nhân viên có mang lên hộ không?',
      answer: '<p><strong>Hoàn toàn có.</strong> Nhân viên giao nhận kỹ thuật chuyên nghiệp của chúng tôi sẽ chịu trách nhiệm bốc dỡ và khiêng vác sản phẩm lên tận phòng cho quý khách.</p><p>Tuy nhiên, đối với các sản phẩm cồng kềnh (như bàn ăn nguyên tấm lớn, tủ quần áo liền khối, sofa chữ L cỡ đại) lắp đặt tại các nhà phố hẹp cầu thang hoặc chung cư có thang máy nhỏ, Mộc Home sẽ tiến hành tháo rời chi tiết linh kiện rồi mang lên phòng ráp lại. Trường hợp bắt buộc phải kéo dây cẩu qua ban công, chúng tôi sẽ khảo sát trước và thống nhất phương án hỗ trợ an toàn nhất với quý khách.</p>'
    },
    {
      id: 'del-4',
      category: 'delivery',
      question: 'Quy trình đóng gói vận chuyển đi tỉnh xa được bảo đảm như thế nào?',
      answer: '<p>Để đảm bảo nội thất gỗ không bị trầy xước hay nứt vỡ trong suốt hành trình vận chuyển liên tỉnh dài ngày, Mộc Home tuân thủ quy trình đóng gói nghiêm ngặt 5 lớp bảo vệ:</p><ul><li><strong>Lớp 1:</strong> Bọc màng PE chống ẩm mốc và bụi bẩn.</li><li><strong>Lớp 2:</strong> Quấn xốp bong bóng khí giảm chấn cường độ cao.</li><li><strong>Lớp 3:</strong> Ốp các tấm xốp cứng bảo vệ đặc biệt 4 góc cạnh dễ va đập.</li><li><strong>Lớp 4:</strong> Đóng thùng carton dày chịu lực.</li><li><strong>Lớp 5:</strong> Gia cố khung gỗ pallet bên ngoài (đặc biệt áp dụng đối với hàng chuyển đi miền Trung/miền Nam hoặc giao qua các công ty vận tải trung gian).</li></ul>'
    },
    {
      id: 'pay-1',
      category: 'payment',
      question: 'Mộc Home hỗ trợ những hình thức thanh toán an toàn nào?',
      answer: '<p>Chúng tôi chấp nhận đa dạng các phương thức thanh toán linh hoạt:</p><ul><li><strong>COD (Giao hàng thu tiền mặt tại nhà):</strong> Quý khách kiểm tra sản phẩm hoàn thiện vừa ý rồi mới thanh toán tiền mặt cho nhân viên giao hàng (Áp dụng đơn hàng dưới 20 triệu đồng).</li><li><strong>Chuyển khoản Ngân hàng tự động (VietQR):</strong> Quét mã QR code xuất hiện ở bước thanh toán để xác thực đơn hàng thành công tự động tức thì sau 5 giây.</li><li><strong>Cà thẻ tại nhà:</strong> Nhân viên của Mộc Home hỗ trợ mang theo máy POS di động để quý khách quẹt thẻ Visa/MasterCard/JCB hoặc thẻ ATM nội địa ngay tại nhà khi nhận hàng.</li></ul>'
    },
    {
      id: 'pay-2',
      category: 'payment',
      question: 'Chính sách đặt cọc áp dụng đối với các đơn hàng như thế nào?',
      answer: '<p>Để tối ưu hóa quy trình sản xuất và lịch bàn giao hàng:</p><ul><li><strong>Hàng có sẵn:</strong> Không yêu cầu đặt cọc trước. Quý khách thanh toán toàn bộ sau khi giao hàng và nghiệm thu lắp đặt tại nhà.</li><li><strong>Hàng đặt may đo sản xuất theo yêu cầu:</strong> Quý khách vui lòng thanh toán tạm ứng đặt cọc trước <strong>30% - 50%</strong> giá trị hợp đồng để xưởng chuẩn bị nguyên vật liệu gỗ và xếp lịch thi công. Số tiền còn lại sẽ thanh toán dứt điểm ngay sau khi hàng được bàn giao và lắp đặt hoàn tất.</li></ul>'
    },
    {
      id: 'pay-3',
      category: 'payment',
      question: 'Tôi muốn mua nội thất trả góp lãi suất 0% thì thủ tục thế nào?',
      answer: '<p>Mộc Home liên kết cùng các ngân hàng thương mại cung cấp chương trình trả góp lãi suất 0%:</p><ul><li><strong>Điều kiện:</strong> Sở hữu thẻ tín dụng (Credit Card) của 25 ngân hàng liên kết đối tác (như Vietcombank, Techcombank, HSBC, Sacombank, VPBank...).</li><li><strong>Thủ tục:</strong> Không cần chứng minh thu nhập hay làm hồ sơ giấy tờ phức tạp. Bạn chỉ cần chọn tùy chọn trả góp bằng thẻ tín dụng tại bước thanh toán trực tuyến hoặc quẹt thẻ trên máy POS tại showroom, chọn kỳ hạn trả góp linh hoạt (3 tháng, 6 tháng, 9 tháng, hoặc 12 tháng). Hàng tháng, số tiền trả góp sẽ tự động trừ vào sao kê thẻ của bạn.</li></ul>'
    },
    {
      id: 'war-1',
      category: 'warranty',
      question: 'Chính sách bảo hành gỗ tự nhiên và đệm mút sofa tại Mộc Home thế nào?',
      answer: '<p>Chính sách bảo hành vàng của Mộc Home bao gồm:</p><ul><li><strong>Bảo hành gỗ tự nhiên 5 năm:</strong> Cam kết đổi mới hoặc sửa chữa miễn phí đối với các hiện tượng nứt toác, cong vênh nghiêm trọng, co ngót bất thường do tác động thời tiết hoặc mối mọt ăn mòn tự nhiên phát sinh từ lõi gỗ.</li><li><strong>Bảo hành đệm mút & lò xo sofa 3 năm:</strong> Áp dụng đối với các trường hợp đệm mút bị xẹp lún không đàn hồi lại được, lò xo bị gãy hoặc phát ra tiếng kêu cọ sát khó chịu khi ngồi.</li><li><strong>Lưu ý miễn trừ trách nhiệm bảo hành:</strong> Mộc Home không bảo hành đối với các sản phẩm bị ngâm nước ngập sâu lâu ngày do thiên tai, đặt trực tiếp dưới ánh nắng mặt trời gắt chiếu liên tục làm nứt gỗ, tự ý phun hóa chất tẩy rửa mạnh lên bề mặt sơn PU cao cấp hoặc do ngoại lực va đập mạnh làm nứt gãy.</li></ul>'
    },
    {
      id: 'war-2',
      category: 'warranty',
      question: 'Tôi phát hiện sản phẩm bị trầy xước lúc nhân viên giao đến thì xử lý thế nào?',
      answer: '<p>Mộc Home cam kết quyền lợi đồng kiểm tuyệt đối:</p><p>Khi nhân viên bàn giao hàng, quý khách hãy kiểm tra kỹ lưỡng bề mặt gỗ, các đường chỉ khâu da nỉ và các khớp nối bản lề. Nếu phát hiện trầy xước mạnh, rách da nỉ hoặc nứt gỗ do quá trình vận chuyển:</p><ul><li>Quý khách có quyền ghi rõ tình trạng lỗi vào biên bản đồng kiểm và <strong>từ chối nhận hàng</strong> mà không phải thanh toán bất kỳ khoản phí phát sinh nào.</li><li>Nhân viên của chúng tôi sẽ mang hàng lỗi quay về xưởng. Mộc Home cam kết sẽ giao lại sản phẩm mới hoàn chỉnh cho bạn trong vòng 2 - 3 ngày làm việc đối với khu vực nội thành.</li></ul>'
    },
    {
      id: 'war-3',
      category: 'warranty',
      question: 'Quy trình yêu cầu bảo hành/bảo trì tận nhà diễn ra trong bao lâu?',
      answer: '<p>Khi phát sinh nhu cầu bảo hành hoặc bảo trì bảo dưỡng định kỳ:</p><ol><li>Quý khách vui lòng liên hệ hotline <strong>1900 1234</strong> hoặc gửi ảnh chụp/video quay cận cảnh vị trí lỗi về email <strong>support&#64;mochome.com</strong>.</li><li>Bộ phận kỹ thuật chăm sóc khách hàng của Mộc Home sẽ phản hồi xác nhận lỗi trong vòng 2 giờ làm việc.</li><li>Nhân viên kỹ thuật sẽ di chuyển đến tận nhà của bạn trong vòng 24 giờ (đối với nội thành Hà Nội & TP.HCM) và 48 giờ (ở các tỉnh lân cận) để tiến hành xử lý khắc phục lỗi ngay tại chỗ hoặc mang linh kiện lỗi về xưởng xử lý nếu lỗi phức tạp.</li></ol>'
    }
  ];

  // Filtered FAQs computed signal
  readonly filteredFaqs = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    
    return this.faqs.filter(faq => {
      const matchCat = cat === 'all' || faq.category === cat;
      const matchQuery = !query || 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  });

  constructor() {
    this.title.setTitle('Trung tâm trợ giúp & Câu hỏi thường gặp FAQ — Mộc Home');
    this.meta.updateTag({ name: 'description', content: 'Giải đáp nhanh các câu hỏi thường gặp về quy trình mua hàng, các hình thức thanh toán trực tuyến, chính sách lắp đặt tại nhà và bảo hành nội thất uy tín tại Mộc Home.' });
  }

  onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  setCategory(cat: string): void {
    this.selectedCategory.set(cat);
    this.expandedItems.set(new Set()); // Reset expanded items when switching categories
  }

  toggleItem(id: string): void {
    const current = new Set(this.expandedItems());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.expandedItems.set(current);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  getCategoryLabel(cat: string): string {
    switch (cat) {
      case 'buying': return 'Mua hàng';
      case 'delivery': return 'Giao hàng';
      case 'payment': return 'Thanh toán';
      case 'warranty': return 'Bảo hành';
      default: return 'Khác';
    }
  }
}
