import Razorpay from 'razorpay';

// Lazy initialization of Razorpay instance
let razorpayInstance: Razorpay | null = null;

export const getRazorpayInstance = (): Razorpay => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay API keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.');
    }
    
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  
  return razorpayInstance;
};

// Payment configuration
export const PAYMENT_CONFIG = {
  currency: 'INR',
  amount: 3000, // Amount in paise (₹30.00)
  description: 'Quiz Access Payment - Thinkify',
  company: {
    name: 'Thinkify',
    logo: '/logo.png', // Add your logo URL
  },
  theme: {
    color: '#3B82F6', // Blue theme
  },
  prefill: {
    email: '',
    contact: '',
    name: '',
  },
  notes: {
    platform: 'Thinkify Quiz Platform',
  },
};

// Razorpay order interface
export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

// Payment verification interface
export interface RazorpayPaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Payment response interface for frontend
export interface PaymentResponse {
  success: boolean;
  message: string;
  orderId?: string;
  error?: string;
}

// Utility function to create payment receipt
export function generatePaymentReceipt(userId: string, quizId: string): string {
  const timestamp = Date.now();
  return `quiz_${quizId.slice(-8)}_${userId.slice(-8)}_${timestamp}`;
}

// Utility function to verify payment signature
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(orderId + '|' + paymentId)
    .digest('hex');
  
  return expectedSignature === signature;
}

// Error handler for Razorpay errors
export function handleRazorpayError(error: any): PaymentResponse {
  console.error('Razorpay Error:', error);
  
  if (error.error?.code) {
    switch (error.error.code) {
      case 'BAD_REQUEST_ERROR':
        return {
          success: false,
          message: 'Invalid payment request. Please try again.',
          error: error.error.description,
        };
      case 'GATEWAY_ERROR':
        return {
          success: false,
          message: 'Payment gateway error. Please try again later.',
          error: error.error.description,
        };
      case 'SERVER_ERROR':
        return {
          success: false,
          message: 'Server error. Please contact support.',
          error: error.error.description,
        };
      default:
        return {
          success: false,
          message: 'Payment failed. Please try again.',
          error: error.error.description,
        };
    }
  }
  
  return {
    success: false,
    message: 'An unexpected error occurred. Please try again.',
    error: error.message || 'Unknown error',
  };
}

// Frontend Razorpay options interface
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayPaymentVerification) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
} 