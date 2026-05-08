import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthenticatedRequest } from '../core/middlewares/auth.middleware';
import { CustomError } from '../core/middlewares/error.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';
import { paymentRequestSchema } from '../core/validations/order.validation';
import MidtransService, { MidtransNotification } from '../core/utils/midtrans';
import EmailService, { PaymentEmailData, ShippingEmailData } from '../core/utils/email';

const router = Router();

// POST /api/payments/charge - Create payment charge
router.post('/charge', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const validatedData = paymentRequestSchema.parse(req.body);
  const { orderId, paymentMethod } = validatedData;

  // Get order details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  // Check if user owns the order
  if (order.userId !== userId) {
    throw new CustomError('Unauthorized', 403);
  }

  // Check if order is in correct status
  if (order.status !== 'PENDING') {
    throw new CustomError('Order cannot be paid for', 400);
  }

  // Check if payment already exists
  if (order.midtransTransactionId) {
    throw new CustomError('Payment already initiated for this order', 400);
  }

  // Prepare Midtrans request
  const items = order.items.map(item => ({
    id: item.productId,
    price: Number(item.priceAtPurchase),
    quantity: item.quantity,
    name: item.product.name,
    category: 'Gold Jewelry',
  }));

  const customerDetails = {
    first_name: order.user.name.split(' ')[0],
    last_name: order.user.name.split(' ').slice(1).join(' ') || undefined,
    email: order.user.email,
    phone: order.user.phone || '',
    shipping_address: JSON.parse(order.shippingAddress),
  };

  let paymentRequest: any;

  switch (paymentMethod) {
    case 'bank_transfer':
      paymentRequest = {
        payment_type: 'bank_transfer',
        bank_transfer: {
          bank: 'bca',
        },
      };
      break;
    case 'credit_card':
      paymentRequest = {
        payment_type: 'credit_card',
        credit_card: {
          secure: true,
        },
      };
      break;
    case 'gopay':
      paymentRequest = {
        payment_type: 'gopay',
      };
      break;
    case 'shopeepay':
      paymentRequest = {
        payment_type: 'shopeepay',
      };
      break;
    case 'qris':
      paymentRequest = {
        payment_type: 'qris',
      };
      break;
    default:
      throw new CustomError('Invalid payment method', 400);
  }

  const transactionRequest = {
    transaction_details: {
      order_id: order.id,
      gross_amount: Number(order.grandTotal),
    },
    item_details: items,
    customer_details: customerDetails,
    ...paymentRequest,
    callbacks: {
      finish: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/finish`,
      error: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/error`,
      pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/pending`,
    },
  };

  // Create charge with Midtrans
  const chargeResponse = await MidtransService.charge(transactionRequest);

  // Update order with Midtrans transaction ID
  await prisma.order.update({
    where: { id: orderId },
    data: {
      midtransTransactionId: chargeResponse.transaction_id,
    },
  });

  res.json({
    message: 'Payment charge created successfully',
    payment: {
      orderId: order.id,
      transactionId: chargeResponse.transaction_id,
      paymentType: chargeResponse.payment_type,
      status: chargeResponse.transaction_status,
      grossAmount: chargeResponse.gross_amount,
      redirectUrl: chargeResponse.redirect_url,
      actions: chargeResponse.actions,
      vaNumbers: chargeResponse.va_numbers,
      qrCode: chargeResponse.qr_code,
      deeplinkRedirect: chargeResponse.deeplink_redirect,
    },
  });
}));

// GET /api/payments/status/:orderId - Get payment status
router.get('/status/:orderId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { orderId } = req.params;

  // Get order details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  });

  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  // Check if user owns the order or is admin
  if (order.userId !== userId && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
    throw new CustomError('Unauthorized', 403);
  }

  // Get status from Midtrans if transaction ID exists
  let midtransStatus = null;
  if (order.midtransTransactionId) {
    midtransStatus = await MidtransService.getStatus(order.midtransTransactionId);
    
    // Update order status based on Midtrans response
    if (midtransStatus.transaction_status && midtransStatus.transaction_status !== order.status) {
      const newStatus = MidtransService.mapMidtransStatusToOrderStatus(midtransStatus.transaction_status);
      
      await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });
      
      order.status = newStatus;
    }
  }

  res.json({
    orderId: order.id,
    status: order.status,
    midtransStatus,
    midtransTransactionId: order.midtransTransactionId,
    totalAmount: order.grandTotal,
  });
}));

// POST /api/payments/webhook - Midtrans webhook handler
router.post('/webhook', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const notification = req.body as MidtransNotification;

  // Verify webhook signature
  if (!MidtransService.verifyNotification(notification)) {
    throw new CustomError('Invalid webhook signature', 400);
  }

  // Get order details
  const order = await prisma.order.findUnique({
    where: { id: notification.order_id },
    include: {
      items: true,
    },
  });

  if (!order) {
    console.log(`Order ${notification.order_id} not found`);
    res.status(200).json({ message: 'Order not found' });
    return;
  }

  // Update order status
  const newStatus = MidtransService.mapMidtransStatusToOrderStatus(notification.transaction_status);
  
  const updatedOrder = await prisma.order.update({
    where: { id: notification.order_id },
    data: { 
      status: newStatus,
      midtransTransactionId: notification.transaction_id,
    },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Handle order cancellation/refund - restore stock
  if (['CANCELLED', 'REFUNDED'].includes(newStatus)) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }
  }

  // Send email notifications based on status
  try {
    if (newStatus === 'Confirmed') {
      // Send payment success email
      const paymentData: PaymentEmailData = {
        userName: updatedOrder.user.name,
        orderNumber: updatedOrder.id,
        paymentMethod: notification.payment_type,
        amount: Number(updatedOrder.grandTotal),
        paymentStatus: 'Berhasil',
      };
      
      EmailService.sendPaymentSuccessEmail(paymentData, updatedOrder.user.email).catch(error => {
        console.error('Failed to send payment success email:', error);
      });
    } else if (newStatus === 'PROCESSING') {
      // Send shipping notification email
      const shippingData: ShippingEmailData = {
        userName: updatedOrder.user.name,
        orderNumber: updatedOrder.id,
        courier: updatedOrder.shippingCourier || 'JNE',
        trackingNumber: updatedOrder.trackingNumber || 'Sedang disiapkan',
        estimatedDelivery: '2-3 hari kerja',
      };
      
      EmailService.sendShippingNotificationEmail(shippingData, updatedOrder.user.email).catch(error => {
        console.error('Failed to send shipping notification email:', error);
      });
    } else if (newStatus === 'DELIVERED') {
      // Send order completion email
      const orderData = {
        userName: updatedOrder.user.name,
        orderNumber: updatedOrder.id,
        items: updatedOrder.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.priceAtPurchase),
          subtotal: Number(item.subtotal),
        })),
        totalAmount: Number(updatedOrder.totalAmount),
        shippingCost: Number(updatedOrder.shippingCost),
        discountAmount: Number(updatedOrder.discountAmount),
        grandTotal: Number(updatedOrder.grandTotal),
        shippingAddress: JSON.parse(updatedOrder.shippingAddress),
      };
      
      EmailService.sendOrderCompletionEmail(orderData, updatedOrder.user.email).catch(error => {
        console.error('Failed to send order completion email:', error);
      });
    }
  } catch (emailError) {
    console.error('Email notification failed:', emailError);
    // Don't fail the webhook if email fails
  }

  console.log(`Order ${notification.order_id} status updated to ${newStatus}`);
  
  res.status(200).json({ message: 'Webhook processed successfully' });
}));

// POST /api/payments/cancel/:orderId - Cancel payment
router.post('/cancel/:orderId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { orderId } = req.params;

  // Get order details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  // Check if user owns the order
  if (order.userId !== userId) {
    throw new CustomError('Unauthorized', 403);
  }

  // Check if order can be cancelled
  if (!['PENDING', 'Confirmed'].includes(order.status)) {
    throw new CustomError('Order cannot be cancelled', 400);
  }

  // Cancel with Midtrans if transaction exists
  if (order.midtransTransactionId) {
    await MidtransService.cancel(order.midtransTransactionId);
  }

  // Update order status and restore stock
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    // Restore product stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }
  });

  res.json({
    message: 'Payment cancelled successfully',
  });
}));

// GET /api/payments/methods - Get available payment methods
router.get('/methods', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const methods = [
    {
      code: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Transfer via ATM, Internet Banking, or Mobile Banking',
      banks: ['bca', 'bni', 'bri', 'mandiri', 'permata', 'cimb', 'danamon'],
    },
    {
      code: 'credit_card',
      name: 'Credit Card',
      description: 'Pay with Visa, Mastercard, or JCB',
    },
    {
      code: 'gopay',
      name: 'GoPay',
      description: 'Pay with GoPay wallet',
    },
    {
      code: 'shopeepay',
      name: 'ShopeePay',
      description: 'Pay with ShopeePay wallet',
    },
    {
      code: 'qris',
      name: 'QRIS',
      description: 'Pay with QRIS (QR Code Indonesian Standard)',
    },
    {
      code: 'indomaret',
      name: 'Indomaret',
      description: 'Pay at Indomaret stores',
    },
    {
      code: 'alfamart',
      name: 'Alfamart',
      description: 'Pay at Alfamart stores',
    },
  ];

  res.json({
    methods,
  });
}));

export default router;
