'use client';

import { useState, useEffect } from 'react';
import { PAYMENT_CONFIG, RazorpayOptions, RazorpayPaymentVerification } from '@/lib/razorpay';

interface RazorpayPaymentProps {
  quizId: string;
  userId: string;
  userDetails: {
    name: string;
    email: string;
    phone?: string;
  };
  onPaymentSuccess: () => void;
  onPaymentFailure: (error: string) => void;
  onCancel: () => void;
}

// Declare Razorpay on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayment({
  quizId,
  userId,
  userDetails,
  onPaymentSuccess,
  onPaymentFailure,
  onCancel
}: RazorpayPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          setError('Failed to load payment gateway. Please refresh and try again.');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      setError('Payment gateway not loaded. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create order on backend
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          quizId,
          userDetails,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create payment order');
      }

      // Configure Razorpay options
      const options: RazorpayOptions = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: PAYMENT_CONFIG.company.name,
        description: PAYMENT_CONFIG.description,
        image: PAYMENT_CONFIG.company.logo,
        order_id: data.orderId,
        handler: async (response: RazorpayPaymentVerification) => {
          await handlePaymentSuccess(response);
        },
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.phone || '',
        },
        notes: {
          ...PAYMENT_CONFIG.notes,
          user_id: userId,
          quiz_id: quizId,
        },
        theme: {
          color: PAYMENT_CONFIG.theme.color,
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            setIsProcessing(false);
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        setIsLoading(false);
        setIsProcessing(false);
        onPaymentFailure(response.error.description || 'Payment failed');
      });

      razorpay.open();

    } catch (error: any) {
      console.error('Payment initiation error:', error);
      setError(error.message || 'Failed to initiate payment');
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (response: RazorpayPaymentVerification) => {
    setIsProcessing(true);

    try {
      // Verify payment on backend
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...response,
          userId,
          quizId,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        onPaymentSuccess();
      } else {
        throw new Error(verifyData.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      onPaymentFailure(error.message || 'Payment verification failed');
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Secure Payment</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isProcessing}
            >
              ✕
            </button>
          </div>

          {/* Payment Info */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">₹30</div>
              <p className="text-blue-800 font-medium">Quiz Access Payment</p>
              <p className="text-blue-600 text-sm mt-1">One-time payment for lifetime access</p>
            </div>

            {/* Payment Features */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 text-xl">🔒</span>
                </div>
                <p className="text-sm font-medium text-gray-800">Secure</p>
                <p className="text-xs text-gray-600">256-bit SSL</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 text-xl">⚡</span>
                </div>
                <p className="text-sm font-medium text-gray-800">Instant</p>
                <p className="text-xs text-gray-600">Immediate access</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 text-xl">💳</span>
                </div>
                <p className="text-sm font-medium text-gray-800">Multiple</p>
                <p className="text-xs text-gray-600">Payment options</p>
              </div>
              <div className="text-center">
                <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-orange-600 text-xl">🏆</span>
                </div>
                <p className="text-sm font-medium text-gray-800">Certified</p>
                <p className="text-xs text-gray-600">Get certificate</p>
              </div>
            </div>

            {/* Supported Payment Methods */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Supported Payment Methods:</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-600">
                <span className="bg-white px-2 py-1 rounded">UPI</span>
                <span className="bg-white px-2 py-1 rounded">Cards</span>
                <span className="bg-white px-2 py-1 rounded">Net Banking</span>
                <span className="bg-white px-2 py-1 rounded">Wallets</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-2">⚠️</span>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-blue-800 text-sm font-medium">Processing payment...</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePayment}
              disabled={isLoading || isProcessing || !razorpayLoaded}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading || isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isProcessing ? 'Processing...' : 'Initiating Payment...'}
                </>
              ) : (
                <>
                  <span className="mr-2">💳</span>
                  Pay ₹30 Securely
                </>
              )}
            </button>

            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 font-medium py-3 px-6 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center">
                <span className="text-green-500 mr-1">✓</span>
                Powered by Razorpay
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-1">✓</span>
                PCI Compliant
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 