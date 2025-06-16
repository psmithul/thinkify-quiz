'use client';

import { useEffect, useState } from 'react';
import { supabase, PaymentVerification, User } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { checkDatabaseStatus, checkAndFixRLSPolicies } from '@/utils/dbCheck';
import { DatabaseSetupButton } from '@/components/DatabaseSetupButton';
import { RLSFixModal } from '@/components/RLSFixModal';

type PaymentWithUser = PaymentVerification & {
  user?: User;
  quiz?: { title: string };
  verifier?: User;
};

export default function PaymentsAdminPage() {
  const [payments, setPayments] = useState<PaymentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [databaseMissing, setDatabaseMissing] = useState(false);
  const [showRLSModal, setShowRLSModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    setLoading(true);
    
    // First, check database status for debugging with auto-fix enabled
    const dbStatus = await checkDatabaseStatus(true);
    if (!dbStatus.paymentVerifications) {
      console.error('❌ Database check failed - payment_verifications table not accessible');
      setPayments([]);
      setLoading(false);
      setDatabaseMissing(true);
      
      // If auto-fix failed, show helpful message
      if (dbStatus.autoFixed === false) {
        console.log('Auto-fix failed, showing setup banner');
      }
      return;
    }

    // Check if access is blocked by RLS policies
    if (dbStatus.accessBlocked) {
      console.warn('⚠️  Table exists but access is blocked by RLS policies');
      const rlsCheck = await checkAndFixRLSPolicies();
      
      if (!rlsCheck.success) {
        console.error('❌ RLS policy check failed:', rlsCheck.error);
        setPayments([]);
        setLoading(false);
        setShowRLSModal(true);
        return;
      }

      if (rlsCheck.userRole !== 'admin') {
        console.error('❌ User does not have admin role');
        setPayments([]);
        setLoading(false);
        alert('Access denied: Admin privileges required to view payment verifications.');
        return;
      }
    }

    if (dbStatus.autoFixed) {
      console.log('✅ Database was automatically fixed');
    }
    
    setDatabaseMissing(false);
    
    try {
      // Try a direct query without the initial test since we've already checked
      let query = supabase
        .from('payment_verifications')
        .select(`
          *,
          user:users!user_id(id, email, full_name),
          quiz:quizzes(title),
          verifier:users!verified_by(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('verification_status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Query error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          query: 'payment_verifications with relations'
        });

        // Check if it's an RLS policy error
        if (error.code === 'PGRST301' || error.message?.includes('policy')) {
          setPayments([]);
          setLoading(false);
          setShowRLSModal(true);
          return;
        }

        // Check for relationship ambiguity errors
        if (error.code === 'PGRST201' && error.message?.includes('more than one relationship')) {
          console.error('❌ Database relationship ambiguity error - this should be fixed now');
          alert('Database relationship error. The query has been updated to resolve ambiguous relationships.');
          throw error;
        }

        // Check for foreign key issues
        if (error.code === 'PGRST116' && error.message?.includes('foreign key')) {
          alert('Database relationship error. Some referenced tables may be missing or inaccessible.');
          // Try a simpler query without joins
          const { data: simpleData, error: simpleError } = await supabase
            .from('payment_verifications')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!simpleError) {
            console.warn('⚠️  Using simplified query without user/quiz details');
            setPayments(simpleData || []);
            setLoading(false);
            return;
          }
        }

        throw error;
      }
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error,
        stack: error instanceof Error ? error.stack : undefined
      });
      setPayments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (
    paymentId: string, 
    status: 'approved' | 'rejected', 
    notes?: string
  ) => {
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('payment_verifications')
        .update({
          verification_status: status,
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          verification_notes: notes
        })
        .eq('id', paymentId);

      if (error) {
        console.error('Error updating payment status:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          paymentId,
          status,
          notes
        });
        throw error;
      }

      // Refresh the list
      fetchPayments();
      alert(`Payment ${status} successfully!`);
    } catch (error) {
      console.error('Error updating payment:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error,
        paymentId,
        status,
        stack: error instanceof Error ? error.stack : undefined
      });
      alert('Failed to update payment status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Verifications</h1>
          
          {/* Filter buttons */}
          <div className="flex space-x-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Database Setup Banner */}
        {databaseMissing && <DatabaseSetupButton variant="banner" />}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No payments found for the selected filter.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {payments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Payment #{payment.id.slice(-8)}
                    </h3>
                    <p className="text-gray-600">
                      User: {payment.user?.full_name || payment.user?.email}
                    </p>
                    <p className="text-gray-600">
                      Quiz: {payment.quiz?.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted: {formatDate(payment.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payment.verification_status)}`}>
                      {payment.verification_status}
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      ₹{payment.amount}
                    </p>
                  </div>
                </div>

                {/* Payment Screenshot */}
                {payment.payment_screenshot_url && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Screenshot:</h4>
                    <div className="flex justify-center">
                      <img
                        src={payment.payment_screenshot_url}
                        alt="Payment screenshot"
                        className="max-w-full max-h-64 rounded-lg border cursor-pointer"
                        onClick={() => window.open(payment.payment_screenshot_url, '_blank')}
                      />
                    </div>
                  </div>
                )}

                {/* Verification Notes */}
                {payment.verification_notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</h4>
                    <p className="text-gray-600 text-sm">{payment.verification_notes}</p>
                  </div>
                )}

                {/* Action buttons for pending payments */}
                {payment.verification_status === 'pending' && (
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={() => {
                        const notes = prompt('Add verification notes (optional):');
                        updatePaymentStatus(payment.id, 'approved', notes || undefined);
                      }}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Approve Payment
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Add rejection reason:');
                        if (notes) {
                          updatePaymentStatus(payment.id, 'rejected', notes);
                        }
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      Reject Payment
                    </button>
                  </div>
                )}

                {/* Show verification info for processed payments */}
                {payment.verification_status !== 'pending' && payment.verified_at && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      {payment.verification_status === 'approved' ? 'Approved' : 'Rejected'} on {formatDate(payment.verified_at)}
                      {payment.verifier && (
                        <span className="ml-2">
                          by {payment.verifier.full_name || payment.verifier.email}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* RLS Fix Modal */}
      <RLSFixModal 
        isOpen={showRLSModal} 
        onClose={() => setShowRLSModal(false)} 
      />
    </Layout>
  );
} 