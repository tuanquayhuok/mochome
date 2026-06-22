import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="about-page">
      <section class="hero">
        <div class="container">
          <h1>Về Mộc Home</h1>
          <p class="subtitle">Thiết kế & sản xuất nội thất tinh tế — mang hơi ấm thiên nhiên vào từng không gian sống.</p>
        </div>
      </section>

      <section class="container intro">
        <div class="grid">
          <div class="card story">
            <h2>Hành trình của chúng tôi</h2>
            <p>Ra đời từ niềm đam mê đồ gỗ và thiết kế, Mộc Home chuyên tạo ra những sản phẩm nội thất thủ công, bền bỉ và hài hòa với phong cách sống hiện đại.</p>
            <p>Chúng tôi bắt đầu từ một xưởng nhỏ, phát triển qua các giai đoạn: thiết kế thử nghiệm, mở rộng xưởng sản xuất, và hiện tại cung cấp giải pháp trọn gói từ tư vấn, thiết kế, sản xuất tới lắp đặt.</p>
            <h4>Cột mốc tiêu biểu</h4>
            <ul>
              <li>2014 — Thành lập xưởng, tập trung đồ gỗ nội thất theo đơn đặt hàng.</li>
              <li>2017 — Mở rộng đội ngũ thiết kế, ra mắt dòng sản phẩm tiêu chuẩn.</li>
              <li>2020 — Hoàn thiện quy trình sản xuất, tăng năng lực xưởng và nhận dự án lớn cho doanh nghiệp.</li>
              <li>2023 — Triển khai dịch vụ tư vấn không gian và tối ưu vật liệu thân thiện môi trường.</li>
            </ul>
            <p>Chúng tôi luôn đặt khách hàng làm trọng tâm: mỗi sản phẩm đều trải qua kiểm định chất lượng và bảo hành sau bán hàng để đảm bảo sự hài lòng dài hạn.</p>
          </div>

          <aside class="card stats" aria-label="Thống kê công ty">
            <ul>
              <li><strong>10+</strong><span>Năm kinh nghiệm</span></li>
              <li><strong>2k+</strong><span>Khách hàng hài lòng</span></li>
              <li><strong>500+</strong><span>Dự án hoàn thành</span></li>
            </ul>
            <p class="muted" style="margin-top:12px;">Xưởng sản xuất đạt chuẩn an toàn lao động, vật liệu nguồn gốc rõ ràng, cam kết sử dụng gỗ hợp pháp.</p>
          </aside>
        </div>
      </section>

      <section class="container values">
        <h2 class="section-title">Giá trị cốt lõi</h2>
        <div class="grid-3">
          <div class="value card">
            <h3>Chất lượng</h3>
            <p>Chúng tôi chỉ sử dụng vật liệu được kiểm định, ưu tiên vật liệu tự nhiên, xử lý chống mối mọt và sấy đạt chuẩn để tăng độ bền.</p>
            <ul>
              <li>Kiểm tra đầu vào nguyên liệu.</li>
              <li>Quy trình sản xuất theo tiêu chuẩn kỹ thuật.</li>
              <li>Bảo hành và hậu mãi rõ ràng.</li>
            </ul>
          </div>
          <div class="value card">
            <h3>Thiết kế</h3>
            <p>Thiết kế phù hợp sở thích và công năng — từ phong cách tối giản đến thiết kế truyền thống, tối ưu diện tích và thẩm mỹ.</p>
            <ul>
              <li>Tư vấn mặt bằng miễn phí.</li>
              <li>Bản vẽ 2D/3D trước sản xuất.</li>
              <li>Tuỳ chỉnh kích thước, màu sắc, chất liệu.</li>
            </ul>
          </div>
          <div class="value card">
            <h3>Dịch vụ</h3>
            <p>Cam kết phục vụ tận tâm: tư vấn, lắp đặt, bảo trì và hỗ trợ khách hàng trong suốt vòng đời sản phẩm.</p>
            <ul>
              <li>Lắp đặt chuyên nghiệp, đúng tiến độ.</li>
              <li>Chính sách đổi trả và bảo hành rõ ràng.</li>
              <li>Tư vấn lựa chọn vật liệu phù hợp ngân sách.</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="container team">
        <h2 class="section-title">Đội ngũ</h2>
        <p class="muted">Một tập thể sáng tạo, am hiểu vật liệu và tỉ mỉ trong từng chi tiết.</p>
        <div class="team-grid">
          <div class="member card">
            <div class="member-top"><img class="avatar" src="https://ui-avatars.com/api/?name=Nguy%E1%BB%85n+Di%E1%BB%8Eu+H%C3%A2n&background=4f46e5&color=fff&size=128" alt="Nguyễn Diệu Hân" /></div>
            <h4>Nguyễn Diệu Hân</h4>
            <p class="role">Team Leader</p>
            <p class="bio muted">Lãnh đạo dự án, điều phối thiết kế và đảm bảo tiến độ thực thi.</p>
          </div>
          <div class="member card">
            <div class="member-top"><img class="avatar" src="https://ui-avatars.com/api/?name=Nguy%E1%BB%85n+H%E1%BB%93ng+Ng%E1%BB%8Dc+B%C3%ADch&background=4f46e5&color=fff&size=128" alt="Nguyễn Hồng Ngọc Bích" /></div>
            <h4>Nguyễn Hồng Ngọc Bích</h4>
            <p class="role">Lead Designer</p>
            <p class="bio muted">Chuyên viên thiết kế nội thất, tập trung vào thẩm mỹ và trải nghiệm người dùng.</p>
          </div>
          <div class="member card">
            <div class="member-top"><img class="avatar" src="https://ui-avatars.com/api/?name=Tr%E1%BA%A7n+Anh+Khoa&background=4f46e5&color=fff&size=128" alt="Trần Anh Khoa" /></div>
            <h4>Trần Anh Khoa</h4>
            <p class="role">Project Manager</p>
            <p class="bio muted">Quản lý dự án, giám sát thi công và liên lạc với khách hàng trong suốt tiến trình.</p>
          </div>
          <div class="member card">
            <div class="member-top"><img class="avatar" src="https://ui-avatars.com/api/?name=Qu%E1%BA%A3ng+Tr%E1%BB%97ng+Tu%E1%BA%A7n&background=4f46e5&color=fff&size=128" alt="Quảng Trọng Tuấn" /></div>
            <h4>Quảng Trọng Tuấn</h4>
            <p class="role">Production Lead</p>
            <p class="bio muted">Phụ trách xưởng sản xuất, đảm bảo tiêu chuẩn gia công và chất lượng sản phẩm.</p>
          </div>
        </div>
      </section>

      
    </main>
  `,
  styles: [
    `
      :host { --primary:#5c4033; --muted:#6b7280; --card:#fff; }
      .hero { display:flex; align-items:center; justify-content:center; padding:clamp(2rem,6vw,3rem) 1rem; background:linear-gradient(180deg,#faf5f2,#fff); text-align:center; min-height:min(70vh, 520px); }
      .hero .container { max-width:980px; margin:0 auto; padding:0 1.25rem; }
      .hero h1 { margin:0; font-size:clamp(1.5rem,5vw,2rem); font-weight:800; color:#1a1d21; }
      .hero .subtitle { color:var(--muted); margin-top:8px; font-size:clamp(0.875rem,2.5vw,1rem); max-width:42ch; margin-left:auto; margin-right:auto; }

      .container { max-width:1200px; margin:0 auto; padding:1.5rem 1.25rem 2.5rem; }
      .grid { display:grid; grid-template-columns: 1fr 300px; gap:1.25rem; align-items:start; }
      .card { background:var(--card); border-radius:8px; padding:1.15rem; box-shadow:0 1px 2px rgba(16,24,40,0.04); border:1px solid #e5e7eb; }

      .stats ul { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; }
      .stats li { display:flex; flex-direction:column; }
      .stats strong { font-size:20px; color:#0f172a; }
      .stats span { color:var(--muted); }

      .section-title { font-size:clamp(1.125rem,3vw,1.25rem); margin:0 0 0.5rem; }
      .values .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:1.15rem; margin-top:14px; }
      .value h3 { margin:0 0 8px; }

      .team { text-align:center; }
      .team-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:1.15rem; margin-top:16px; }
      .member-top { display:flex; justify-content:center; }
      .avatar { width:96px; height:96px; border-radius:50%; object-fit:cover; border:4px solid rgba(79,70,229,0.08); }
      .member h4 { margin:10px 0 4px; text-align:center; }
      .role { color:var(--muted); font-size:13px; text-align:center; }
      .bio { font-size:13px; text-align:center; margin-top:8px; }

      .cta { margin:28px 0; }
      .cta-card { display:flex; flex-direction:column; gap:12px; align-items:flex-start; }
      .cta-actions { display:flex; gap:12px; }
      .btn { padding:10px 16px; border-radius:8px; font-weight:700; text-decoration:none; display:inline-block; }
      .btn.primary { background:var(--primary); color:#fff; }
      .btn.outline { border:1px solid rgba(15,23,42,0.06); color:var(--primary); background:transparent; }

      @media (max-width:1024px) { .grid { grid-template-columns:1fr; } .values .grid-3 { grid-template-columns:1fr; } }
      @media (max-width:640px) { .container { padding:1rem; } .avatar { width:80px; height:80px; } }
    `
  ]
})
export class AboutComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('Giới thiệu — Mộc Home');
    this.meta.updateTag({ name: 'description', content: 'Mộc Home – chuyên thiết kế và sản xuất nội thất thủ công, mang đến giải pháp không gian ấm áp và bền đẹp.' });

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Mộc Home',
      'url': window.location.origin,
      'logo': window.location.origin + '/assets/logo.png',
      'sameAs': [
        'https://www.facebook.com/yourpage',
        'https://www.instagram.com/yourprofile'
      ],
      'contactPoint': [{ '@type': 'ContactPoint', 'telephone': '19001234', 'contactType': 'customer service' }]
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.text = JSON.stringify(jsonLd);
    document.head.appendChild(s);
  }
}

