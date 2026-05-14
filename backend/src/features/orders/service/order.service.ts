import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../core/config/database';
import { BadRequestError, NotFoundError } from '../../../core/utils/errors';
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
  if (status === OrderStatus.PAID || status === OrderStatus.PROCESSING || status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED || status === OrderStatus.COMPLETED) {
    return 'success';
  }
  if (status === OrderStatus.CANCELLED) {
    return 'canceled';
  }
  return 'pending';
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

  return mapOrder(order);
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

export async function markOrderPaid(id: string) {
  return updateOrderStatus(id, { status: OrderStatus.PAID });
}
