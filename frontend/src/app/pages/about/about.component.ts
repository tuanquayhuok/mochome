import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="about-page">
      <!-- Premium Hero Section -->
      <section class="about-hero" aria-labelledby="about-title">
        <div class="hero-overlay"></div>
        <div class="container hero-content">
          <span class="hero-tag">THƯƠNG HIỆU NỘI THẤT MỘC HOME</span>
          <h1 id="about-title">KIẾN TẠO KHÔNG GIAN SỐNG</h1>
          <p class="hero-sub">Thiết kế & sản xuất nội thất thủ công tinh tế - mang hơi ấm tự nhiên vào ngôi nhà bạn.</p>
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a routerLink="/">Trang chủ</a>
            <span class="sep">/</span>
            <span class="current">Giới thiệu</span>
          </nav>
        </div>
      </section>

      <!-- Brand Story Section -->
      <section class="brand-story block">
        <div class="container grid-2">
          <div class="story-content">
            <span class="section-tag">CÂU CHUYỆN CỦA CHÚNG TÔI</span>
            <h2>Hành Trình Gìn Giữ Hơi Ấm Thiên Nhiên</h2>
            <p class="lead">Ra đời từ tình yêu vô hạn với những vân gỗ tự nhiên và nét đẹp trường tồn của đồ gỗ nội thất thủ công.</p>
            <p>Mộc Home không chỉ tạo ra những bộ bàn ghế hay chiếc tủ gỗ đơn thuần, chúng tôi kiến tạo những tác phẩm nghệ thuật hiện đại nâng niu từng khoảnh khắc gia đình quây quần.</p>
            <p>Từ một xưởng mộc truyền thống nhỏ lẻ, Mộc Home đã không ngừng cải tiến công nghệ, chuẩn hóa quy trình xử lý nguyên liệu để trở thành đơn vị thiết kế và thi công nội thất gỗ trọn gói uy tín hàng đầu hiện nay.</p>
            
            <div class="stats-grid">
              <div class="stat-card">
                <span class="num">10+</span>
                <span class="lbl">Năm phát triển</span>
              </div>
              <div class="stat-card">
                <span class="num">2,500+</span>
                <span class="lbl">Khách hàng tin tưởng</span>
              </div>
              <div class="stat-card">
                <span class="num">600+</span>
                <span class="lbl">Dự án hoàn thành</span>
              </div>
            </div>
          </div>
          <div class="story-image">
            <img src="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=900&q=80" alt="Quy trình hoàn thiện gỗ tại Mộc Home" />
            <div class="image-accent"></div>
          </div>
        </div>
      </section>

      <!-- Production Process Section -->
      <section class="production-process block block-gray">
        <div class="container">
          <div class="block-head text-center">
            <span class="section-tag">TIÊU CHUẨN GIA CÔNG</span>
            <h2>Quy Trình Sản Xuất Nghiêm Ngặt</h2>
            <p class="section-desc">Để có được một sản phẩm nội thất bền bỉ qua nhiều thế hệ, mọi công đoạn tại xưởng của Mộc Home đều tuân thủ các tiêu chí khắt khe.</p>
          </div>

          <div class="process-timeline">
            <div class="process-step">
              <div class="step-num">01</div>
              <h3>Tuyển Chọn Gỗ</h3>
              <p>Chỉ sử dụng gỗ tự nhiên nhập khẩu có nguồn gốc rõ ràng (gỗ sồi, óc chó, gõ đỏ...) có độ tuổi đạt chuẩn và vân gỗ đẹp nhất.</p>
            </div>
            <div class="process-step">
              <div class="step-num">02</div>
              <h3>Sấy Khô Đạt Chuẩn</h3>
              <p>Gỗ được sấy lò với độ ẩm duy trì ở mức 8-12%, triệt tiêu hoàn toàn nguy cơ cong vênh, co ngót và mối mọt khi đưa vào sử dụng.</p>
            </div>
            <div class="process-step">
              <div class="step-num">03</div>
              <h3>Gia Công Tinh Xảo</h3>
              <p>Mỗi góc cạnh, mộng nối gỗ đều được chế tác tỉ mỉ bởi thợ mộc lành nghề có trên 15 năm kinh nghiệm sản xuất đồ mỹ nghệ.</p>
            </div>
            <div class="process-step">
              <div class="step-num">04</div>
              <h3>Sơn Phủ An Toàn</h3>
              <p>Sử dụng sơn phủ gốc nước cao cấp không mùi, đạt tiêu chuẩn quốc tế giúp bảo vệ mặt gỗ tối đa mà vẫn an toàn sức khỏe.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Core Values Section -->
      <section class="core-values block">
        <div class="container">
          <div class="block-head text-center">
            <span class="section-tag">GIÁ TRỊ CỐT LÕI</span>
            <h2>Chúng Tôi Tạo Nên Sự Khác Biệt</h2>
          </div>

          <div class="grid-3">
            <div class="value-card">
              <div class="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Cam Kết Chất Lượng</h3>
              <p>Chúng tôi tự hào áp dụng chính sách bảo hành dài hạn lên tới 5 năm cho các sản phẩm gỗ tự nhiên, khẳng định độ bền vượt trội.</p>
            </div>

            <div class="value-card">
              <div class="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3>Độc Bản & Tinh Tế</h3>
              <p>Không sản xuất đại trà. Mỗi thiết kế đều mang dấu ấn riêng biệt, được may đo tùy chỉnh hoàn hảo theo từng không gian sống.</p>
            </div>

            <div class="value-card">
              <div class="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h3>Tận Tâm Phục Vụ</h3>
              <p>Từ khâu tư vấn thiết kế 3D miễn phí cho đến quy trình vận chuyển lắp đặt tận nhà chuyên nghiệp, chu đáo.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Elite Team Section -->
      <section class="about-team block block-gray">
        <div class="container">
          <div class="block-head text-center">
            <span class="section-tag">ĐỘI NGŨ CỦA MỘC HOME</span>
            <h2>Người Bạn Đồng Hành Sáng Tạo</h2>
            <p class="section-desc">Chúng tôi tự hào sở hữu những nhà thiết kế kiến trúc nhiệt huyết và nghệ nhân lành nghề chung tay xây dựng tổ ấm của bạn.</p>
          </div>

          <div class="team-grid">
            <div class="member-card">
              <div class="member-img-wrap">
                <img src="https://ui-avatars.com/api/?name=Nguy%E1%BB%85n+Di%E1%BB%8Eu+H%C3%A2n&background=8c7161&color=fff&size=160" alt="Nguyễn Diệu Hân" />
              </div>
              <h4>Nguyễn Diệu Hân</h4>
              <span class="member-role">Team Leader & Architect</span>
              <p class="member-bio">Người chịu trách nhiệm điều phối dự án và định hình phong cách không gian tổng thể.</p>
            </div>

            <div class="member-card">
              <div class="member-img-wrap">
                <img src="https://ui-avatars.com/api/?name=Nguy%E1%BB%85n+H%E1%BB%93ng+Ng%E1%BB%8Dc+B%C3%ADch&background=8c7161&color=fff&size=160" alt="Nguyễn Hồng Ngọc Bích" />
              </div>
              <h4>Nguyễn Hồng Ngọc Bích</h4>
              <span class="member-role">Lead Interior Designer</span>
              <p class="member-bio">Chuyên gia thổi hồn nghệ thuật hiện đại, tạo nên bản vẽ chi tiết thẩm mỹ ấn tượng.</p>
            </div>

            <div class="member-card">
              <div class="member-img-wrap">
                <img src="https://ui-avatars.com/api/?name=Qu%E1%BA%A3ng+Tr%E1%BB%97ng+Tu%E1%BA%A7n&background=8c7161&color=fff&size=160" alt="Quảng Trọng Tuấn" />
              </div>
              <h4>Quảng Trọng Tuấn</h4>
              <span class="member-role">Production Director</span>
              <p class="member-bio">Trưởng bộ phận kỹ thuật xưởng, giám sát kỹ nghệ mộng mộc và chất lượng sơn phủ.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Call to Action -->
      <section class="about-cta">
        <div class="container text-center">
          <h2>Bạn Muốn Sở Hữu Không Gian Mơ Ước?</h2>
          <p>Hãy liên hệ với các kiến trúc sư của chúng tôi để được tư vấn thiết kế 3D hoàn toàn miễn phí.</p>
          <a routerLink="/lien-he" class="btn-primary">LIÊN HỆ TƯ VẤN NGAY</a>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .about-page {
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

      .block-head h2 {
        font-size: clamp(1.75rem, 3.5vw, 2.25rem);
        font-weight: 800;
        color: #2c2520;
        margin: 0 0 1rem;
        letter-spacing: 0.02em;
      }

      .block-head.text-center {
        text-align: center;
        max-width: 700px;
        margin: 0 auto 3.5rem;
      }

      .section-desc {
        color: #7a6e67;
        line-height: 1.6;
        font-size: 1rem;
      }

      .grid-2 {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 4rem;
        align-items: center;
      }

      .grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
      }

      /* Hero Section */
      .about-hero {
        position: relative;
        background: url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80') no-repeat center center/cover;
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

      .about-hero h1 {
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

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
      }

      .breadcrumb a {
        color: #dcd0c9;
        text-decoration: none;
        transition: color 0.2s;
      }

      .breadcrumb a:hover {
        color: #fff;
      }

      .breadcrumb .sep {
        color: rgba(220, 208, 201, 0.4);
      }

      .breadcrumb .current {
        color: #fff;
      }

      /* Story Section */
      .story-content h2 {
        font-size: clamp(1.75rem, 3vw, 2.25rem);
        font-weight: 800;
        margin: 0 0 1.25rem;
        line-height: 1.25;
      }

      .story-content p {
        color: #5c5047;
        line-height: 1.7;
        font-size: 0.95rem;
        margin-bottom: 1.25rem;
      }

      .story-content .lead {
        font-size: 1.1rem;
        font-weight: 600;
        color: #4a3e35;
        line-height: 1.5;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        margin-top: 2rem;
      }

      .stat-card {
        border-left: 2px solid #8c7161;
        padding-left: 1rem;
      }

      .stat-card .num {
        font-size: 1.75rem;
        font-weight: 800;
        color: #8c7161;
        display: block;
        line-height: 1.1;
      }

      .stat-card .lbl {
        font-size: 0.8125rem;
        color: #7a6e67;
        font-weight: 500;
      }

      .story-image {
        position: relative;
      }

      .story-image img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        display: block;
        box-shadow: 0 15px 35px rgba(0,0,0,0.06);
      }

      .image-accent {
        position: absolute;
        z-index: -1;
        width: 80%;
        height: 80%;
        border: 2px solid #8c7161;
        bottom: -15px;
        right: -15px;
        border-radius: 8px;
      }

      /* Process Timeline */
      .process-timeline {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2rem;
        position: relative;
        margin-top: 1rem;
      }

      .process-step {
        position: relative;
        background: #fff;
        padding: 2rem 1.5rem;
        border-radius: 8px;
        border: 1px solid #eae6e2;
        box-shadow: 0 4px 15px rgba(0,0,0,0.02);
      }

      .step-num {
        font-size: 2.25rem;
        font-weight: 800;
        color: rgba(140, 113, 97, 0.15);
        margin-bottom: 0.5rem;
      }

      .process-step h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0 0 0.75rem;
        color: #2c2520;
      }

      .process-step p {
        font-size: 0.875rem;
        color: #7a6e67;
        line-height: 1.6;
        margin: 0;
      }

      /* Value Cards */
      .value-card {
        background: #fff;
        padding: 2.5rem 2rem;
        border-radius: 8px;
        border: 1px solid #eae6e2;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }

      .value-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(140, 113, 97, 0.08);
      }

      .value-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fbf9f7;
        border-radius: 50%;
        color: #8c7161;
        margin-bottom: 1.5rem;
      }

      .value-icon svg {
        width: 24px;
        height: 24px;
      }

      .value-card h3 {
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0 0 1rem;
      }

      .value-card p {
        font-size: 0.9rem;
        color: #7a6e67;
        line-height: 1.6;
        margin: 0;
      }

      /* Team Section */
      .team-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2.5rem;
      }

      .member-card {
        background: #fff;
        border-radius: 8px;
        border: 1px solid #eae6e2;
        padding: 2rem 1.5rem;
        text-align: center;
        transition: box-shadow 0.3s ease;
      }

      .member-card:hover {
        box-shadow: 0 15px 30px rgba(0,0,0,0.03);
      }

      .member-img-wrap {
        width: 110px;
        height: 110px;
        margin: 0 auto 1.25rem;
        border-radius: 50%;
        overflow: hidden;
        border: 4px solid #f2ece8;
      }

      .member-img-wrap img {
        width: 100%;
        height: auto;
        display: block;
      }

      .member-card h4 {
        font-size: 1.15rem;
        font-weight: 700;
        margin: 0 0 0.25rem;
      }

      .member-role {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #8c7161;
        display: block;
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .member-bio {
        font-size: 0.875rem;
        color: #7a6e67;
        line-height: 1.5;
        margin: 0;
      }

      /* CTA Section */
      .about-cta {
        background: linear-gradient(135deg, #2c2520 0%, #4a3e35 100%);
        color: #fff;
        padding: 5rem 0;
      }

      .about-cta h2 {
        font-size: clamp(1.5rem, 3.5vw, 2.25rem);
        font-weight: 800;
        margin: 0 0 1rem;
        letter-spacing: 0.02em;
      }

      .about-cta p {
        font-size: 1.05rem;
        color: #dcd0c9;
        margin: 0 0 2.25rem;
      }

      .btn-primary {
        display: inline-block;
        padding: 0.95rem 2.25rem;
        background: #8c7161;
        color: #fff;
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-decoration: none;
        border-radius: 6px;
        transition: background 0.2s, transform 0.2s;
        border: none;
        cursor: pointer;
      }

      .btn-primary:hover {
        background: #a38b7b;
        transform: translateY(-2px);
      }

      /* Responsive Layouts */
      @media (max-width: 1024px) {
        .grid-2 {
          grid-template-columns: 1fr;
          gap: 3rem;
        }
        .story-image {
          max-width: 600px;
          margin: 0 auto;
        }
        .process-timeline {
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
      }

      @media (max-width: 768px) {
        .grid-3, .team-grid {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        .process-timeline {
          grid-template-columns: 1fr;
        }
        .block {
          padding: 3.5rem 0;
        }
      }
    `
  ]
})
export class AboutComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('Giới thiệu — Mộc Home');
    this.meta.updateTag({ name: 'description', content: 'Mộc Home – chuyên thiết kế và sản xuất nội thất thủ công, mang đến giải pháp không gian ấm áp và bền đẹp.' });
  }
}
