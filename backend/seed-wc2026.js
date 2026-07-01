const mongoose = require('mongoose');
const Post = require('./src/models/Post');
const Voucher = require('./src/models/Voucher');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/furniture_admin';

const SAMPLE_POSTS = [
  {
    title: 'Hành trình chinh phục World Cup 2026 và Xu hướng thiết kế phòng bóng đá tại gia',
    slug: 'chinh-phuc-world-cup-2026-va-thiet-ke-phong-bong-da',
    excerpt: 'Khám phá không khí cuồng nhiệt World Cup 2026 cùng cẩm nang thiết kế phòng giải trí đỉnh cao để xem bóng đá cùng bạn bè.',
    content: `
      <p>World Cup 2026 đang đến rất gần! Đây là sự kiện thể thao lớn nhất hành tinh được đồng tổ chức tại 3 quốc gia lớn Mỹ, Canada và Mexico. Sức nóng của giải đấu bóng đá đỉnh cao này không chỉ diễn ra trên sân cỏ mà còn đang len lỏi vào từng không gian sống của mỗi gia đình Việt Nam.</p>
      
      <p>Để tận hưởng trọn vẹn những pha làm bàn ngoạn mục của các siêu sao thế giới, việc chuẩn bị một không gian xem bóng đá lý tưởng tại nhà là vô cùng cần thiết. Mộc Home xin gợi ý cho bạn những giải pháp tối ưu màu sắc và sắp xếp nội thất cực chất cho mùa World Cup 2026 này.</p>
      
      <h3>1. Chọn Sofa Đủ Rộng Rãi Cho Cả Gia Đình</h3>
      <p>Khi xem những trận cầu kịch tính kéo dài 90 phút hoặc thậm chí hiệp phụ và luân lưu, một chiếc sofa thoải mái là ưu tiên số một. Bộ sưu tập sofa góc L chất liệu nỉ cao cấp hoặc sofa gỗ tự nhiên bọc đệm êm ái từ Mộc Home sẽ giúp bạn và những người thân yêu thỏa sức ngồi, nằm cổ vũ thoải mái mà không lo đau lưng.</p>
      
      <!-- VOUCHER_PLACEHOLDER -->
      
      <h3>2. Hệ Thống Kệ Tivi Và Âm Thanh Sống Động</h3>
      <p>Một màn hình lớn sắc nét cần được đặt trên một chiếc kệ tivi gỗ tự nhiên vững chãi, phối hợp hài hòa với hệ thống loa soundbar xung quanh để tái hiện chân thực nhất tiếng reo hò cuồng nhiệt trên khán đài World Cup 2026.</p>
      
      <p>Chúc bạn có một mùa bóng đá bùng nổ cùng những sản phẩm nội thất đẳng cấp từ Mộc Home!</p>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    published: true,
    isVisible: true
  },
  {
    title: 'World Cup 2026: Ý tưởng Setup Góc Xem Bóng Đá Cực Chất Tiết Kiệm Không Gian',
    slug: 'setup-goc-xem-bong-da-world-cup-2026-tiet-kiem-khong-gian',
    excerpt: 'Bạn sở hữu căn hộ nhỏ nhưng vẫn muốn có góc tụ tập xem bóng đá World Cup 2026 siêu ngầu? Hãy tham khảo ngay bài viết này.',
    content: `
      <p>Căn hộ chung cư nhỏ hay phòng khách hẹp có cản trở niềm đam mê bóng đá World Cup 2026 của bạn? Hoàn toàn không, nếu bạn biết cách bố trí nội thất thông minh đa năng.</p>
      
      <p>Trong bài viết này, Mộc Home sẽ bật mí cách chọn lựa bàn trà thông minh kết hợp lưu trữ nước uống, ghế đôn di động xếp gọn và kệ tivi treo tường giúp giải phóng không gian tối đa để sẵn sàng chào đón World Cup 2026.</p>
      
      <h3>Giải pháp 1: Sử Dụng Ghế Đôn Di Động</h3>
      <p>Thay vì những bộ ghế cồng kềnh chiếm diện tích, ghế đôn nhỏ gọn bọc nỉ mịn màng là lựa chọn lý tưởng. Bạn có thể xếp gọn dưới gầm bàn hoặc góc tường khi không dùng đến, và lôi ra dễ dàng khi bạn bè đến xem bóng đá chung.</p>
      
      <!-- VOUCHER_PLACEHOLDER -->
      
      <h3>Giải pháp 2: Bàn Trà Tích Hợp Tiện Ích</h3>
      <p>Bàn trà mặt đá sang trọng kết hợp các ngăn kéo kín đáo giúp bạn chứa sẵn đồ ăn nhẹ, bia, nước ngọt vô cùng tiện lợi mà vẫn giữ được sự ngăn nắp, tinh tế cho phòng khách.</p>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1540747737956-37872404a8cc?auto=format&fit=crop&w=1200&q=80',
    published: true,
    isVisible: true
  }
];

const SAMPLE_VOUCHERS = [
  {
    code: 'WC2026SOFA',
    name: 'Voucher World Cup 2026 - Giảm giá Sofa',
    description: 'Giảm ngay 500.000đ khi đặt mua các dòng sản phẩm Sofa gỗ tự nhiên bọc đệm chào mừng giải đấu bóng đá World Cup 2026.',
    discountType: 'fixed',
    discountValue: 500000,
    minOrderAmount: 5000000,
    maxDiscountAmount: 5000000,
    usageLimit: 100,
    usedCount: 0,
    isActive: true,
    showInStorePicker: true
  },
  {
    code: 'WC2026DECOR',
    name: 'Mã Giảm Giá Phụ Kiện Decor Bóng Đá',
    description: 'Giảm 10% tối đa 200.000đ cho đơn hàng mua các phụ kiện trang trí phòng khách xem World Cup.',
    discountType: 'percent',
    discountValue: 10,
    minOrderAmount: 1000000,
    maxDiscountAmount: 200000,
    usageLimit: 200,
    usedCount: 0,
    isActive: true,
    showInStorePicker: true
  }
];

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Database connected.');

  // Delete existing demo posts / vouchers if matching slugs/codes
  for (const post of SAMPLE_POSTS) {
    await Post.deleteOne({ slug: post.slug });
  }
  for (const v of SAMPLE_VOUCHERS) {
    await Voucher.deleteOne({ code: v.code });
  }

  // Create Vouchers
  const createdVouchers = [];
  for (const vData of SAMPLE_VOUCHERS) {
    const vObj = await Voucher.create(vData);
    createdVouchers.push(vObj);
    console.log(`Voucher ${vObj.code} created!`);
  }

  // Update Posts content placeholders with real voucher data attributes
  for (let i = 0; i < SAMPLE_POSTS.length; i++) {
    const postData = SAMPLE_POSTS[i];
    const voucher = createdVouchers[i % createdVouchers.length];
    
    // Inject custom voucher component tag inside HTML content body
    const voucherHtml = `
      <div class="blog-voucher-card" data-voucher-code="${voucher.code}">
        <div class="voucher-left">
          <span class="v-tag">WORLD CUP 2026</span>
          <h4 class="v-code-title">${voucher.code}</h4>
          <p class="v-desc-lbl">${voucher.description}</p>
        </div>
        <div class="voucher-right">
          <button type="button" class="btn-save-blog-voucher" data-code="${voucher.code}">LƯU MÃ NGAY</button>
        </div>
      </div>
    `;
    
    postData.content = postData.content.replace('<!-- VOUCHER_PLACEHOLDER -->', voucherHtml);
    const postObj = await Post.create(postData);
    console.log(`Post "${postObj.title}" created with inline voucher!`);
  }

  await mongoose.connection.close();
  console.log('Seed completed successfully!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
