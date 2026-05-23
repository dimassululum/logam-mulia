import { OrderStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../../../core/config/database';
import { env } from '../../../core/config/env';
import { sendEmail } from '../../../core/utils/email';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../core/utils/errors';
import { logger } from '../../../core/utils/logger';
import type { CreateOrderInput, UpdateOrderStatusInput } from '../schema/order.schema';

const orderInclude = {
  user: { select: { id: true, name: true, email: true, phone: true, ktpUrl: true } },
  items: { orderBy: { id: 'asc' } },
  statusLogs: { orderBy: { createdAt: 'desc' } },
  voucher: { select: { id: true, code: true } },
} satisfies Prisma.OrderInclude;

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

export async function sendNewOrderAdminNotification(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
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
    `Pesanan baru masuk: ${order.id}`,
    '',
    `Customer: ${order.user.name}`,
    `Email: ${order.user.email}`,
    `Telepon: ${order.user.phone || '-'}`,
    `Status: ${order.status}`,
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
    `Lihat detail: ${adminOrderUrl}`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 16px;">Pesanan baru masuk</h2>
      <p style="margin:0 0 16px;">Ada pesanan baru dengan nomor <strong>${escapeHtml(order.id)}</strong>.</p>
      <table style="width:100%;max-width:640px;border-collapse:collapse;margin-bottom:16px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Customer</td><td style="padding:4px 0;text-align:right;"><strong>${escapeHtml(order.user.name)}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Email</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.user.email)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Telepon</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.user.phone || '-')}</td></tr>
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
      <a href="${escapeHtml(adminOrderUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px;">Lihat Detail Pesanan</a>
    </div>
  `;

  await sendEmail({
    to: env.ADMIN_ORDER_NOTIFICATION_EMAIL,
    subject: `Pesanan baru ${order.id}`,
    html,
    text,
  });
}

export async function sendNewOrderCustomerNotification(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
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
    `Terima kasih. Pesanan kamu sudah kami terima dengan nomor ${order.id}.`,
    'Admin akan segera memproses pesanan setelah pembayaran dikonfirmasi.',
    '',
    `Status: ${order.status}`,
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
      <p style="margin:0 0 16px;">Terima kasih. Pesanan kamu dengan nomor <strong>${escapeHtml(order.id)}</strong> sudah masuk dan akan segera diproses setelah pembayaran dikonfirmasi.</p>
      <table style="width:100%;max-width:640px;border-collapse:collapse;margin-bottom:16px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Status</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.status)}</td></tr>
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
    subject: `Pesanan ${order.id} sudah diterima`,
    html,
    text,
  });
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
    paymentMethod: 'Virtual Account',
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

export async function getAllOrders() {
  const orders = await prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });

  return orders.map(mapOrder);
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
          note: 'Pesanan dibuat dari checkout customer.',
        },
      },
    },
    include: orderInclude,
  });

  const mappedOrder = mapOrder(order);

  try {
    await sendNewOrderAdminNotification(order);
  } catch (error) {
    logger.error('Failed to send admin new order notification', {
      orderId: order.id,
      error: error instanceof Error ? error.message : error,
    });
  }

  try {
    await sendNewOrderCustomerNotification(order);
  } catch (error) {
    logger.error('Failed to send customer new order notification', {
      orderId: order.id,
      customerEmail: order.user.email,
      error: error instanceof Error ? error.message : error,
    });
  }

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

export async function markOrderPaid(id: string, userId: string, role: Role) {
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Pesanan');

  const canUpdate = existing.userId === userId || role === Role.ADMIN || role === Role.SUPER_ADMIN;
  if (!canUpdate) {
    throw new ForbiddenError('Anda tidak memiliki akses ke pesanan ini');
  }

  return updateOrderStatus(id, { status: OrderStatus.PAID });
}
