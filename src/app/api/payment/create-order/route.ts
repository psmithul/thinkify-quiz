import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayInstance, PAYMENT_CONFIG, generatePaymentReceipt, handleRazorpayError } from '@/lib/razorpay';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { userId, quizId, userDetails } = await request.json();

    // Validate required fields
    if (!userId || !quizId) {
      return NextResponse.json(
        { success: false, message: 'User ID and Quiz ID are required' },
        { status: 400 }
      );
    }

    // Check if user already has a verified payment for this quiz (using regular client)
    const { data: existingPayment, error: checkError } = await supabase
      .from('payment_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .eq('verification_status', 'approved')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing payment:', checkError);
      return NextResponse.json(
        { success: false, message: 'Error checking payment status' },
        { status: 500 }
      );
    }

    if (existingPayment && existingPayment.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Payment already completed for this quiz' },
        { status: 400 }
      );
    }

    // Generate unique receipt ID
    const receipt = generatePaymentReceipt(userId, quizId);

    // Create Razorpay order
    const orderOptions = {
      amount: PAYMENT_CONFIG.amount, // Amount in paise
      currency: PAYMENT_CONFIG.currency,
      receipt: receipt,
      notes: {
        ...PAYMENT_CONFIG.notes,
        user_id: userId,
        quiz_id: quizId,
        user_email: userDetails?.email || '',
      },
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(orderOptions);

    // Store the order in our database for tracking (using admin client to bypass RLS)
    const { error: insertError } = await supabaseAdmin
      .from('payment_verifications')
      .insert({
        user_id: userId,
        quiz_id: quizId,
        amount: PAYMENT_CONFIG.amount / 100, // Store in rupees (column is 'amount', not 'amount_paid')
        verification_status: 'pending',
        verification_notes: `Razorpay Order Created: ${order.id}`,
        razorpay_order_id: order.id,
        payment_method: 'razorpay', // Explicitly set payment method
      });

    if (insertError) {
      console.error('Error storing payment record:', insertError);
      return NextResponse.json(
        { success: false, message: 'Error creating payment record' },
        { status: 500 }
      );
    }

    // Return order details for frontend
    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    const errorResponse = handleRazorpayError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 