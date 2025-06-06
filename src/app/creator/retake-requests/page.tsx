'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { getCreatorRetakeRequests, respondToRetakeRequest, type RetakeRequest } from '@/lib/retake-requests';
import { formatErrorMessage } from '@/utils/errorHandler';

export default function RetakeRequestsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [retakeRequests, setRetakeRequests] = useState<RetakeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [additionalAttempts, setAdditionalAttempts] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    
    if (user) {
      fetchRetakeRequests();
    }
  }, [user, authLoading, router]);

  const fetchRetakeRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const requests = await getCreatorRetakeRequests(user.id);
      setRetakeRequests(requests);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: string, status: 'approved' | 'denied') => {
    if (!responseMessage.trim()) {
      setError('Please provide a response message.');
      return;
    }
    
    try {
      setRespondingTo(requestId);
      setError(null);
      
      const result = await respondToRetakeRequest(
        requestId,
        status,
        responseMessage,
        user!.id,
        status === 'approved' ? additionalAttempts : 0
      );
      
      if (result.success) {
        setSuccess(`Request ${status} successfully!`);
        setRespondingTo(null);
        setResponseMessage('');
        setAdditionalAttempts(1);
        
        // Refresh the requests
        await fetchRetakeRequests();
      } else {
        setError(result.error || `Failed to ${status} request.`);
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setRespondingTo(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
      case 'denied':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Denied</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Retake Requests</h1>
            <p className="text-gray-600 mt-2">Manage quiz retake requests from users</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/creator/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {retakeRequests.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <div className="mb-4">
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8v2m0 6h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Retake Requests</h3>
            <p className="text-gray-600">You don't have any retake requests to review at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {retakeRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {request.quiz?.title || 'Unknown Quiz'}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>User:</strong> {request.user?.full_name || request.user?.email}</p>
                      <p><strong>Email:</strong> {request.user?.email}</p>
                      <p><strong>Requested:</strong> {new Date(request.requested_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">User's Reason:</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-700 italic">"{request.reason}"</p>
                  </div>
                </div>

                {request.status === 'pending' ? (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Respond to Request</h4>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`response-${request.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                          Response Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id={`response-${request.id}`}
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Explain your decision to the user..."
                          required
                        />
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <label htmlFor={`attempts-${request.id}`} className="text-sm font-medium text-gray-700">
                            Additional Attempts:
                          </label>
                          <select
                            id={`attempts-${request.id}`}
                            value={additionalAttempts}
                            onChange={(e) => setAdditionalAttempts(parseInt(e.target.value))}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={5}>5</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => handleRespond(request.id, 'approved')}
                          disabled={!responseMessage.trim() || respondingTo === request.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {respondingTo === request.id ? 'Processing...' : '✅ Approve'}
                        </Button>
                        <Button
                          onClick={() => handleRespond(request.id, 'denied')}
                          disabled={!responseMessage.trim() || respondingTo === request.id}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
                        >
                          {respondingTo === request.id ? 'Processing...' : '❌ Deny'}
                        </Button>
                        <Button
                          onClick={() => {
                            setResponseMessage('');
                            setAdditionalAttempts(1);
                          }}
                          variant="outline"
                          disabled={respondingTo === request.id}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Your Response:</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-700">"{request.response_message}"</p>
                      <div className="text-xs text-gray-500 mt-2">
                        {request.status === 'approved' && (
                          <span>Granted {request.additional_attempts_granted} additional attempt(s) • </span>
                        )}
                        Responded: {request.responded_at ? new Date(request.responded_at).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 