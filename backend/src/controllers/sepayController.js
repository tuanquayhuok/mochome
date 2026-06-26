const Order = require('../models/Order');

/**
 * API Webhook nhận thông báo chuyển khoản ngân hàng từ SePay
 * Ví dụ URL: POST /api/public/sepay/webhook
 */
const sepayWebhook = async (req, res) => {
  try {
    // 1. Kiểm tra Token bảo mật của SePay trong Headers để tránh giả mạo webhook
    const sepayToken = req.headers['x-sepay-token'] || req.headers['Authorization'];
    const expectedToken = process.env.SEPAY_API_KEY || process.env.SEPAY_TOKEN;
    
    if (expectedToken && sepayToken !== expectedToken) {
      return res.status(401).json({ status: 401, message: 'Unauthorized. Invalid API Key / Token' });
    }

    const {
      gateway,        // Tên ngân hàng nhận (Vietcombank, Techcombank, ...)
      transactionDate,// Thời gian giao dịch phát sinh
      accountNumber,  // Số tài khoản nhận tiền
      code,           // Mã giao dịch của Ngân hàng
      content,        // Nội dung chuyển khoản chuyển đến
      transferType,   // in (nhận tiền) hoặc out (chuyển tiền đi)
      transferAmount, // Số tiền chuyển khoản
      referenceCode,  // Mã tham chiếu giao dịch
      id              // ID giao dịch hệ thống SePay
    } = req.body;

    // Chỉ xử lý các giao dịch nhận tiền (in)
    if (transferType !== 'in') {
      return res.json({ status: 200, message: 'Ignore transfer-out transaction' });
    }

    // 2. Tìm mã đơn hàng từ nội dung chuyển khoản (Ví dụ nội dung chứa: DH123456 hoặc ID đơn hàng)
    // Cú pháp tìm kiếm mã đơn hàng dạng: DHXXXXXX (Mã code hiển thị 6 ký tự cuối ID)
    const orderCodeMatch = String(content || '').match(/DH([a-fA-F0-9]{6})/i);
    
    let order = null;
    if (orderCodeMatch && orderCodeMatch[1]) {
      const hexSuffix = orderCodeMatch[1].toLowerCase();
      
      // Tìm đơn hàng có phần cuối của ID khớp với mã nhận dạng từ cú pháp
      const orders = await Order.find({ status: 'pending' });
      order = orders.find(o => o._id.toString().slice(-6).toLowerCase() === hexSuffix);
    }

    // Trường hợp không tìm thấy theo mã định danh rút gọn, thử tìm trực tiếp bằng ID đầy đủ trong nội dung
    if (!order) {
      const fullIdMatch = String(content || '').match(/([a-fA-F0-9]{24})/i);
      if (fullIdMatch && fullIdMatch[1]) {
        order = await Order.findOne({ _id: fullIdMatch[1], status: 'pending' });
      }
    }

    if (!order) {
      return res.status(404).json({ status: 404, message: 'Order not found or not in pending state' });
    }

    // 3. So khớp số tiền chuyển khoản với số tiền cần thanh toán của đơn hàng
    if (Math.round(order.totalAmount) > Math.round(Number(transferAmount))) {
      return res.status(400).json({ 
        status: 400, 
        message: `Amount mismatch. Order total: ${order.totalAmount}, Transferred: ${transferAmount}` 
      });
    }

    // 4. Cập nhật trạng thái đơn hàng thành công
    order.paymentStatus = 'paid';
    order.paymentMethod = 'bank_transfer';
    order.status = 'processing';
    order.statusHistory.push({
      fromStatus: 'pending',
      toStatus: 'processing',
      reason: `Thanh toán chuyển khoản tự động qua SePay (GD: ${code}, Nội dung: ${content})`,
      changedAt: new Date()
    });

    await order.save();

    return res.json({
      status: 200,
      message: 'Success',
      orderId: order._id
    });

  } catch (error) {
    console.error('Error handling SePay Webhook:', error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error' });
  }
};

module.exports = {
  sepayWebhook
};
