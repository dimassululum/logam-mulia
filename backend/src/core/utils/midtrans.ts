import crypto from 'crypto';
import { env } from '../config/env';
import { CustomError } from '../middlewares/error.middleware';

export interface MidtransTransactionDetails {
  order_id: string;
  gross_amount: number;
}

export interface MidtransItemDetails {
  id: string;
  price: number;
  quantity: number;
  name: string;
  category?: string;
  merchant_name?: string;
  url?: string;
  image_url?: string;
}

export interface MidtransCustomerDetails {
  first_name: string;
  last_name?: string;
  email: string;
  phone: string;
  billing_address?: {
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address: string;
    city: string;
    postal_code: string;
    country_code?: string;
  };
  shipping_address?: {
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address: string;
    city: string;
    postal_code: string;
    country_code?: string;
  };
}

export interface MidtransTransactionRequest {
  transaction_details: MidtransTransactionDetails;
  item_details?: MidtransItemDetails[];
  customer_details?: MidtransCustomerDetails;
  enabled_payments?: string[];
  payment_type?: string;
  bank_transfer?: {
    bank?: string;
    va_number?: string;
    free_text?: {
      inquiry?: {
        id?: string;
        en?: string;
      };
      payment?: {
        id?: string;
        en?: string;
      };
    };
  };
  echannel?: {
    bill_info?: {
      bill_info1?: string;
      bill_info2?: string;
      bill_info3?: string;
    };
  };
  cstore?: {
    store?: string;
    message?: string;
  };
  credit_card?: {
    secure?: boolean;
    channel?: string;
    bank?: string;
    installment?: {
      required?: boolean;
      terms?: {
        [key: string]: number[];
      };
    };
    whitelist_bins?: string[];
  };
  bca_klikbca?: {
    description?: string;
  };
  bca_klikpay?: {
    description?: string;
  };
  bri_epay?: {
    description?: string;
  };
  cimb_clicks?: {
    description?: string;
  };
  danamon_online?: {
    description?: string;
  };
  gopay?: {
    enable_callback?: boolean;
    callback_url?: string;
    deep_link_redirect?: boolean;
  };
  indomaret?: {
    description?: string;
    message?: string;
  };
  shopeepay?: {
    enable_callback?: boolean;
    callback_url?: string;
    deep_link_redirect?: boolean;
  };
  uob_ezpay?: {
    description?: string;
  };
  qris?: {
    acquirer?: string;
    qris_string?: string;
    mpm_prefix?: string;
  };
  expiry?: {
    start_time?: string;
    unit?: string;
    duration?: number;
  };
  callback_url?: string;
  redirect_url?: string;
  reattempt?: boolean;
  skip_page?: boolean;
  language?: string;
  custom_field1?: string;
  custom_field2?: string;
  custom_field3?: string;
}

export interface MidtransChargeResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  approval_code?: string;
  signature_key?: string;
  bank?: string;
  va_numbers?: Array<{
    bank: string;
    va_number: string;
  }>;
  permata_va_number?: string;
  biller_code?: string;
  bill_key?: string;
  pdf_url?: string;
  finish_redirect_url?: string;
  bca_va_number?: string;
  actions?: Array<{
    name: string;
    method: string;
    url: string;
  }>;
  qr_code?: string;
  deeplink_redirect?: string;
}

export interface MidtransNotification {
  transaction_status: string;
  fraud_status?: string;
  order_id: string;
  status_code: string;
  status_message: string;
  transaction_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  approval_code?: string;
  signature_key: string;
  bank?: string;
  va_numbers?: Array<{
    bank: string;
    va_number: string;
  }>;
  permata_va_number?: string;
  biller_code?: string;
  bill_key?: string;
  pdf_url?: string;
  finish_redirect_url?: string;
  bca_va_number?: string;
  custom_field1?: string;
  custom_field2?: string;
  custom_field3?: string;
  custom_field4?: string;
  custom_field5?: string;
}

export class MidtransService {
  private static getBaseUrl(): string {
    return env.MIDTRANS_IS_PRODUCTION 
      ? 'https://api.midtrans.com/v2' 
      : 'https://api.sandbox.midtrans.com/v2';
  }

  private static getAuthHeader(): string {
    const auth = Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString('base64');
    return `Basic ${auth}`;
  }

  static async charge(request: MidtransTransactionRequest): Promise<MidtransChargeResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/charge`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new CustomError(`Midtrans API error: ${error}`, 500);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to process payment', 500);
    }
  }

  static async getStatus(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/${orderId}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new CustomError(`Midtrans API error: ${error}`, 500);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to get transaction status', 500);
    }
  }

  static async approve(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new CustomError(`Midtrans API error: ${error}`, 500);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to approve transaction', 500);
    }
  }

  static async cancel(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new CustomError(`Midtrans API error: ${error}`, 500);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to cancel transaction', 500);
    }
  }

  static async expire(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/${orderId}/expire`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new CustomError(`Midtrans API error: ${error}`, 500);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to expire transaction', 500);
    }
  }

  static async refund(orderId: string, amount?: number, reason?: string): Promise<any> {
    try {
      const body: any = {};
      if (amount) body.amount = amount;
      if (reason) body.reason = reason;

      const response = await fetch(`${this.getBaseUrl()}/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new CustomError(`Midtrans API error: ${error}`, 500);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to refund transaction', 500);
    }
  }

  static verifyNotification(notification: MidtransNotification): boolean {
    const { order_id, status_code, gross_amount, signature_key } = notification;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${env.MIDTRANS_SERVER_KEY}`)
      .digest('hex');
    
    return signature_key === expectedSignature;
  }

  static mapMidtransStatusToOrderStatus(midtransStatus: string): string {
    switch (midtransStatus) {
      case 'capture':
      case 'settlement':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'deny':
      case 'expire':
      case 'cancel':
        return 'Cancelled';
      case 'refund':
      case 'partial_refund':
        return 'Refunded';
      default:
        return 'Pending';
    }
  }

  static createTransactionRequest(
    orderId: string,
    amount: number,
    items: MidtransItemDetails[],
    customer: MidtransCustomerDetails,
    paymentMethods?: string[]
  ): MidtransTransactionRequest {
    return {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      item_details: items,
      customer_details: customer,
      enabled_payments: paymentMethods || [
        'credit_card',
        'gopay',
        'shopeepay',
        'qris',
        'bank_transfer',
        'echannel',
        'bca_klikbca',
        'bca_klikpay',
        'bri_epay',
        'cimb_clicks',
        'danamon_online',
        'indomaret',
        'alfamart',
      ],
      callbacks: {
        finish: `${env.FRONTEND_URL}/payment/finish`,
        error: `${env.FRONTEND_URL}/payment/error`,
        pending: `${env.FRONTEND_URL}/payment/pending`,
      },
    };
  }
}

export default MidtransService;
