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
const slugify = require('./slugify');

dotenv.config();

const SOFA_IMG =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80';
const SOFA_IMG_2 =
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80';
const SOFA_IMG_3 =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80';
const SOFA_IMG_4 =
  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=80';

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
      fullName: 'Nguyễn Văn A',
      email: 'customer1@furniture.com',
      password: userPassword,
      role: 'user',
      isActive: true
    },
    {
      fullName: 'Trần Thị B',
      email: 'customer2@furniture.com',
      password: userPassword,
      role: 'user',
      isActive: true
    },
    {
      fullName: 'Lê Văn C',
      email: 'customer3@furniture.com',
      password: userPassword,
      role: 'user',
      isActive: true
    },
    {
      fullName: 'Phạm Thị D',
      email: 'customer4@furniture.com',
      password: userPassword,
      role: 'user',
      isActive: true
    },
    {
      fullName: 'Hoàng Văn E',
      email: 'customer5@furniture.com',
      password: userPassword,
      role: 'user',
      isActive: true
    }
  ]);

  const categories = await Category.insertMany([
    { name: 'Sofa', slug: 'sofa', description: 'Sofa và phòng khách' },
    { name: 'Bàn ăn', slug: 'ban-an', description: 'Bàn ghế ăn uống' },
    { name: 'Giường ngủ', slug: 'giuong-ngu', description: 'Giường nệm phòng ngủ' },
    { name: 'Tủ quần áo', slug: 'tu-quan-ao', description: 'Tủ quần áo tủ kệ' },
    { name: 'Kệ tivi', slug: 'ke-tivi', description: 'Kệ tivi phòng khách' }
  ]);

  const cat = (slug) => categories.find((c) => c.slug === slug)._id;

  const productRows = [
    {
      name: 'Sofa văng gỗ tự nhiên',
      slug: 'sofa-vang-go-tu-nhien',
      sku: 'SVG001',
      price: 12500000,
      stock: 12,
      category: cat('sofa'),
      imageUrl: SOFA_IMG,
      images: [SOFA_IMG, SOFA_IMG_2, SOFA_IMG_3, SOFA_IMG_4],
      description:
        'Sofa văng gỗ sồi tự nhiên kết hợp nệm vải cao cấp, thiết kế tối giản phù hợp phòng khách hiện đại.',
      longDescription:
        'Sofa văng gỗ tự nhiên mang phong cách Scandinavian, khung gỗ sồi nguyên khối chắc chắn, nệm bọc vải thoáng khí. Sản phẩm phù hợp không gian phòng khách, phòng đọc sách hoặc góc thư giãn.',
      colors: [
        { name: 'Xám', hex: '#9ca3af' },
        { name: 'Be', hex: '#d4b896' },
        { name: 'Nâu', hex: '#8b6914' }
      ],
      sizes: ['180cm', '200cm', '220cm'],
      material: 'Gỗ sồi tự nhiên, Nệm vải cao cấp',
      origin: 'Việt Nam',
      detailSpecs: [
        { label: 'Chất liệu', value: 'Gỗ sồi tự nhiên, vải bọc cao cấp' },
        { label: 'Màu sắc', value: 'Xám / Be / Nâu' },
        { label: 'Kích thước', value: '180cm / 200cm / 220cm' },
        { label: 'Xuất xứ', value: 'Việt Nam' }
      ],
      careGuide:
        'Tránh ánh nắng trực tiếp và độ ẩm cao. Lau bụi bằng khăn mềm khô hàng tuần. Không dùng hóa chất mạnh.',
      returnPolicy: 'Đổi trả trong 7 ngày nếu sản phẩm lỗi từ nhà sản xuất.',
      featured: true
    },
    {
      name: 'Ghế sofa góc L hiện đại',
      sku: 'SF-001',
      price: 18500000,
      stock: 45,
      category: cat('sofa'),
      description: 'Sofa da cao cấp phòng khách',
      featured: true
    },
    {
      name: 'Sofa bọc nỉ 3 chỗ',
      sku: 'SF-002',
      price: 12900000,
      stock: 32,
      category: cat('sofa'),
      featured: true
    },
    {
      name: 'Bàn ăn gỗ sồi 6 ghế',
      sku: 'BA-001',
      price: 9700000,
      stock: 28,
      category: cat('ban-an'),
      featured: true
    },
    {
      name: 'Bàn ăn tròn 4 ghế',
      sku: 'BA-002',
      price: 6500000,
      stock: 18,
      category: cat('ban-an')
    },
    {
      name: 'Giường ngủ bọc nỉ cao cấp',
      sku: 'GN-001',
      price: 15600000,
      stock: 22,
      category: cat('giuong-ngu'),
      featured: true
    },
    {
      name: 'Giường tầng trẻ em',
      sku: 'GN-002',
      price: 8900000,
      stock: 12,
      category: cat('giuong-ngu')
    },
    {
      name: 'Tủ quần áo 4 cánh',
      sku: 'TQ-001',
      price: 11200000,
      stock: 24,
      category: cat('tu-quan-ao'),
      featured: true
    },
    {
      name: 'Tủ quần áo 2 cánh',
      sku: 'TQ-002',
      price: 5400000,
      stock: 15,
      category: cat('tu-quan-ao')
    },
    {
      name: 'Kệ tivi treo tường',
      sku: 'TV-001',
      price: 3200000,
      stock: 19,
      category: cat('ke-tivi')
    },
    {
      name: 'Kệ tivi gỗ tự nhiên',
      sku: 'TV-002',
      price: 5600000,
      stock: 14,
      category: cat('ke-tivi')
    },
    {
      name: 'Ghế bar gỗ sồi',
      sku: 'GB-001',
      price: 2100000,
      stock: 2,
      category: cat('ban-an')
    },
    {
      name: 'Đèn bàn trang trí',
      sku: 'DT-001',
      price: 890000,
      stock: 3,
      category: cat('ke-tivi')
    },
    {
      name: 'Thảm phòng khách',
      sku: 'TK-001',
      price: 2400000,
      stock: 5,
      category: cat('sofa')
    },
    {
      name: 'Bàn trà phòng khách',
      sku: 'BT-001',
      price: 1800000,
      stock: 35,
      category: cat('sofa')
    },
    {
      name: 'Tủ giày đa năng',
      sku: 'TG-001',
      price: 3200000,
      stock: 8,
      category: cat('tu-quan-ao')
    }
  ];

  const products = await Product.insertMany(
    productRows.map((row) => {
      const stock = row.stock ?? 0;
      let saleStatus = 'selling';
      if (stock === 0) saleStatus = 'out_of_stock';
      else if (stock <= 2) saleStatus = 'stopped';

      return {
        ...row,
        slug: row.slug || slugify(row.name),
        collection: row.collection || (row.featured ? 'Japandi' : 'Cổ điển'),
        saleStatus: row.saleStatus || saleStatus,
        isVisible: row.isVisible ?? true
      };
    })
  );

  await CatalogCollection.insertMany([
    { name: 'Japandi', slug: 'japandi', description: 'Phong cách tối giản Nhật Bản' },
    { name: 'Scandinavian', slug: 'scandinavian', description: 'Bắc Âu ấm áp' },
    { name: 'Cổ điển', slug: 'co-dien', description: 'Nội thất truyền thống' }
  ]);

  await Attribute.insertMany([
    { name: 'Màu sắc', slug: 'mau-sac', type: 'color', values: ['Xám', 'Be', 'Nâu', 'Trắng'] },
    { name: 'Kích thước', slug: 'kich-thuoc', type: 'size', values: ['180cm', '200cm', '220cm'] },
    { name: 'Chất liệu', slug: 'chat-lieu', type: 'text', values: ['Gỗ sồi', 'Gỗ óc chó', 'Vải bọc'] }
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
    },
    {
      product: p('SF-001')._id,
      sku: 'SF-001-L',
      name: 'Sofa góc L — Da nâu',
      price: 18500000,
      stock: 8,
      attributes: { color: 'Nâu', size: '280cm' }
    }
  ]);

  const orders = await Order.insertMany([
    {
      user: customers[0]._id,
      items: [{ product: p('SF-001')._id, quantity: 1, price: p('SF-001').price }],
      totalAmount: p('SF-001').price,
      status: 'pending',
      paymentMethod: 'cod',
      shippingAddress: 'TP. Hồ Chí Minh'
    },
    {
      user: customers[1]._id,
      items: [{ product: p('BA-001')._id, quantity: 1, price: p('BA-001').price }],
      totalAmount: p('BA-001').price,
      status: 'processing',
      paymentMethod: 'VNPay',
      shippingAddress: 'Hà Nội'
    },
    {
      user: customers[2]._id,
      items: [{ product: p('GN-001')._id, quantity: 1, price: p('GN-001').price }],
      totalAmount: p('GN-001').price,
      status: 'shipping',
      paymentMethod: 'Momo',
      shippingAddress: 'Đà Nẵng'
    },
    {
      user: customers[3]._id,
      items: [{ product: p('TQ-001')._id, quantity: 1, price: p('TQ-001').price }],
      totalAmount: p('TQ-001').price,
      status: 'completed',
      paymentMethod: 'cod',
      shippingAddress: 'Cần Thơ'
    },
    {
      user: customers[4]._id,
      items: [{ product: p('TV-002')._id, quantity: 2, price: p('TV-002').price }],
      totalAmount: p('TV-002').price * 2,
      status: 'cancelled',
      paymentMethod: 'VNPay',
      shippingAddress: 'Hải Phòng'
    },
    {
      user: customers[0]._id,
      items: [
        { product: p('SF-001')._id, quantity: 2, price: p('SF-001').price },
        { product: p('BT-001')._id, quantity: 1, price: p('BT-001').price }
      ],
      totalAmount: p('SF-001').price * 2 + p('BT-001').price,
      status: 'completed',
      paymentMethod: 'cod',
      shippingAddress: 'TP. Hồ Chí Minh'
    },
    {
      user: customers[1]._id,
      items: [{ product: p('BA-001')._id, quantity: 3, price: p('BA-001').price }],
      totalAmount: p('BA-001').price * 3,
      status: 'completed',
      paymentMethod: 'VNPay',
      shippingAddress: 'Hà Nội'
    }
  ]);

  await Review.insertMany([
    {
      user: customers[0]._id,
      product: p('SF-001')._id,
      rating: 5,
      comment: 'Sofa đẹp, giao hàng nhanh',
      approved: true
    },
    {
      user: customers[1]._id,
      product: p('BA-001')._id,
      rating: 4,
      comment: 'Bàn ăn chắc chắn',
      approved: true
    },
    {
      user: customers[2]._id,
      product: p('GN-001')._id,
      rating: 5,
      comment: 'Giường ngủ rất êm',
      approved: false
    }
  ]);

  await Contact.insertMany([
    {
      fullName: 'Trần Thị B',
      email: 'support@example.com',
      subject: 'Hỏi về bảo hành',
      message: 'Chính sách bảo hành sofa như thế nào?',
      status: 'new'
    }
  ]);

  await Voucher.insertMany([
    {
      code: 'MOCHOME10',
      name: 'Giảm 10% đơn từ 1 triệu',
      description: 'Áp dụng cho mọi khách, giảm tối đa 200.000đ',
      discountType: 'percent',
      discountValue: 10,
      minOrderAmount: 1000000,
      maxDiscountAmount: 200000,
      firstOrderOnly: false,
      usageLimit: 500,
      usedCount: 12,
      isActive: true,
      showInStorePicker: true
    },
    {
      code: 'KHACHMOI',
      name: 'Khách mua lần đầu — giảm 15%',
      description: 'Chỉ dành cho khách chưa từng có đơn hàng thành công',
      discountType: 'percent',
      discountValue: 15,
      minOrderAmount: 500000,
      maxDiscountAmount: 300000,
      firstOrderOnly: true,
      usageLimit: 0,
      usedCount: 3,
      isActive: true,
      showInStorePicker: true
    },
    {
      code: 'GIAM100K',
      name: 'Giảm 100.000đ đơn từ 2 triệu',
      description: 'Giảm cố định khi đơn đạt ngưỡng',
      discountType: 'fixed',
      discountValue: 100000,
      minOrderAmount: 2000000,
      maxDiscountAmount: 0,
      firstOrderOnly: false,
      usageLimit: 200,
      usedCount: 45,
      isActive: true,
      showInStorePicker: true
    },
    { code: 'T5THANG', name: 'Tích lũy tháng 5%', discountType: 'percent', discountValue: 5, minOrderAmount: 500000, maxDiscountAmount: 300000, isActive: true, showInStorePicker: false },
    { code: 'T10THANG', name: 'Tích lũy tháng 10%', discountType: 'percent', discountValue: 10, minOrderAmount: 1000000, maxDiscountAmount: 500000, isActive: true, showInStorePicker: false },
    { code: 'T15THANG', name: 'Tích lũy tháng 15%', discountType: 'percent', discountValue: 15, minOrderAmount: 2000000, maxDiscountAmount: 800000, isActive: true, showInStorePicker: false },
    { code: 'T20THANG', name: 'Tích lũy tháng 20%', discountType: 'percent', discountValue: 20, minOrderAmount: 3000000, maxDiscountAmount: 1200000, isActive: true, showInStorePicker: false },
    { code: 'N8NAM', name: 'Tích lũy năm 8%', discountType: 'percent', discountValue: 8, minOrderAmount: 1000000, maxDiscountAmount: 600000, isActive: true, showInStorePicker: false },
    { code: 'N12NAM', name: 'Tích lũy năm 12%', discountType: 'percent', discountValue: 12, minOrderAmount: 2000000, maxDiscountAmount: 1000000, isActive: true, showInStorePicker: false },
    { code: 'N18NAM', name: 'Tích lũy năm 18%', discountType: 'percent', discountValue: 18, minOrderAmount: 5000000, maxDiscountAmount: 1500000, isActive: true, showInStorePicker: false },
    { code: 'N25NAM', name: 'Tích lũy năm 25%', discountType: 'percent', discountValue: 25, minOrderAmount: 8000000, maxDiscountAmount: 2500000, isActive: true, showInStorePicker: false },
    { code: 'TVIPTHANG', name: 'VIP tháng 20%', discountType: 'percent', discountValue: 20, minOrderAmount: 3000000, maxDiscountAmount: 1200000, isActive: true, showInStorePicker: false },
    { code: 'NVIP', name: 'VIP năm 12%', discountType: 'percent', discountValue: 12, minOrderAmount: 2000000, maxDiscountAmount: 800000, isActive: true, showInStorePicker: false },
    { code: 'NDOITAC', name: 'Đối tác 18%', discountType: 'percent', discountValue: 18, minOrderAmount: 5000000, maxDiscountAmount: 1500000, isActive: true, showInStorePicker: false },
    { code: 'NSIEUTHAN', name: 'Siêu thân thiết 25%', discountType: 'percent', discountValue: 25, minOrderAmount: 8000000, maxDiscountAmount: 2500000, isActive: true, showInStorePicker: false }
  ]);

  await Post.insertMany([
    {
      title: '5 xu hướng nội thất hiện đại 2026',
      slug: '5-xu-huong-noi-that-2026',
      excerpt: 'Tổng hợp xu hướng nội thất được ưa chuộng.',
      content: 'Nội dung bài viết Mộc Home.',
      thumbnail: SOFA_IMG,
      published: true,
      isVisible: true,
      viewCount: 1240,
      likeCount: 86,
      shareCount: 24
    },
    {
      title: 'Cách chọn sofa phòng khách',
      slug: 'cach-chon-sofa-phong-khach',
      excerpt: 'Hướng dẫn chọn sofa phù hợp không gian.',
      content: 'Nội dung bài viết Mộc Home.',
      thumbnail: SOFA_IMG_2,
      published: false,
      isVisible: true,
      viewCount: 320,
      likeCount: 18,
      shareCount: 5
    }
  ]);

  console.log('Seed completed:');
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${products.length} products`);
  console.log(`  - ${orders.length} orders`);
  console.log(`  - ${customers.length + 1} users (1 admin)`);
  console.log('Admin: admin@furniture.com / Admin@123');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
