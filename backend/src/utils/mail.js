const crypto = require('crypto');

const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
};

const buildResetHtml = (fullName, tempPassword) => `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;line-height:1.5;color:#1a1d21">
  <h2>MỘC HOME — Khôi phục mật khẩu</h2>
  <p>Xin chào ${fullName || 'bạn'},</p>
  <p>Mật khẩu tạm thời của bạn là:</p>
  <p style="font-size:18px;font-weight:bold;letter-spacing:1px">${tempPassword}</p>
  <p>Vui lòng đăng nhập và đổi mật khẩu mới tại mục <strong>Bảo mật</strong> trong tài khoản.</p>
  <p style="color:#6b7280;font-size:13px">Nếu bạn không yêu cầu khôi phục, hãy liên hệ hotline 1900 1234.</p>
</body>
</html>
`;

const sendViaSmtp = async ({ to, subject, html }) => {
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch {
    return { sent: false, reason: 'nodemailer_not_installed' };
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER || 'trongtuan206z@gmail.com';
  const pass = process.env.SMTP_PASS || 'fcrr sxlc fnkm nsna';

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // Defaults to false
    auth: { user, pass }
  });

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `"MỘC HOME" <${user}>`,
      to,
      subject,
      html
    });
    return { sent: true };
  } catch (error) {
    console.error('SMTP sendMail Error:', error);
    return { sent: false, reason: 'smtp_send_failed', error: error.message };
  }
};

const getSmtpDebugInfo = () => {
  let nodemailerInstalled = true;
  try {
    require('nodemailer');
  } catch {
    nodemailerInstalled = false;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER || 'trongtuan206z@gmail.com';
  const pass = process.env.SMTP_PASS || 'fcrr sxlc fnkm nsna';

  return {
    nodemailerInstalled,
    smtpConfigured: true,
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user,
    from: process.env.MAIL_FROM || `"MỘC HOME" <${user}>`
  };
};

const buildWelcomeHtml = (fullName) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chào mừng bạn đến với Mộc Home</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;padding:32px 16px">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" maxWidth="600" style="max-width:600px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.03);border-collapse:separate" cellpadding="0" cellspacing="0">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding:40px 40px 24px;background-color:#ffffff">
              <span style="font-size:24px;font-weight:800;letter-spacing:4px;color:#5c4033;font-family:'Outfit','Inter',sans-serif;margin:0;display:block">MỘC HOME</span>
              <span style="font-size:11px;letter-spacing:3px;color:#9ca3af;text-transform:uppercase;margin-top:6px;display:block">Nội Thất Hiện Đại</span>
            </td>
          </tr>

          <!-- Hero Greeting Image / Visual Border -->
          <tr>
            <td style="padding:0 40px">
              <div style="height:3px;background:linear-gradient(90deg, #d4b896, #5c4033, #d4b896);border-radius:2px"></div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:40px 40px 32px;color:#1f2937">
              <h1 style="font-size:20px;font-weight:700;line-height:1.4;margin:0 0 16px;color:#111827">Chào mừng bạn gia nhập gia đình Mộc Home!</h1>
              
              <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#4b5563">
                Xin chào <strong>${fullName || 'Quý khách'}</strong>,<br><br>
                Cảm ơn bạn đã tin tưởng và đăng ký tài khoản tại <strong>Mộc Home</strong> — nơi kiến tạo những không gian sống ấm cúng, tinh tế và ngập tràn cảm hứng. Tài khoản của bạn đã được kích hoạt thành công và sẵn sàng để trải nghiệm dịch vụ.
              </p>

              <!-- Features Box -->
              <table width="100%" style="background-color:#fefaf6;border-radius:8px;padding:24px 20px;margin-bottom:32px;border:1px solid #fae8d8" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:14px;font-weight:700;color:#8b5a2b;text-transform:uppercase;letter-spacing:1px;padding-bottom:16px">Đặc quyền dành riêng cho bạn:</td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <!-- Item 1 -->
                      <tr>
                        <td valign="top" width="28" style="padding-bottom:12px;font-size:16px">📦</td>
                        <td style="font-size:14px;line-height:1.5;color:#4b5563;padding-bottom:12px">
                          <strong style="color:#111827">Theo dõi đơn hàng dễ dàng</strong><br>
                          Theo dõi trạng thái giao hàng và chi tiết các đơn hàng mọi lúc mọi nơi.
                        </td>
                      </tr>
                      <!-- Item 2 -->
                      <tr>
                        <td valign="top" width="28" style="padding-bottom:12px;font-size:16px">💎</td>
                        <td style="font-size:14px;line-height:1.5;color:#4b5563;padding-bottom:12px">
                          <strong style="color:#111827">Tích điểm thành viên</strong><br>
                          Mỗi đơn hàng thành công sẽ tích lũy điểm thưởng để đổi hàng ngàn voucher ưu đãi độc quyền.
                        </td>
                      </tr>
                      <!-- Item 3 -->
                      <tr>
                        <td valign="top" width="28" style="font-size:16px">❤️</td>
                        <td style="font-size:14px;line-height:1.5;color:#4b5563">
                          <strong style="color:#111827">Danh sách yêu thích</strong><br>
                          Lưu trữ những sản phẩm nội thích yêu thích để dễ dàng tham khảo và mua sắm sau.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px">
                <tr>
                  <td align="center">
                    <a href="http://localhost:4200" target="_blank" style="background-color:#5c4033;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;display:inline-block;letter-spacing:1px;box-shadow:0 4px 6px rgba(92,64,51,0.2)">KHÁM PHÁ CỬA HÀNG NGAY</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="padding:32px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.6">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px">
                    <strong>MỘC HOME — NÂNG TẦM KHÔNG GIAN SỐNG</strong><br>
                    📞 Hotline: 1900 1234 (Hỗ trợ 24/7)<br>
                    ✉️ Email: support@mochome.com<br>
                    📍 Showroom: Hà Nội & TP. Hồ Chí Minh
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #e5e7eb;padding-top:12px;font-size:11px;color:#9ca3af">
                    Đây là email tự động gửi từ hệ thống Mộc Home. Nếu bạn không tạo tài khoản này, vui lòng bỏ qua hoặc liên hệ bộ phận hỗ trợ khách hàng.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const buildActivationHtml = (fullName, activationUrl) => `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;line-height:1.5;color:#1a1d21">
  <h2>MỘC HOME — Kích hoạt tài khoản</h2>
  <p>Xin chào ${fullName || 'bạn'},</p>
  <p>Bạn vừa tạo tài khoản tại <strong>MỘC HOME</strong>. Vui lòng bấm vào liên kết bên dưới để kích hoạt tài khoản:</p>
  <p><a href="${activationUrl}" style="color:#2563eb">Kích hoạt tài khoản</a></p>
  <p>Nếu nút không hoạt động, sao chép đường dẫn này vào trình duyệt:</p>
  <p style="word-break:break-all;color:#4b5563">${activationUrl}</p>
  <p style="color:#6b7280;font-size:13px">Liên kết chỉ có hiệu lực trong 24 giờ.</p>
</body>
</html>
`;

const sendWelcomeEmail = async (user) => {
  const to = user.email;
  const subject = 'MỘC HOME — Chào mừng bạn đến với Mộc Home';
  const html = buildWelcomeHtml(user.fullName);

  const result = await sendViaSmtp({ to, subject, html });
  if (result.sent) {
    return result;
  }

  console.log('\n========== EMAIL CHÀO MỪNG (SMTP chưa cấu hình) ==========');
  console.log(`Gửi tới: ${to}`);
  console.log(`Chào mừng: ${user.fullName}`);
  console.log('Cấu hình SMTP_HOST, SMTP_USER, SMTP_PASS trong backend/.env để gửi email thật.');
  console.log('============================================================\n');

  return { sent: false, reason: result.reason, logged: true };
};

const sendActivationEmail = async (user, activationUrl) => {
  const to = user.email;
  const subject = 'MỘC HOME — Kích hoạt tài khoản của bạn';
  const html = buildActivationHtml(user.fullName, activationUrl);

  const result = await sendViaSmtp({ to, subject, html });
  if (result.sent) {
    return result;
  }

  console.log('\n========== EMAIL KÍCH HOẠT (SMTP chưa cấu hình) ==========');
  console.log(`Gửi tới: ${to}`);
  console.log(`Liên kết kích hoạt: ${activationUrl}`);
  console.log('Cấu hình SMTP_HOST, SMTP_USER, SMTP_PASS trong backend/.env để gửi email thật.');
  console.log('===========================================================\n');

  return { sent: false, reason: result.reason, logged: true };
};

const sendPasswordResetEmail = async (user, tempPassword) => {
  const to = user.email;
  const subject = 'MỘC HOME — Mật khẩu khôi phục';
  const html = buildResetHtml(user.fullName, tempPassword);

  const result = await sendViaSmtp({ to, subject, html });
  if (result.sent) {
    return result;
  }

  console.log('\n========== KHÔI PHỤC MẬT KHẨU (SMTP chưa cấu hình) ==========');
  console.log(`Gửi tới: ${to}`);
  console.log(`Mật khẩu tạm: ${tempPassword}`);
  console.log('Cấu hình SMTP_HOST, SMTP_USER, SMTP_PASS trong backend/.env để gửi email thật.');
  console.log('============================================================\n');

  return { sent: false, reason: result.reason, logged: true };
};

const sendDebugEmail = async (to) => {
  const subject = 'MỘC HOME — Mail debug test';
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;line-height:1.5;color:#1a1d21">
  <h2>MỘC HOME — Mail debug</h2>
  <p>Nếu bạn nhận được mail này thì SMTP đã gửi thành công.</p>
</body>
</html>
`;

  const result = await sendViaSmtp({ to, subject, html });
  return {
    ...result,
    config: getSmtpDebugInfo()
  };
};

module.exports = {
  generateTempPassword,
  getSmtpDebugInfo,
  sendDebugEmail,
  sendActivationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
