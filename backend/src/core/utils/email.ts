import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { CustomError } from '../middlewares/error.middleware';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface OrderEmailData {
  userName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  totalAmount: number;
  shippingCost: number;
  discountAmount: number;
  grandTotal: number;
  shippingAddress: {
    recipientName: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
  };
}

export interface PaymentEmailData {
  userName: string;
  orderNumber: string;
  paymentMethod: string;
  amount: number;
  paymentStatus: string;
}

export interface ShippingEmailData {
  userName: string;
  orderNumber: string;
  courier: string;
  trackingNumber: string;
  estimatedDelivery: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter;

  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransporter({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE, // true for 465, false for other ports
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
        },
      });
    }
    return this.transporter;
  }

  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const transporter = this.getTransporter();
      
      const mailOptions = {
        from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new CustomError('Failed to send email', 500);
    }
  }

  static async sendWelcomeEmail(userName: string, userEmail: string): Promise<void> {
    const subject = 'Selamat Datang di Logam Mulia Antam!';
    const html = this.getWelcomeEmailTemplate(userName);
    
    await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  static async sendOrderConfirmationEmail(data: OrderEmailData, userEmail: string): Promise<void> {
    const subject = `Konfirmasi Pesanan #${data.orderNumber}`;
    const html = this.getOrderConfirmationTemplate(data);
    
    await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  static async sendPaymentSuccessEmail(data: PaymentEmailData, userEmail: string): Promise<void> {
    const subject = `Pembayaran Berhasil #${data.orderNumber}`;
    const html = this.getPaymentSuccessTemplate(data);
    
    await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  static async sendShippingNotificationEmail(data: ShippingEmailData, userEmail: string): Promise<void> {
    const subject = `Pesanan #${data.orderNumber} Sedang Dikirim`;
    const html = this.getShippingNotificationTemplate(data);
    
    await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  static async sendOrderCompletionEmail(data: OrderEmailData, userEmail: string): Promise<void> {
    const subject = `Pesanan #${data.orderNumber} Selesai`;
    const html = this.getOrderCompletionTemplate(data);
    
    await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  static async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<void> {
    const subject = 'Reset Password - Logam Mulia Antam';
    const html = this.getPasswordResetTemplate(resetToken);
    
    await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  private static getWelcomeEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Selamat Datang di Logam Mulia Antam</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6c757d; }
          .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .highlight { color: #007bff; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Selamat Datang, ${userName}!</h1>
            <p>Terima kasih telah bergabung dengan Logam Mulia Antam</p>
          </div>
          <div class="content">
            <h2>🎉 Selamat Datang di Logam Mulia Antam!</h2>
            <p>Halo <span class="highlight">${userName}</span>,</p>
            <p>Terima kasih telah mendaftar di Logam Mulia Antam. Kami adalah platform terpercaya untuk pembelian logam mulia berkualitas tinggi.</p>
            
            <h3>🛍️ Apa yang bisa Anda lakukan sekarang?</h3>
            <ul>
              <li>Jelajahi koleksi emas 24K berkualitas</li>
              <li>Dapatkan penawaran menarik dengan voucher dan promo</li>
              <li>Pesan dengan mudah dan aman</li>
              <li>Pembayaran terintegrasi dengan berbagai metode</li>
            </ul>
            
            <a href="${env.FRONTEND_URL || 'http://localhost:3000'}/products" class="btn">
              Mulai Belanja Sekarang
            </a>
            
            <p>Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi kami di:</p>
            <p>📧 Email: support@logam-mulia-antam.com<br>
               📞 WhatsApp: +62 812-3456-7890</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Logam Mulia Antam. All rights reserved.</p>
            <p>Jl. Emas No. 123, Jakarta, Indonesia</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getOrderConfirmationTemplate(data: OrderEmailData): string {
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Rp ${item.price.toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Rp ${item.subtotal.toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Konfirmasi Pesanan</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6c757d; }
          .order-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .total-row { font-weight: bold; border-top: 2px solid #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f8f9fa; padding: 10px; text-align: left; border-bottom: 2px solid #333; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .highlight { color: #28a745; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pesanan Anda Telah Dibuat!</h1>
            <p>Terima kasih atas pesanan Anda</p>
          </div>
          <div class="content">
            <h2>📋 Detail Pesanan #${data.orderNumber}</h2>
            <p>Halo <span class="highlight">${data.userName}</span>,</p>
            <p>Pesanan Anda telah berhasil dibuat. Berikut adalah detail pesanan Anda:</p>
            
            <div class="order-info">
              <strong>No. Pesanan:</strong> ${data.orderNumber}<br>
              <strong>Status:</strong> Menunggu Pembayaran<br>
              <strong>Tanggal:</strong> ${new Date().toLocaleDateString('id-ID')}
            </div>
            
            <h3>🛍️ Item Pesanan</h3>
            <table>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Harga</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="text-align: right; margin: 20px 0;">
              <p>Subtotal: Rp ${data.totalAmount.toLocaleString()}</p>
              <p>Biaya Pengiriman: Rp ${data.shippingCost.toLocaleString()}</p>
              ${data.discountAmount > 0 ? `<p>Diskon: -Rp ${data.discountAmount.toLocaleString()}</p>` : ''}
              <p class="highlight" style="font-size: 18px;">Total: Rp ${data.grandTotal.toLocaleString()}</p>
            </div>
            
            <h3>🚚 Alamat Pengiriman</h3>
            <div class="order-info">
              <strong>${data.shippingAddress.recipientName}</strong><br>
              ${data.shippingAddress.address}<br>
              ${data.shippingAddress.city}, ${data.shippingAddress.province}<br>
              ${data.shippingAddress.postalCode}<br>
              📞 ${data.shippingAddress.phone}
            </div>
            
            <p>Silakan selesaikan pembayaran Anda untuk melanjutkan proses pengiriman.</p>
            <a href="${env.FRONTEND_URL || 'http://localhost:3000'}/orders/${data.orderNumber}" class="btn" style="background: #28a745;">
              Lihat Detail Pesanan
            </a>
          </div>
          <div class="footer">
            <p>&copy; 2026 Logam Mulia Antam. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getPaymentSuccessTemplate(data: PaymentEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pembayaran Berhasil</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6c757d; }
          .payment-info { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #c3e6cb; }
          .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .highlight { color: #28a745; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Pembayaran Berhasil!</h1>
            <p>Terima kasih, pembayaran Anda telah kami terima</p>
          </div>
          <div class="content">
            <h2>✅ Konfirmasi Pembayaran</h2>
            <p>Halo <span class="highlight">${data.userName}</span>,</p>
            <p>Pembayaran untuk pesanan <strong>#${data.orderNumber}</strong> telah berhasil diproses.</p>
            
            <div class="payment-info">
              <strong>Detail Pembayaran:</strong><br>
              Metode Pembayaran: ${data.paymentMethod}<br>
              Jumlah: Rp ${data.amount.toLocaleString()}<br>
              Status: <span class="highlight">${data.paymentStatus}</span><br>
              Tanggal: ${new Date().toLocaleDateString('id-ID')}
            </div>
            
            <p>Pesanan Anda sekarang sedang diproses dan akan segera dikirim. Kami akan mengirimkan notifikasi lagi ketika pesanan dikirim.</p>
            
            <a href="${env.FRONTEND_URL || 'http://localhost:3000'}/orders/${data.orderNumber}" class="btn">
              Lihat Status Pesanan
            </a>
            
            <p>Terima kasih telah berbelanja di Logam Mulia Antam!</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Logam Mulia Antam. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getShippingNotificationTemplate(data: ShippingEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pesanan Dikirim</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6c757d; }
          .tracking-info { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #bee5eb; }
          .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .highlight { color: #007bff; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚚 Pesanan Anda Sedang Dikirim!</h1>
            <p>Pesanan #${data.orderNumber} telah dikirim</p>
          </div>
          <div class="content">
            <h2>📦 Notifikasi Pengiriman</h2>
            <p>Halo <span class="highlight">${data.userName}</span>,</p>
            <p>Pesanan Anda telah dikirim! Berikut adalah informasi pengiriman:</p>
            
            <div class="tracking-info">
              <strong>Informasi Pengiriman:</strong><br>
              Kurir: ${data.courier}<br>
              No. Resi: <span class="highlight">${data.trackingNumber}</span><br>
              Estimasi Pengiriman: ${data.estimatedDelivery}<br>
              Status: Sedang Dikirim
            </div>
            
            <p>Anda dapat melacak status pengiriman Anda menggunakan nomor resi di atas.</p>
            
            <a href="${env.FRONTEND_URL || 'http://localhost:3000'}/orders/${data.orderNumber}" class="btn">
              Lacak Pesanan
            </a>
            
            <p>Terima kasih telah berbelanja di Logam Mulia Antam!</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Logam Mulia Antam. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getOrderCompletionTemplate(data: OrderEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pesanan Selesai</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6c757d; }
          .completion-info { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #c3e6cb; }
          .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .highlight { color: #28a745; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Pesanan Selesai!</h1>
            <p>Terima kasih, pesanan Anda telah diterima</p>
          </div>
          <div class="content">
            <h2>✅ Pesanan #${data.orderNumber} Selesai</h2>
            <p>Halo <span class="highlight">${data.userName}</span>,</p>
            <p>Kami senang menginformasikan bahwa pesanan Anda telah berhasil diselesaikan dan diterima.</p>
            
            <div class="completion-info">
              <strong>Ringkasan Pesanan:</strong><br>
              No. Pesanan: ${data.orderNumber}<br>
              Total: Rp ${data.grandTotal.toLocaleString()}<br>
              Status: <span class="highlight">Selesai</span><br>
              Tanggal Selesai: ${new Date().toLocaleDateString('id-ID')}
            </div>
            
            <h3>💡 Bagaimana Pengalaman Anda?</h3>
            <p>Kami sangat menghargai feedback Anda. Silakan berikan review untuk produk yang Anda beli:</p>
            <a href="${env.FRONTEND_URL || 'http://localhost:3000'}/orders/${data.orderNumber}/review" class="btn">
              Berikan Review
            </a>
            
            <p>Terima kasih telah mempercayai Logam Mulia Antam untuk kebutuhan logam mulia Anda. Kami berharap dapat melayani Anda lagi di masa depan!</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Logam Mulia Antam. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getPasswordResetTemplate(resetToken: string): string {
    const resetUrl = `${env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6c757d; }
          .btn { display: inline-block; padding: 12px 24px; background: #ffc107; color: #333; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeaa7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Password</h1>
            <p>Permintaan reset password Anda</p>
          </div>
          <div class="content">
            <h2>Reset Password Akun Anda</h2>
            <p>Kami menerima permintaan untuk reset password akun Anda. Klik tombol di bawah untuk membuat password baru:</p>
            
            <a href="${resetUrl}" class="btn">
              Reset Password
            </a>
            
            <div class="warning">
              <strong>⚠️ Penting:</strong>
              <ul>
                <li>Link ini akan kadaluarsa dalam 24 jam</li>
                <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
                <li>Jangan bagikan link ini dengan orang lain</li>
              </ul>
            </div>
            
            <p>Jika tombol tidak berfungsi, salin dan paste link ini di browser Anda:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Logam Mulia Antam. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default EmailService;
