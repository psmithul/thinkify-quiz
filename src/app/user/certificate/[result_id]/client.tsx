'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { eligibilityTiers, getEligibilityTier } from '../../quiz/[quiz_id]/client';
import { motion } from 'framer-motion';

type ResultWithDetails = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  completed_at: string;
  quiz: {
    id: string;
    title: string;
    description: string;
  };
  user: {
    id: string;
    email: string;
    full_name: string;
  };
};

export function ResultId({ resultId }: { resultId: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [result, setResult] = useState<ResultWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Remove authentication requirement for viewing certificates
  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     router.push('/auth/login');
  //   }
  // }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchResultData() {
      // Allow viewing certificates without authentication
      try {
        console.log('Fetching certificate data for result ID:', resultId);
        
        // Fetch result with quiz and user details
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            quiz:quizzes(*),
            user:users(*)
          `)
          .eq('id', resultId)
          .single();

        if (error) {
          console.error('Error fetching certificate data:', error);
          throw error;
        }

        console.log('Certificate data loaded:', data);
        
        // Remove user ownership check - certificates are now publicly viewable
        // if (data.user_id !== user.id) {
        //   console.error('This certificate does not belong to the current user:', {
        //     resultUserId: data.user_id,
        //     currentUserId: user.id
        //   });
        //   router.push('/user/results');
        //   return;
        // }

        // Check if score is eligible for certificate (tier 3 or higher)
        const tier = getEligibilityTier(data.score).tier;
        if (tier < 3) {
          console.warn('Score does not qualify for certificate', {
            score: data.score,
            tier: tier,
            minimumTier: 3
          });
          setError('Your score does not qualify for a certificate. You need to achieve Tier 3 or higher eligibility.');
          setIsLoading(false);
          return;
        }

        setResult(data);
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    // Always fetch certificate data, regardless of authentication status
    fetchResultData();
  }, [resultId]); // Remove user dependency

  const addToLinkedIn = () => {
    // LinkedIn's Add to Profile URL format
    const title = encodeURIComponent(`${result?.quiz.title} Certification`);
    const organization = encodeURIComponent('Thinkify Quiz Platform');
    const issueYear = new Date(result?.completed_at || '').getFullYear();
    const issueMonth = new Date(result?.completed_at || '').getMonth() + 1;
    
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${title}&organizationName=${organization}&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${window.location.href}`;
    
    window.open(linkedInUrl, '_blank');
  };

  const shareOnSocialMedia = () => {
    const shareText = `I just earned a certificate in ${result?.quiz.title} with a score of ${result?.score}%! 🎉`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Quiz Certificate',
        text: shareText,
        url: shareUrl,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('Certificate link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {result?.user?.full_name ? `${result.user.full_name}'s Certificate` : 'Certificate'}
          </h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              ← Back
            </Button>
            {user && (
              <Button 
                variant="outline" 
                onClick={() => router.push('/user/results')}
              >
                My Results
              </Button>
            )}
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 p-4 rounded-md"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        {result && (
          <>
            {/* Certificate Preview */}
            <motion.div 
              ref={certificateRef} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
              className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50 shadow-2xl rounded-3xl overflow-hidden"
              style={{ aspectRatio: '1.414', maxWidth: '100%', height: 'auto' }}
            >
              {/* Modern Border Design */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-indigo-500/20 rounded-3xl"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 rounded-2xl border border-white/50 backdrop-blur-sm"></div>
              
              {/* Decorative Elements */}
              <div className="absolute top-8 left-8 w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full opacity-10"></div>
              <div className="absolute top-12 right-12 w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full opacity-10"></div>
              <div className="absolute bottom-8 left-12 w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-10"></div>
              <div className="absolute bottom-12 right-8 w-14 h-14 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full opacity-10"></div>

              {/* Modern Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="modern-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="20" cy="20" r="1" fill="url(#gradient1)" opacity="0.6"/>
                      <circle cx="10" cy="10" r="0.5" fill="url(#gradient2)" opacity="0.4"/>
                      <circle cx="30" cy="30" r="0.5" fill="url(#gradient3)" opacity="0.4"/>
                    </pattern>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6"/>
                      <stop offset="100%" stopColor="#3b82f6"/>
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#8b5cf6"/>
                    </linearGradient>
                    <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4"/>
                      <stop offset="100%" stopColor="#3b82f6"/>
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#modern-pattern)" />
                </svg>
              </div>

              {/* Certificate Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-16">
                {/* Modern Header */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
                      <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full blur-xl scale-150"></div>
                  </div>
                </motion.div>

                <div className="text-center max-w-2xl">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-2"
                  >
                    <div className="inline-block px-6 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full border border-purple-200/50 mb-4">
                      <span className="text-sm font-semibold text-purple-700 tracking-wide">CERTIFICATE OF ACHIEVEMENT</span>
                    </div>
                  </motion.div>
                  
                  <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-6xl font-bold bg-gradient-to-br from-gray-800 via-purple-800 to-blue-900 bg-clip-text text-transparent mb-8 tracking-tight"
                  >
                    EXCELLENCE
                  </motion.h1>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-8"
                  >
                    <p className="text-lg text-gray-600 mb-4 font-medium">This certifies that</p>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/30 to-transparent h-px top-1/2"></div>
                      <h2 className="text-4xl font-bold text-gray-800 tracking-wide px-8 bg-white relative">
                        {result.user.full_name}
                      </h2>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mb-8"
                  >
                    <p className="text-lg text-gray-600 mb-4">has successfully completed</p>
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100/50">
                      <h3 className="text-2xl font-bold text-gray-800 leading-tight mb-2">
                        {result.quiz.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {result.quiz.description}
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mb-10"
                  >
                    <div className="flex items-center justify-center space-x-8 mb-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold bg-gradient-to-br from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
                          {result.score.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500 font-medium">Final Score</div>
                      </div>
                      <div className="w-px h-16 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                      <div className="text-center">
                        <div className={`text-lg font-bold px-6 py-3 rounded-full border-2 ${getEligibilityTier(result.score).bgClass} ${getEligibilityTier(result.score).textClass} ${getEligibilityTier(result.score).borderClass} shadow-lg`}>
                          {getEligibilityTier(result.score).label}
                        </div>
                        <div className="text-sm text-gray-500 font-medium mt-2">Achievement Level</div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="flex justify-between items-end text-sm text-gray-600 border-t border-gray-200/50 pt-6"
                  >
                    <div className="text-left">
                      <div className="font-bold text-gray-800 text-lg mb-1">Thinkify</div>
                      <div className="text-gray-500">Learning Platform</div>
                      <div className="text-xs text-gray-400 mt-1">Certificate Authority</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-700 mb-1">
                        {new Date(result.completed_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-gray-400">Certificate ID</div>
                      <div className="font-mono text-xs text-gray-500 mt-1">
                        {result.id.substring(0, 12).toUpperCase()}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* QR Code Placeholder */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                  className="absolute bottom-8 left-8"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-300/50">
                    <div className="text-xs text-gray-400 text-center leading-tight">
                      QR
                      <br />
                      Code
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Download and Share Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                🎉 {user && result && user.id === result.user_id ? 'Share Your Achievement' : 'View Certificate Actions'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {user && result && user.id === result.user_id ? (
                  // Show full sharing options for certificate owner
                  <>
                    <Button 
                      onClick={addToLinkedIn}
                      variant="outline"
                      fullWidth
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn Profile
                    </Button>
                    
                    <Button 
                      onClick={shareOnSocialMedia}
                      variant="outline"
                      fullWidth
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share Social
                    </Button>
                  </>
                ) : (
                  // Show viewing options for visitors
                  <div className="col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <h4 className="font-semibold text-blue-800 mb-2">🏆 Achievement Verified</h4>
                      <p className="text-sm text-blue-700">
                        This certificate belongs to <strong>{result?.user?.full_name}</strong> and represents their achievement in <strong>{result?.quiz?.title}</strong>.
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => window.print()}
                  variant="outline"
                  fullWidth
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  {user && result && user.id === result.user_id ? 'Print PDF' : 'Print Certificate'}
                </Button>

                <Button 
                  onClick={() => {
                    const link = window.location.href;
                    navigator.clipboard.writeText(link);
                    alert('Certificate link copied to clipboard!');
                  }}
                  variant="outline"
                  fullWidth
                  className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </Button>
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                <p className="text-sm text-gray-600 text-center">
                  {user && result && user.id === result.user_id 
                    ? '🏆 Show off your achievement! Share this certificate with your network and add it to your professional profiles.'
                    : '🔍 This is a verified certificate from Thinkify Learning Platform. You can print or share this link to verify the achievement.'
                  }
                </p>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </Layout>
  );
} 