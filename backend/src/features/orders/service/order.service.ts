import { OrderStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../../../core/config/database';
import { env } from '../../../core/config/env';
import { sendEmail } from '../../../core/utils/email';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../core/utils/errors';
import { logger } from '../../../core/utils/logger';
import { resolveActivePaymentMethodForOrder } from '../../payment-methods/service/payment-method.service';
import type { CreateOrderInput, UpdateOrderStatusInput } from '../schema/order.schema';

const orderInclude = {
  user: { select: { id: true, name: true, email: true, phone: true, ktpUrl: true } },
  items: { orderBy: { id: 'asc' } },
  statusLogs: { orderBy: { createdAt: 'desc' } },
  voucher: { select: { id: true, code: true } },
  paymentMethodRef: { select: { code: true, category: true, config: true } },
} satisfies Prisma.OrderInclude;

const orderListInclude = {
  user: { select: { id: true, name: true, email: true, phone: true, ktpUrl: true } },
  items: { select: { id: true, productName: true, quantity: true }, orderBy: { id: 'asc' } },
} satisfies Prisma.OrderInclude;

interface GetAllOrdersInput {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  status?: string;
  shipping?: string;
}

function toMoney(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function nextOrderId() {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}${Math.floor(Math.random() * 1000)}`
    .padStart(9, '0')
    .slice(-6);
  return `INV-${ymd}-${suffix}`;
}

function getPrimaryItem(order: any) {
  return order.items[0]?.productName || '-';
}

function getItemCount(order: any) {
  return order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
}

function mapPublicStatus(status: OrderStatus) {
  if (status === OrderStatus.COMPLETED) {
    return 'selesai';
  }
  if (status === OrderStatus.REFUND) {
    return 'refund';
  }
  if (status === OrderStatus.PAID || status === OrderStatus.PROCESSING || status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED) {
    return 'success';
  }
  if (status === OrderStatus.CANCELLED) {
    return 'canceled';
  }
  return 'pending';
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendPaymentProofAdminNotification(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
  const subtotalAmount = order.items.reduce((sum, item) => sum + toMoney(item.subtotal), 0);
  const shippingFee = toMoney(order.shippingCost);
  const voucherAmount = toMoney(order.discountAmount);
  const grandTotalAmount = toMoney(order.grandTotal);
  const deliveryMethod = order.shippingCourier === 'SELFPICKUP' ? 'Self Pickup' : order.shippingCourier || 'Ekspedisi';
  const adminOrderUrl = `${env.FRONTEND_URL}/admin/orders/${encodeURIComponent(order.id)}`;
  const itemLines = order.items.map((item) => {
    const line = `${item.productName} x${item.quantity} - ${formatRupiah(toMoney(item.subtotal))}`;
    return `- ${line}`;
  });
  const htmlItems = order.items
    .map((item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.productName)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatRupiah(toMoney(item.subtotal)))}</td>
      </tr>
    `)
    .join('');

  const text = [
    `Bukti pembayaran baru masuk: ${order.id}`,
    '',
    `Customer: ${order.user.name}`,
    `Email: ${order.user.email}`,
    `Telepon: ${order.user.phone || '-'}`,
    `Status: ${order.status}`,
    `Metode Pembayaran: ${order.paymentMethod}`,
    `Pengiriman: ${deliveryMethod}${order.shippingService ? ` - ${order.shippingService}` : ''}`,
    `Alamat: ${order.shippingAddress}`,
    '',
    'Item:',
    ...itemLines,
    '',
    `Subtotal: ${formatRupiah(subtotalAmount)}`,
    `Ongkir: ${formatRupiah(shippingFee)}`,
    `Diskon: ${formatRupiah(voucherAmount)}`,
    `Total: ${formatRupiah(grandTotalAmount)}`,
    '',
    `Lihat dan verifikasi pembayaran: ${adminOrderUrl}`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 16px;">Bukti pembayaran baru masuk</h2>
      <p style="margin:0 0 16px;">Customer sudah mengupload bukti pembayaran untuk pesanan <strong>${escapeHtml(order.id)}</strong>. Mohon verifikasi pembayaran dari admin order detail.</p>
      <table style="width:100%;max-width:640px;border-collapse:collapse;margin-bottom:16px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Customer</td><td style="padding:4px 0;text-align:right;"><strong>${escapeHtml(order.user.name)}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Email</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.user.email)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Telepon</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.user.phone || '-')}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Metode Pembayaran</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.paymentMethod)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Pengiriman</td><td style="padding:4px 0;text-align:right;">${escapeHtml(deliveryMethod)}${order.shippingService ? ` - ${escapeHtml(order.shippingService)}` : ''}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Alamat</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.shippingAddress)}</td></tr>
      </table>
      <table style="width:100%;max-width:640px;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="padding:8px 0;border-bottom:1px solid #d1d5db;text-align:left;">Produk</th>
            <th style="padding:8px 0;border-bottom:1px solid #d1d5db;text-align:center;">Qty</th>
            <th style="padding:8px 0;border-bottom:1px solid #d1d5db;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${htmlItems}</tbody>
      </table>
      <table style="width:100%;max-width:640px;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Subtotal</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatRupiah(subtotalAmount))}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Ongkir</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatRupiah(shippingFee))}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Diskon</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatRupiah(voucherAmount))}</td></tr>
        <tr><td style="padding:8px 0;border-top:1px solid #d1d5db;font-weight:bold;">Total</td><td style="padding:8px 0;border-top:1px solid #d1d5db;text-align:right;font-weight:bold;">${escapeHtml(formatRupiah(grandTotalAmount))}</td></tr>
      </table>
      <a href="${escapeHtml(adminOrderUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px;">Verifikasi Pembayaran</a>
    </div>
  `;

  await sendEmail({
    to: env.ADMIN_ORDER_NOTIFICATION_EMAIL,
    subject: `Bukti pembayaran ${order.id} menunggu verifikasi`,
    html,
    text,
  });
}

export async function sendPaymentProofCustomerNotification(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
  const subtotalAmount = order.items.reduce((sum, item) => sum + toMoney(item.subtotal), 0);
  const shippingFee = toMoney(order.shippingCost);
  const voucherAmount = toMoney(order.discountAmount);
  const grandTotalAmount = toMoney(order.grandTotal);
  const deliveryMethod = order.shippingCourier === 'SELFPICKUP' ? 'Self Pickup' : order.shippingCourier || 'Ekspedisi';
  const customerOrderUrl = `${env.FRONTEND_URL}/orders/${encodeURIComponent(order.id)}`;
  const itemLines = order.items.map((item) => {
    const line = `${item.productName} x${item.quantity} - ${formatRupiah(toMoney(item.subtotal))}`;
    return `- ${line}`;
  });
  const htmlItems = order.items
    .map((item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.productName)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatRupiah(toMoney(item.subtotal)))}</td>
      </tr>
    `)
    .join('');

  const text = [
    `Halo ${order.user.name},`,
    '',
    `Terima kasih. Bukti pembayaran untuk pesanan ${order.id} sudah kami terima.`,
    'Admin akan memverifikasi pembayaran kamu terlebih dahulu.',
    '',
    `Status: ${order.status}`,
    `Metode Pembayaran: ${order.paymentMethod}`,
    `Pengiriman: ${deliveryMethod}${order.shippingService ? ` - ${order.shippingService}` : ''}`,
    `Alamat: ${order.shippingAddress}`,
    '',
    'Item:',
    ...itemLines,
    '',
    `Subtotal: ${formatRupiah(subtotalAmount)}`,
    `Ongkir: ${formatRupiah(shippingFee)}`,
    `Diskon: ${formatRupiah(voucherAmount)}`,
    `Total: ${formatRupiah(grandTotalAmount)}`,
    '',
    `Cek pesanan: ${customerOrderUrl}`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 16px;">Pesanan kamu sudah kami terima</h2>
      <p style="margin:0 0 8px;">Halo <strong>${escapeHtml(order.user.name)}</strong>,</p>
      <p style="margin:0 0 16px;">Terima kasih. Bukti pembayaran untuk pesanan <strong>${escapeHtml(order.id)}</strong> sudah kami terima dan sedang menunggu verifikasi admin.</p>
      <table style="width:100%;max-width:640px;border-collapse:collapse;margin-bottom:16px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Status</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.status)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Metode Pembayaran</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.paymentMethod)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Pengiriman</td><td style="padding:4px 0;text-align:right;">${escapeHtml(deliveryMethod)}${order.shippingService ? ` - ${escapeHtml(order.shippingService)}` : ''}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Alamat</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.shippingAddress)}</td></tr>
      </table>
      <table style="width:100%;max-width:640px;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="padding:8px 0;border-bottom:1px solid #d1d5db;text-align:left;">Produk</th>
            <th style="padding:8px 0;border-bottom:1px solid #d1d5db;text-align:center;">Qty</th>
            <th style="padding:8px 0;border-bottom:1px solid #d1d5db;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${htmlItems}</tbody>
      </table>
      <table style="width:100%;max-width:640px;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Subtotal</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatRupiah(subtotalAmount))}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Ongkir</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatRupiah(shippingFee))}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Diskon</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatRupiah(voucherAmount))}</td></tr>
        <tr><td style="padding:8px 0;border-top:1px solid #d1d5db;font-weight:bold;">Total</td><td style="padding:8px 0;border-top:1px solid #d1d5db;text-align:right;font-weight:bold;">${escapeHtml(formatRupiah(grandTotalAmount))}</td></tr>
      </table>
      <a href="${escapeHtml(customerOrderUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px;">Cek Pesanan</a>
    </div>
  `;

  await sendEmail({
    to: order.user.email,
    subject: `Bukti pembayaran ${order.id} sudah diterima`,
    html,
    text,
  });
}

export async function sendPaymentConfirmedCustomerNotification(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
  const subtotalAmount = order.items.reduce((sum, item) => sum + toMoney(item.subtotal), 0);
  const shippingFee = toMoney(order.shippingCost);
  const voucherAmount = toMoney(order.discountAmount);
  const grandTotalAmount = toMoney(order.grandTotal);
  const deliveryMethod = order.shippingCourier === 'SELFPICKUP' ? 'Self Pickup' : order.shippingCourier || 'Ekspedisi';
  const customerOrderUrl = `${env.FRONTEND_URL}/orders/${encodeURIComponent(order.id)}`;
  const htmlItems = order.items
    .map((item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.productName)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatRupiah(toMoney(item.subtotal)))}</td>
      </tr>
    `)
    .join('');
  const itemLines = order.items.map((item) => `- ${item.productName} x${item.quantity} - ${formatRupiah(toMoney(item.subtotal))}`);

  const text = [
    `Halo ${order.user.name},`,
    '',
    `Pembayaran untuk pesanan ${order.id} telah diterima dan pesanan sedang diproses.`,
    '',
    `Status: ${order.status}`,
    `Metode Pembayaran: ${order.paymentMethod}`,
    `Pengiriman: ${deliveryMethod}${order.shippingService ? ` - ${order.shippingService}` : ''}`,
    `Alamat: ${order.shippingAddress}`,
    '',
    'Item:',
    ...itemLines,
    '',
    `Subtotal: ${formatRupiah(subtotalAmount)}`,
    `Ongkir: ${formatRupiah(shippingFee)}`,
    `Diskon: ${formatRupiah(voucherAmount)}`,
    `Total: ${formatRupiah(grandTotalAmount)}`,
    '',
    `Cek pesanan: ${customerOrderUrl}`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 16px;">Pembayaran telah diterima</h2>
      <p style="margin:0 0 8px;">Halo <strong>${escapeHtml(order.user.name)}</strong>,</p>
      <p style="margin:0 0 16px;">Pembayaran untuk pesanan <strong>${escapeHtml(order.id)}</strong> telah diterima dan pesanan sedang diproses.</p>
      <table style="width:100%;max-width:640px;border-collapse:collapse;margin-bottom:16px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Status</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.status)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Metode Pembayaran</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.paymentMethod)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Pengiriman</td><td style="padding:4px 0;text-align:right;">${escapeHtml(deliveryMethod)}${order.shippingService ? ` - ${escapeHtml(order.shippingService)}` : ''}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Alamat</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.shippingAddress)}</td></tr>
      </table>
      <table style="width:100%;max-width:640px;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="padding:8px 0;border-bottom:1px solid #d1d5db;text-align:left;">Produk</th>
            <th style="padding:8px 0;border-bottom:1px solid #d1d5db;text-align:center;">Qty</th>
            <th style="padding:8px 0;border-bottom:1px solid #d1d5db;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${htmlItems}</tbody>
      </table>
      <table style="width:100%;max-width:640px;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Subtotal</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatRupiah(subtotalAmount))}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Ongkir</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatRupiah(shippingFee))}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Diskon</td><td style="padding:4px 0;text-align:right;">${escapeHtml(formatRupiah(voucherAmount))}</td></tr>
        <tr><td style="padding:8px 0;border-top:1px solid #d1d5db;font-weight:bold;">Total</td><td style="padding:8px 0;border-top:1px solid #d1d5db;text-align:right;font-weight:bold;">${escapeHtml(formatRupiah(grandTotalAmount))}</td></tr>
      </table>
      <a href="${escapeHtml(customerOrderUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px;">Cek Pesanan</a>
    </div>
  `;

  await sendEmail({
    to: order.user.email,
    subject: `Pembayaran ${order.id} telah diterima`,
    html,
    text,
  });
}

function queuePaymentProofNotifications(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
  setTimeout(() => {
    void Promise.allSettled([
      sendPaymentProofAdminNotification(order),
      sendPaymentProofCustomerNotification(order),
    ]).then((results) => {
      const [adminResult, customerResult] = results;

      if (adminResult.status === 'rejected') {
        logger.error('Failed to send admin payment proof notification', {
          orderId: order.id,
          error: adminResult.reason instanceof Error ? adminResult.reason.message : adminResult.reason,
        });
      } else {
        logger.info('Admin payment proof notification sent', {
          orderId: order.id,
          adminEmail: env.ADMIN_ORDER_NOTIFICATION_EMAIL,
        });
      }

      if (customerResult.status === 'rejected') {
        logger.error('Failed to send customer payment proof notification', {
          orderId: order.id,
          customerEmail: order.user.email,
          error: customerResult.reason instanceof Error ? customerResult.reason.message : customerResult.reason,
        });
      } else {
        logger.info('Customer payment proof notification sent', {
          orderId: order.id,
          customerEmail: order.user.email,
        });
      }
    });
  }, 0);
}

function queuePaymentConfirmedNotification(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
  setTimeout(() => {
    void sendPaymentConfirmedCustomerNotification(order)
      .then(() => {
        logger.info('Customer payment confirmed notification sent', {
          orderId: order.id,
          customerEmail: order.user.email,
        });
      })
      .catch((error) => {
        logger.error('Failed to send customer payment confirmed notification', {
          orderId: order.id,
          customerEmail: order.user.email,
          error: error instanceof Error ? error.message : error,
        });
      });
  }, 0);
}

export function mapOrder(order: any) {
  const subtotalAmount = order.items.reduce((sum: number, item: any) => sum + toMoney(item.subtotal), 0);
  const shippingFee = toMoney(order.shippingCost);
  const voucherAmount = toMoney(order.discountAmount);
  const grandTotalAmount = toMoney(order.grandTotal);
  const deliveryMethod = order.shippingCourier === 'SELFPICKUP' ? 'self_pickup' : 'delivery';

  return {
    id: order.id,
    customerName: order.user.name,
    customerEmail: order.user.email,
    customerPhone: order.user.phone || '',
    primaryItem: getPrimaryItem(order),
    itemCount: getItemCount(order),
    totalAmount: grandTotalAmount,
    status: mapPublicStatus(order.status),
    paymentMethodCode: order.paymentMethodCode || null,
    paymentMethod: order.paymentMethod || 'QRIS Manual',
    paymentMethodConfig: order.paymentMethodRef?.config || null,
    paymentMethodCategory: order.paymentMethodRef?.category || null,
    paymentProofUrl: order.paymentProofUrl || null,
    paymentProofUploadedAt: order.paymentProofUploadedAt || null,
    shippingMethod: deliveryMethod === 'self_pickup' ? 'Self Pickup' : order.shippingCourier || 'Ekspedisi',
    trackingNumber: order.trackingNumber,
    requiresKtp: Boolean(order.ktpImageUrl || order.user.ktpUrl),
    address: order.shippingAddress,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    subtotalAmount,
    shippingFee,
    voucherAmount,
    grandTotalAmount,
    lineItems: order.items.map((item: any) => ({
      id: item.id,
      productName: item.productName,
      productImage: item.productImage || null,
      quantity: item.quantity,
      unitPrice: toMoney(item.priceAtPurchase),
      totalPrice: toMoney(item.subtotal),
    })),
    customerDetail: {
      name: order.user.name,
      phone: order.user.phone || '',
      email: order.user.email,
    },
    recipientDetail: {
      name: order.user.name,
      phone: order.user.phone || '',
      email: order.user.email,
      province: order.shippingProvince || '-',
      city: order.shippingCity || '-',
      district: order.shippingDistrict || '-',
      village: order.shippingVillage || '-',
      address: order.shippingAddress,
      postalCode: order.shippingPostalCode || '-',
      ktpDocumentLabel: order.ktpImageUrl || order.user.ktpUrl ? 'KTP Customer' : 'KTP belum tersedia',
      ktpUrl: order.ktpImageUrl || order.user.ktpUrl || null,
    },
    receiptCode: order.trackingNumber || '-',
    receiptCreatedAt: order.createdAt,
    receiptUpdatedAt: order.updatedAt,
    fulfillmentDetail: {
      method: deliveryMethod,
      courier: order.shippingCourier || undefined,
      serviceLabel: order.shippingService || undefined,
      boutiqueName: deliveryMethod === 'self_pickup' ? order.shippingCity || 'Butik LM' : undefined,
      boutiqueAddress: deliveryMethod === 'self_pickup' ? order.shippingAddress : undefined,
      pickupCode: deliveryMethod === 'self_pickup' ? order.id.slice(-6).toUpperCase() : undefined,
      pickupWindow: deliveryMethod === 'self_pickup' ? 'Setelah pembayaran dikonfirmasi' : undefined,
      contactPerson: deliveryMethod === 'self_pickup' ? 'Admin Butik' : undefined,
      note: deliveryMethod === 'self_pickup' ? 'Bawa identitas saat pengambilan.' : undefined,
    },
    timeline: order.statusLogs.map((log: any) => ({
      id: log.id,
      title: `Status ${mapPublicStatus(log.status)}`,
      description: log.note || `Pesanan berada pada status ${mapPublicStatus(log.status)}.`,
      occurredAt: log.createdAt,
      tone: log.status === OrderStatus.CANCELLED || log.status === OrderStatus.REFUND ? 'warning' : 'info',
    })),
  };
}

function mapOrderList(order: any) {
  const deliveryMethod = order.shippingCourier === 'SELFPICKUP' ? 'self_pickup' : 'delivery';

  return {
    id: order.id,
    customerName: order.user.name,
    customerEmail: order.user.email,
    customerPhone: order.user.phone || '',
    primaryItem: getPrimaryItem(order),
    itemCount: getItemCount(order),
    totalAmount: toMoney(order.grandTotal),
    status: mapPublicStatus(order.status),
    paymentMethodCode: order.paymentMethodCode || null,
    paymentMethod: order.paymentMethod || 'QRIS Manual',
    paymentProofUrl: order.paymentProofUrl || null,
    paymentProofUploadedAt: order.paymentProofUploadedAt || null,
    shippingMethod: deliveryMethod === 'self_pickup' ? 'Self Pickup' : order.shippingCourier || 'Ekspedisi',
    trackingNumber: order.trackingNumber,
    requiresKtp: Boolean(order.ktpImageUrl || order.user.ktpUrl),
    address: order.shippingAddress,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function buildOrderWhere(input: Pick<GetAllOrdersInput, 'search' | 'status' | 'shipping'>): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  const search = input.search?.trim();

  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { phone: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (input.status && input.status !== 'all') {
    if (input.status === 'success') {
      where.status = { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] };
    } else if (input.status === 'selesai') {
      where.status = OrderStatus.COMPLETED;
    } else if (input.status === 'canceled') {
      where.status = OrderStatus.CANCELLED;
    } else if (input.status === 'refund') {
      where.status = OrderStatus.REFUND;
    } else if (input.status === 'pending') {
      where.status = OrderStatus.PENDING;
    }
  }

  if (input.shipping && input.shipping !== 'all') {
    if (input.shipping === 'Self Pickup') {
      where.shippingCourier = 'SELFPICKUP';
    } else {
      where.shippingCourier = { contains: input.shipping, mode: 'insensitive' };
    }
  }

  return where;
}

export async function getAllOrders(input: GetAllOrdersInput) {
  const where = buildOrderWhere(input);
  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderListInclude,
      orderBy: { createdAt: 'desc' },
      skip: input.skip,
      take: input.limit,
    }),
  ]);

  return {
    orders: orders.map(mapOrderList),
    total,
  };
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw new NotFoundError('Pesanan');
  return mapOrder(order);
}

export async function getOrdersByUserId(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });

  return orders.map(mapOrder);
}

export async function getOrderByIdForUser(id: string, userId: string) {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: orderInclude });
  if (!order) throw new NotFoundError('Pesanan');
  return mapOrder(order);
}

export async function createOrder(input: CreateOrderInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });
  if (!user) throw new BadRequestError('Data customer belum tersimpan. Ulangi dari halaman checkout.');
  const paymentMethod = await resolveActivePaymentMethodForOrder(input.paymentMethodCode);

  const subtotal = input.items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal + input.shippingCost - input.discountAmount);
  const id = nextOrderId();

  const order = await prisma.order.create({
    data: {
      id,
      userId: user.id,
      status: OrderStatus.PENDING,
      totalAmount: subtotal,
      shippingCost: input.shippingCost,
      discountAmount: input.discountAmount,
      grandTotal,
      paymentMethodCode: paymentMethod.code,
      paymentMethod: paymentMethod.label,
      shippingAddress: input.shippingAddress,
      shippingCity: input.deliveryType === 'butik' ? input.boutiqueName || input.shippingCity || '-' : input.shippingCity || '-',
      shippingProvince: input.shippingProvince || null,
      shippingDistrict: input.shippingDistrict || null,
      shippingVillage: input.shippingVillage || null,
      shippingPostalCode: input.shippingPostalCode || null,
      shippingCourier: input.deliveryType === 'butik' ? 'SELFPICKUP' : input.shippingCourier || null,
      shippingService: input.shippingService,
      voucherId: input.voucherId || undefined,
      ktpImageUrl: user.ktpUrl,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage || null,
          priceAtPurchase: item.priceAtPurchase,
          quantity: item.quantity,
          subtotal: item.priceAtPurchase * item.quantity,
        })),
      },
      statusLogs: {
        create: {
          status: OrderStatus.PENDING,
          note: `Pesanan dibuat dari checkout customer dengan metode ${paymentMethod.label}.`,
        },
      },
    },
    include: orderInclude,
  });

  const mappedOrder = mapOrder(order);

  return mappedOrder;
}

export async function updateOrderStatus(id: string, input: UpdateOrderStatusInput) {
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Pesanan');

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: input.status,
      ...(input.trackingNumber && { trackingNumber: input.trackingNumber }),
      statusLogs: {
        create: {
          status: input.status,
          note: input.trackingNumber
            ? `Nomor resi ${input.trackingNumber} sudah diinput.`
            : `Status pesanan diubah menjadi ${String(input.status).toLowerCase()}.`,
        },
      },
    },
    include: orderInclude,
  });

  return mapOrder(order);
}

export async function uploadPaymentProof(id: string, userId: string, file: Express.Multer.File | undefined) {
  if (!file) throw new BadRequestError('Bukti pembayaran wajib diupload.');

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Pesanan');

  if (existing.userId !== userId) {
    throw new ForbiddenError('Anda tidak memiliki akses ke pesanan ini');
  }

  if (existing.status !== OrderStatus.PENDING) {
    throw new BadRequestError('Bukti pembayaran hanya bisa diupload untuk pesanan yang masih menunggu pembayaran.');
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      paymentProofUrl: `/uploads/${file.filename}`,
      paymentProofUploadedAt: new Date(),
      statusLogs: {
        create: {
          status: OrderStatus.PENDING,
          note: `Customer mengupload bukti pembayaran ${existing.paymentMethod || 'QRIS Manual'}. Menunggu verifikasi admin.`,
        },
      },
    },
    include: orderInclude,
  });

  queuePaymentProofNotifications(order);

  return mapOrder(order);
}

export async function confirmOrderPayment(id: string, role: Role) {
  if (role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
    throw new ForbiddenError('Hanya admin yang dapat mengonfirmasi pembayaran.');
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Pesanan');

  if (!existing.paymentProofUrl) {
    throw new BadRequestError('Bukti pembayaran belum diupload customer.');
  }

  if (existing.status !== OrderStatus.PENDING) {
    throw new BadRequestError('Hanya pesanan pending yang dapat dikonfirmasi pembayarannya.');
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: OrderStatus.PAID,
      statusLogs: {
        create: {
          status: OrderStatus.PAID,
          note: `Pembayaran ${existing.paymentMethod || 'QRIS Manual'} dikonfirmasi oleh admin.`,
        },
      },
    },
    include: orderInclude,
  });

  queuePaymentConfirmedNotification(order);

  return mapOrder(order);
}
