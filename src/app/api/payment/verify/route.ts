import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature, handleRazorpayError } from '@/lib/razorpay';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      quizId 
    } = await request.json();

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !quizId) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment verification data' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      console.error('Invalid payment signature');
      return NextResponse.json(
        { success: false, message: 'Payment verification failed - invalid signature' },
        { status: 400 }
      );
    }

    // Find the payment record
    const { data: paymentRecord, error: findError } = await supabase
      .from('payment_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .eq('razorpay_order_id', razorpay_order_id)
      .limit(1);

    if (findError) {
      console.error('Error finding payment record:', findError);
      return NextResponse.json(
        { success: false, message: 'Error finding payment record' },
        { status: 500 }
      );
    }

    if (!paymentRecord || paymentRecord.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Update payment status to approved automatically (no admin verification needed)
    const { error: updateError } = await supabase
      .from('payment_verifications')
      .update({
        verification_status: 'approved', // Automatic approval for verified Razorpay payments
        verified_at: new Date().toISOString(),
        verification_notes: `Payment automatically verified via Razorpay. Payment ID: ${razorpay_payment_id}. No admin verification required.`,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        payment_method: 'razorpay',
      })
      .eq('id', paymentRecord[0].id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return NextResponse.json(
        { success: false, message: 'Error updating payment status' },
        { status: 500 }
      );
    }

    // Log successful automatic approval for audit
    console.log(`✅ Payment automatically approved for user ${userId}, quiz ${quizId}, payment ${razorpay_payment_id} - No admin verification needed`);

    return NextResponse.json({
      success: true,
      message: 'Payment verified and approved automatically! You now have immediate access to the quiz.',
      paymentId: razorpay_payment_id,
      autoApproved: true, // Flag to indicate automatic approval
    });

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    const errorResponse = handleRazorpayError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 