const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDb = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Post = require('../models/Post');
const Review = require('../models/Review');
const Contact = require('../models/Contact');
const CatalogCollection = require('../models/CatalogCollection');
const Attribute = require('../models/Attribute');
const ProductVariant = require('../models/ProductVariant');
const Voucher = require('../models/Voucher');
const Brand = require('../models/Brand');
const PartnerStore = require('../models/PartnerStore');
const slugify = require('./slugify');

dotenv.config();

const IMG_SOFA_1 = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80';
const IMG_SOFA_2 = 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80';
const IMG_SOFA_3 = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80';
const IMG_SOFA_4 = 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=80';

const IMG_DINING_1 = 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=900&q=80';
const IMG_DINING_2 = 'https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=900&q=80';
const IMG_DINING_3 = 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=900&q=80';

const IMG_BED_1 = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80';
const IMG_BED_2 = 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=900&q=80';
const IMG_BED_3 = 'https://images.unsplash.com/photo-1505693395321-883724634266?auto=format&fit=crop&w=900&q=80';

const IMG_WARDROBE_1 = 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=900&q=80';
const IMG_WARDROBE_2 = 'https://images.unsplash.com/photo-1558882224-dda166733079?auto=format&fit=crop&w=900&q=80';

const IMG_TV_1 = 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=900&q=80';
const IMG_TV_2 = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80';

const run = async () => {
  await connectDb();

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Post.deleteMany({}),
    Review.deleteMany({}),
    Contact.deleteMany({}),
    CatalogCollection.deleteMany({}),
    Brand.deleteMany({}),
    PartnerStore.deleteMany({}),
    Attribute.deleteMany({}),
    ProductVariant.deleteMany({}),
    Voucher.deleteMany({})
  ]);

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  const [admin, ...customers] = await User.insertMany([
    {
      fullName: 'System Admin',
      email: 'admin@furniture.com',
      password: adminPassword,
      role: 'admin',
      isActive: true
    },
    {
      fullName: 'Trần anh khoa',
      email: 'lionelmessivodichworldcup@gmail.com',
      password: userPassword,
      role: 'user',
      isActive: true,
      createdAt: new Date(2026, 5, 10)
    },
    {
      fullName: 'Nguyễn Văn A',
      email: 'customer1@furniture.com',
      password: userPassword,
      role: 'user',
      isActive: true,
      createdAt: new Date(2026, 7, 2)
    },
    {
      fullName: 'Trần Thị B',
      email: 'customer2@furniture.com',
      password: userPassword,
      role: 'user',
      isActive: true,
      createdAt: new Date(2026, 6, 12)
    }
  ]);

  const categories = await Category.insertMany([
    { name: 'Sofa', slug: 'sofa', description: 'Sofa phong cách tối giản & hiện đại' },
    { name: 'Bàn ăn', slug: 'ban-an', description: 'Bàn ghế ăn gỗ tự nhiên' },
    { name: 'Giường ngủ', slug: 'giuong-ngu', description: 'Giường ngủ thông minh' },
    { name: 'Tủ quần áo', slug: 'tu-quan-ao', description: 'Tủ quần áo hiện đại' },
    { name: 'Kệ tivi', slug: 'ke-tivi', description: 'Kệ tivi phòng khách tinh tế' }
  ]);

  const cat = (slug) => categories.find((c) => c.slug === slug)._id;

  const productRows = [
    // --- SOFA CATEGORY ---
    {
      name: 'Sofa văng gỗ sồi tự nhiên Mộc Home',
      slug: 'sofa-vang-go-soi-tu-nhien-moc-home',
      sku: 'SVG001',
      price: 12500000,
      stock: 12,
      category: cat('sofa'),
      imageUrl: IMG_SOFA_1,
      images: [IMG_SOFA_1, IMG_SOFA_2, IMG_SOFA_3, IMG_SOFA_4],
      description: 'Sofa văng gỗ sồi Nga tự nhiên 100% kết hợp nệm bọc vải nỉ cao cấp.',
      longDescription: 'Sofa văng gỗ sồi tự nhiên mang phong cách thiết kế Japandi. Khung gỗ sồi nguyên khối được xử lý tẩm sấy chống cong vênh mối mọt, bề mặt sơn phủ mịn màng giữ nguyên vân gỗ tự nhiên ấm áp.',
      colors: [{ name: 'Xám', hex: '#9ca3af' }, { name: 'Be', hex: '#d4b896' }],
      sizes: ['180cm', '200cm'],
      material: 'Gỗ sồi Nga tự nhiên',
      origin: 'Việt Nam (Mộc Home)',
      detailSpecs: [
        { label: 'Chất liệu khung', value: 'Gỗ sồi Nga cao cấp' },
        { label: 'Chất liệu nệm', value: 'Mút D40 cao cấp bọc nỉ Nhật Bản' }
      ],
      featured: true,
      collection: 'Japandi'
    },
    {
      name: 'Sofa góc L bọc da bò Ý cao cấp',
      slug: 'sofa-goc-l-boc-da-bo-y-cao-cap',
      sku: 'SF-001',
      price: 24500000,
      stock: 5,
      category: cat('sofa'),
      imageUrl: IMG_SOFA_2,
      images: [IMG_SOFA_2, IMG_SOFA_3],
      description: 'Sofa góc chữ L cỡ lớn, chất liệu da bò thật nhập khẩu từ Ý.',
      longDescription: 'Sofa góc L cao cấp dành cho không gian phòng khách rộng rãi. Hệ khung sắt kết hợp gỗ thông chịu lực cực cao, nệm lò xo túi êm ái đàn hồi vượt trội.',
      featured: true,
      collection: 'Scandinavian'
    },
    {
      name: 'Sofa nỉ Velvet phong cách Retro hoài cổ',
      slug: 'sofa-ni-velvet-phong-cach-retro',
      sku: 'SF-002',
      price: 11900000,
      stock: 8,
      category: cat('sofa'),
      imageUrl: IMG_SOFA_3,
      description: 'Thiết kế cổ điển quý phái, bọc vải nhung mịn màng sang trọng.',
      featured: false,
      collection: 'Cổ điển'
    },

    // --- BÀN ĂN CATEGORY ---
    {
      name: 'Bàn ăn gỗ sồi Nga 6 ghế hiện đại',
      slug: 'ban-an-go-soi-nga-6-ghe-hien-dai',
      sku: 'BA-001',
      price: 9700000,
      stock: 15,
      category: cat('ban-an'),
      imageUrl: IMG_DINING_1,
      images: [IMG_DINING_1, IMG_DINING_2],
      description: 'Bộ bàn ghế ăn gia đình gồm 1 bàn dài 1m6 và 6 ghế tựa lưng sọc dọc.',
      featured: true,
      collection: 'Japandi'
    },
    {
      name: 'Bàn ăn thông minh kéo dài gỗ óc chó',
      slug: 'ban-an-thong-minh-keo-dai-go-oc-cho',
      sku: 'BA-002',
      price: 18500000,
      stock: 4,
      category: cat('ban-an'),
      imageUrl: IMG_DINING_2,
      description: 'Khả năng thu hẹp hoặc kéo dài linh hoạt từ 1m4 lên 2m.',
      featured: true,
      collection: 'Scandinavian'
    },

    // --- GIƯỜNG NGỦ CATEGORY ---
    {
      name: 'Giường ngủ bọc nỉ Cozy Mộc Home',
      slug: 'giuong-ngu-boc-ni-cozy-moc-home',
      sku: 'GN-001',
      price: 15600000,
      stock: 10,
      category: cat('giuong-ngu'),
      imageUrl: IMG_BED_1,
      images: [IMG_BED_1, IMG_BED_2],
      description: 'Giường ngủ cỡ King size, tựa đầu giường bọc nệm bông dày dặn.',
      featured: true,
      collection: 'Scandinavian'
    },
    {
      name: 'Giường ngủ thông minh có ngăn kéo gỗ sồi',
      slug: 'giuong-ngu-thong-minh-co-ngan-keo-go-soi',
      sku: 'GN-002',
      price: 12800000,
      stock: 6,
      category: cat('giuong-ngu'),
      imageUrl: IMG_BED_2,
      description: 'Tích hợp 4 hộc kéo để đồ ở thành giường cực kỳ tối ưu diện tích.',
      featured: false,
      collection: 'Japandi'
    },

    // --- TỦ QUẦN ÁO CATEGORY ---
    {
      name: 'Tủ quần áo cánh kính cao cấp Mộc Home',
      slug: 'tu-quan-ao-canh-kinh-cao-cap-moc-home',
      sku: 'TQ-001',
      price: 16900000,
      stock: 7,
      category: cat('tu-quan-ao'),
      imageUrl: IMG_WARDROBE_1,
      images: [IMG_WARDROBE_1, IMG_WARDROBE_2],
      description: 'Khung nhôm kính cường lực tối màu, tích hợp dải đèn LED cảm biến thông minh.',
      featured: true,
      collection: 'Scandinavian'
    },

    // --- KỆ TIVI CATEGORY ---
    {
      name: 'Kệ tivi rút hai đầu mặt đá Ceramic',
      slug: 'ke-tivi-rut-hai-dau-mat-da-ceramic',
      sku: 'TV-001',
      price: 6800000,
      stock: 11,
      category: cat('ke-tivi'),
      imageUrl: IMG_TV_1,
      images: [IMG_TV_1, IMG_TV_2],
      description: 'Khả năng điều chỉnh chiều dài linh động từ 1m6 đến 2m2.',
      featured: true,
      collection: 'Japandi'
    }
  ];

  const products = await Product.insertMany(
    productRows.map((row) => {
      const stock = row.stock ?? 0;
      let saleStatus = 'selling';
      if (stock === 0) saleStatus = 'out_of_stock';
      return {
        ...row,
        collection: row.collection || 'Japandi',
        saleStatus,
        isVisible: true
      };
    })
  );

  await CatalogCollection.insertMany([
    { name: 'Japandi', slug: 'japandi', description: 'Phong cách tối giản Nhật Bản kết hợp Scandinavian ấm áp' },
    { name: 'Scandinavian', slug: 'scandinavian', description: 'Bắc Âu mộc mạc tinh tế với gỗ sáng màu và nệm lông' },
    { name: 'Cổ điển', slug: 'co-dien', description: 'Đậm chất truyền thống Việt Nam kết hợp huỳnh họa soi tinh xảo' }
  ]);

  await Brand.insertMany([
    { name: 'Mộc Home', slug: 'moc-home', logoUrl: 'logonew.png', description: 'Thương hiệu nội thất gỗ tự nhiên chất lượng cao', isActive: true },
    { name: 'An Cường', slug: 'an-cuong', logoUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=100', description: 'Nhà sản xuất ván gỗ công nghiệp hàng đầu', isActive: true },
    { name: 'Mộc Walnut', slug: 'moc-walnut', logoUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=100', description: 'Nội thất gỗ óc chó Bắc Mỹ nhập khẩu', isActive: true }
  ]);

  const seededProducts = await Product.find({});
  const inventory1 = seededProducts.slice(0, 3).map(p => ({ product: p._id, stock: 15 }));
  const inventory2 = seededProducts.slice(1, 4).map(p => ({ product: p._id, stock: 8 }));
  const inventory3 = seededProducts.slice(2, 5).map(p => ({ product: p._id, stock: 22 }));

  await PartnerStore.insertMany([
    {
      name: 'Mộc Home Hà Nội (Tổng đại lý miền Bắc)',
      address: '12 Cầu Giấy, Quận Cầu Giấy, Hà Nội',
      googleMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.8639847206126!2d105.7937812!3d21.0361288!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab354920c233%3A0x5d0313a3ee313e2f!2zMTIgQ-G6p3UgR2nhuqV5LCBIw6AgTuG7mWk!5e0!3m2!1svi!2s!4v1786163900000',
      phone: '0987654321',
      email: 'hanoi@mochome.vn',
      manager: 'Nguyễn Văn Nam',
      tier: 'Platinum',
      supplyVolume: 850000000,
      inventory: inventory1,
      isActive: true
    },
    {
      name: 'Mộc Home Đà Nẵng (Đại lý miền Trung)',
      address: '45 Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng',
      googleMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3833.967891234567!2d108.2189012!3d16.0612345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219b123456789%3A0x9876543210fedcba!2zNDUgTmd1eeG7hW4gVsSDbiBMaW5oLCDEkMOgIE7hurVuZw!5e0!3m2!1svi!2s!4v1786163900000',
      phone: '0912345678',
      email: 'danang@mochome.vn',
      manager: 'Lê Hoàng Long',
      tier: 'Gold',
      supplyVolume: 420000000,
      inventory: inventory2,
      isActive: true
    },
    {
      name: 'Mộc Home Cần Thơ (Đại lý miền Nam)',
      address: '102 Nguyễn Trãi, Quận Ninh Kiều, Cần Thơ',
      googleMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3928.845678912345!2d105.7812345!3d10.0312345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a062b123456789%3A0x1234567890abcdef!2zMTAyIE5ndXnhu4VuIFRyw6NpLCBD4bqnbiBUaMah!5e0!3m2!1svi!2s!4v1786163900000',
      phone: '0909998877',
      email: 'cantho@mochome.vn',
      manager: 'Phạm Minh Tuấn',
      tier: 'Standard',
      supplyVolume: 120000000,
      inventory: inventory3,
      isActive: true
    }
  ]);

  await Attribute.insertMany([
    { name: 'Màu sắc', slug: 'mau-sac', type: 'color', values: ['Xám', 'Be', 'Nâu', 'Trắng'] },
    { name: 'Kích thước', slug: 'kich-thuoc', type: 'size', values: ['180cm', '200cm', '220cm'] },
    { name: 'Chất liệu', slug: 'chat-lieu', type: 'text', values: ['Gỗ sồi', 'Gỗ óc chó', 'Da bò thật'] }
  ]);

  const p = (sku) => products.find((x) => x.sku === sku);

  await ProductVariant.insertMany([
    {
      product: p('SVG001')._id,
      sku: 'SVG001-180-GR',
      name: 'Sofa văng 180cm — Xám',
      price: 12500000,
      stock: 4,
      attributes: { color: 'Xám', size: '180cm' }
    },
    {
      product: p('SVG001')._id,
      sku: 'SVG001-200-BE',
      name: 'Sofa văng 200cm — Be',
      price: 13200000,
      stock: 5,
      attributes: { color: 'Be', size: '200cm' }
    }
  ]);

  await Order.insertMany([
    {
      user: customers[1]._id,
      items: [{ product: p('SVG001')._id, quantity: 1, price: p('SVG001').price }],
      totalAmount: p('SVG001').price,
      status: 'pending',
      paymentMethod: 'cod',
      shippingAddress: 'TP. Hồ Chí Minh',
      createdAt: new Date(2026, 7, 8)
    },
    {
      user: customers[2]._id,
      items: [{ product: p('BA-001')._id, quantity: 1, price: p('BA-001').price }],
      totalAmount: p('BA-001').price,
      status: 'completed',
      paymentMethod: 'VNPay',
      shippingAddress: 'Hà Nội',
      createdAt: new Date(2026, 7, 5)
    },
    {
      user: customers[1]._id,
      items: [{ product: p('SVG001')._id, quantity: 1, price: p('SVG001').price }],
      totalAmount: 12500000,
      status: 'completed',
      paymentMethod: 'vnpay',
      shippingAddress: 'Đà Nẵng',
      createdAt: new Date(2026, 6, 12)
    },
    {
      user: customers[2]._id,
      items: [{ product: p('BA-001')._id, quantity: 1, price: p('BA-001').price }],
      totalAmount: 9700000,
      status: 'completed',
      paymentMethod: 'cod',
      shippingAddress: 'Hải Phòng',
      createdAt: new Date(2026, 5, 20)
    },
    {
      user: customers[1]._id,
      items: [{ product: p('SVG001')._id, quantity: 1, price: p('SVG001').price }],
      totalAmount: 8500000,
      status: 'completed',
      paymentMethod: 'vnpay',
      shippingAddress: 'Cần Thơ',
      createdAt: new Date(2026, 4, 15)
    }
  ]);

  await Review.insertMany([
    {
      user: customers[1]._id,
      product: p('SVG001')._id,
      rating: 5,
      comment: 'Sofa gỗ sồi rất đẹp và chắc chắn, vân gỗ sáng sang trọng!',
      approved: true
    }
  ]);

  await Contact.insertMany([
    {
      fullName: 'Nguyễn Văn A',
      email: 'customer1@furniture.com',
      subject: 'Hỏi về kích thước tủ bếp',
      message: 'Tôi muốn đặt đóng tủ bếp theo kích thước riêng có được không?',
      status: 'new'
    }
  ]);

  await Voucher.insertMany([
    {
      code: 'MOCHOME50K',
      name: 'Giảm 50k tri ân',
      description: 'Quà tặng từ vòng quay may mắn',
      discountType: 'fixed',
      discountValue: 50000,
      minOrderAmount: 500000,
      maxDiscountAmount: 50000,
      isActive: true,
      showInStorePicker: false
    },
    {
      code: 'MOCHOMELOYAL10',
      name: 'Ưu đãi Loyalty 10%',
      description: 'Voucher may mắn giảm giá 10%',
      discountType: 'percent',
      discountValue: 10,
      minOrderAmount: 1000000,
      maxDiscountAmount: 500000,
      isActive: true,
      showInStorePicker: false
    }
  ]);

  await Post.insertMany([
    {
      title: '5 xu hướng thiết kế nội thất gỗ tự nhiên 2026',
      slug: '5-xu-huong-thiet-ke-noi-that-go-tu-nhien-2026',
      excerpt: 'Mộc Home tổng hợp xu hướng thiết kế nội thất gỗ tự nhiên tối giản bền đẹp trong năm mới.',
      content: 'Nội thất gỗ sồi và gỗ óc chó tiếp tục dẫn đầu xu hướng nhờ tính chất bền bỉ và vẻ ngoài sang trọng ấm áp...',
      thumbnail: IMG_SOFA_1,
      published: true,
      isVisible: true,
      viewCount: 1280,
      likeCount: 92,
      shareCount: 18
    }
  ]);

  console.log('Database re-seed finished successfully.');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
