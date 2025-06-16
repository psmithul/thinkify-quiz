'use client';

import { useState, useRef } from 'react';
import { supabase, PaymentVerification } from '@/lib/supabaseClient';
import QRCode from 'react-qr-code';

interface PaymentVerificationProps {
  quizId: string;
  userId: string;
  onPaymentSubmitted: () => void;
  onCancel: () => void;
}

export default function PaymentVerificationComponent({
  quizId,
  userId,
  onPaymentSubmitted,
  onCancel
}: PaymentVerificationProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UPI payment string for ₹30
  const upiPaymentString = `upi://pay?pa=psmithul@ybl&pn=Thinkify Quiz&am=30&cu=INR&tn=Quiz Payment`;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload only image files');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${quizId}_${Date.now()}.${fileExt}`;
      const filePath = fileName; // No subfolder needed

      const { data, error } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, file);

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(filePath);

      setUploadedImage(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!uploadedImage) {
      alert('Please upload payment screenshot first');
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert payment verification record
      const { error } = await supabase
        .from('payment_verifications')
        .insert({
          user_id: userId,
          quiz_id: quizId,
          amount: 30,
          payment_screenshot_url: uploadedImage,
          verification_status: 'pending'
        });

      if (error) throw error;

      alert('Payment screenshot submitted successfully! Please wait for admin verification.');
      onPaymentSubmitted();
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quiz Payment</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-lg font-semibold text-blue-800">Amount: ₹30</p>
              <p className="text-sm text-blue-600">Scan QR code to pay</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <QRCode
                  value={upiPaymentString}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-6">
              <p>1. Scan the QR code with any UPI app</p>
              <p>2. Pay ₹30 for quiz access</p>
              <p>3. Take screenshot of payment confirmation</p>
              <p>4. Upload screenshot below</p>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Payment Screenshot
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {isUploading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 mt-2">Uploading...</p>
              </div>
            )}

            {uploadedImage && (
              <div className="text-center">
                <img
                  src={uploadedImage}
                  alt="Payment screenshot"
                  className="max-w-full h-auto max-h-48 mx-auto rounded-lg border"
                />
                <p className="text-sm text-green-600 mt-2">✓ Screenshot uploaded successfully</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitPayment}
              disabled={!uploadedImage || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 