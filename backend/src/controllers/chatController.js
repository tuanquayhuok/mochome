const Product = require('../models/Product');

const formatPrice = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const normalize = (text) =>
  (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const FAQ = [
  {
    keys: ['giao hang', 'van chuyen', 'ship', 'bao lau'],
    reply:
      'Mộc Home giao hàng toàn quốc. Đơn nội thành thường 2–5 ngày, tỉnh khác 5–10 ngày tùy khu vực. Phí vận chuyển được tính khi đặt hàng.'
  },
  {
    keys: ['doi tra', 'bao hanh', 'doitra'],
    reply:
      'Chính sách đổi trả trong 7 ngày nếu lỗi từ nhà sản xuất. Sản phẩm giữ nguyên tem, bao bì và hóa đơn. Bảo hành khung gỗ theo từng dòng sản phẩm — chi tiết xem tại trang sản phẩm.'
  },
  {
    keys: ['lien he', 'hotline', 'dia chi', 'goi'],
    reply:
      'Liên hệ Mộc Home: 0123 456 789 • info@mochome.vn • 123 Đường ABC, Q.1, TP.HCM. Giờ làm việc 8:00–22:00 mỗi ngày. Bạn cũng có thể dùng trang Liên hệ trên website.'
  },
  {
    keys: ['thanh toan', 'cod', 'momo', 'vnpay'],
    reply:
      'Hỗ trợ thanh toán COD, chuyển khoản và các ví điện tử phổ biến (Momo, VNPay). Khi đặt hàng qua giỏ hàng, bạn chọn phương thức phù hợp.'
  },
  {
    keys: ['tu van', 'chon sofa', 'phong khach', 'noi that'],
    reply:
      'Để chọn nội thất phù hợp, bạn cho mình biết: diện tích phòng, phong cách (tối giản/cổ điển), và ngân sách dự kiến. Mình sẽ gợi ý sản phẩm trong danh mục Mộc Home.'
  }
];

const matchFaq = (msg) => {
  const n = normalize(msg);
  for (const item of FAQ) {
    if (item.keys.some((k) => n.includes(k))) {
      return item.reply;
    }
  }
  return null;
};

const searchProducts = async (message) => {
  const n = normalize(message);
  const tokens = n.split(/\s+/).filter((w) => w.length > 2);
  if (!tokens.length) return [];

  const or = tokens.flatMap((t) => [
    { name: { $regex: t, $options: 'i' } },
    { description: { $regex: t, $options: 'i' } },
    { material: { $regex: t, $options: 'i' } }
  ]);

  const products = await Product.find({
    isVisible: { $ne: false },
    $or: or
  })
    .select('name slug price imageUrl stock')
    .sort('-featured -createdAt')
    .limit(4)
    .lean();

  return products;
};

const buildProductReply = (products) => {
  if (!products.length) {
    return null;
  }

  const lines = products.map(
    (p) =>
      `• **${p.name}** — ${formatPrice(p.price)}${p.stock > 0 ? ' (còn hàng)' : ' (hết hàng)'} — /san-pham/${p.slug}`
  );

  return `Mình tìm thấy một số sản phẩm phù hợp:\n\n${lines.join('\n')}\n\nBấm đường dẫn để xem chi tiết hoặc hỏi thêm về kích thước, màu sắc nhé!`;
};

const storeChat = async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập câu hỏi' });
  }

  const trimmed = message.trim().slice(0, 500);
  const n = normalize(trimmed);

  let reply =
    'Xin chào! Mình là trợ lý AI của **Mộc Home** — có thể tư vấn sản phẩm, giá, giao hàng và chính sách. Bạn muốn hỏi gì ạ?';

  if (/^(xin chao|hello|hi|chao|hey)\b/.test(n)) {
    reply =
      'Chào bạn! 👋 Mình là trợ lý Mộc Home. Bạn có thể hỏi về sofa, bàn ăn, giá sản phẩm, giao hàng hoặc chính sách đổi trả.';
  } else {
    const faq = matchFaq(trimmed);
    if (faq) {
      reply = faq;
    } else {
      const products = await searchProducts(trimmed);
      const productReply = buildProductReply(products);
      if (productReply) {
        reply = productReply;
      } else if (/ban chay|noi bat|featured|san pham noi/.test(n)) {
        const featured = await Product.find({ isVisible: { $ne: false } })
          .select('name price slug stock')
          .sort('-featured -createdAt')
          .limit(4)
          .lean();
        reply =
          featured.length > 0
            ? 'Sản phẩm nổi bật tại Mộc Home:\n\n' +
              featured
                .map(
                  (p) =>
                    `• **${p.name}** — ${formatPrice(p.price)} — /san-pham/${p.slug}`
                )
                .join('\n')
            : 'Hiện chưa có sản phẩm nổi bật. Bạn xem thêm tại /san-pham nhé!';
      } else if (/gia|bao nhieu|price/.test(n)) {
        const featured = await Product.find({ isVisible: { $ne: false } })
          .select('name price slug')
          .sort('-featured')
          .limit(3)
          .lean();
        if (featured.length) {
          reply =
            'Một số sản phẩm nổi bật:\n\n' +
            featured
              .map((p) => `• ${p.name}: ${formatPrice(p.price)} — /san-pham/${p.slug}`)
              .join('\n');
        } else {
          reply = 'Bạn vào mục Sản phẩm để xem bảng giá cập nhật, hoặc gửi tên sản phẩm cụ thể để mình tra giúp.';
        }
      } else {
        reply =
          'Mình chưa chắc ý bạn — bạn thử hỏi rõ hơn (ví dụ: "sofa phòng khách", "phí giao hàng", "chính sách đổi trả"). Hoặc xem danh mục tại /san-pham.';
      }
    }
  }

  const suggestions = [
    'Sofa phòng khách',
    'Chính sách giao hàng',
    'Sản phẩm nổi bật',
    'Liên hệ cửa hàng'
  ];

  return res.json({
    reply,
    suggestions,
    meta: { model: 'moc-home-assistant', historyLength: Array.isArray(history) ? history.length : 0 }
  });
};

module.exports = { storeChat };
