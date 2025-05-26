'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { eligibilityTiers, getEligibilityTier } from '../../quiz/[quiz_id]/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchResultData() {
      if (!user) return;

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
        
        // Check if this result belongs to the current user
        if (data.user_id !== user.id) {
          console.error('This certificate does not belong to the current user:', {
            resultUserId: data.user_id,
            currentUserId: user.id
          });
          router.push('/user/results');
          return;
        }

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

    if (user) {
      fetchResultData();
    }
  }, [user, resultId, router]);

  const downloadAsPDF = async () => {
    if (!certificateRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        onclone: (doc) => {
          const elements = doc.querySelectorAll('*');
          elements.forEach(el => {
            if (el instanceof HTMLElement) {
              if (getComputedStyle(el).color.includes('oklch')) {
                el.style.color = '#000000';
              }
              if (getComputedStyle(el).backgroundColor.includes('oklch')) {
                el.style.backgroundColor = '#ffffff';
              }
              if (getComputedStyle(el).borderColor.includes('oklch')) {
                el.style.borderColor = '#cccccc';
              }
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${result?.quiz.title.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const addToLinkedIn = () => {
    // LinkedIn's Add to Profile URL format
    const title = encodeURIComponent(`${result?.quiz.title} Certification`);
    const organization = encodeURIComponent('Quiz App');
    const issueYear = new Date(result?.completed_at || '').getFullYear();
    const issueMonth = new Date(result?.completed_at || '').getMonth() + 1;
    
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${title}&organizationName=${organization}&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${window.location.href}`;
    
    window.open(linkedInUrl, '_blank');
  };

  if (authLoading || isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Your Certificate</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/user/results')}
          >
            Back to Results
          </Button>
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
              className="bg-white shadow-2xl rounded-2xl overflow-hidden relative"
              style={{ aspectRatio: '1.414', maxWidth: '100%', height: 'auto' }}
            >
              {/* Elegant Border Design */}
              <div className="absolute inset-0 border-[16px] border-gradient-to-r from-purple-400 via-blue-500 to-indigo-600 rounded-2xl"></div>
              <div className="absolute inset-4 border-[8px] border-gradient-to-r from-gold-300 via-yellow-400 to-gold-500 rounded-xl"></div>
              <div className="absolute inset-8 border-[4px] border-gray-200 rounded-lg"></div>
              
              {/* Decorative Corner Elements */}
              <div className="absolute top-8 left-8 w-16 h-16 border-l-4 border-t-4 border-purple-400 rounded-tl-lg"></div>
              <div className="absolute top-8 right-8 w-16 h-16 border-r-4 border-t-4 border-purple-400 rounded-tr-lg"></div>
              <div className="absolute bottom-8 left-8 w-16 h-16 border-l-4 border-b-4 border-purple-400 rounded-bl-lg"></div>
              <div className="absolute bottom-8 right-8 w-16 h-16 border-r-4 border-b-4 border-purple-400 rounded-br-lg"></div>

              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-3">
                <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="cert-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="20" cy="20" r="2" fill="#e5e7eb" opacity="0.3"/>
                      <circle cx="10" cy="10" r="1" fill="#d1d5db" opacity="0.4"/>
                      <circle cx="30" cy="30" r="1" fill="#d1d5db" opacity="0.4"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cert-pattern)" />
                </svg>
              </div>

              {/* Certificate Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-12">
                {/* Header Badge */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                <div className="text-center max-w-lg">
                  <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent mb-2"
                  >
                    CERTIFICATE
                  </motion.h1>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl font-semibold text-gray-600 mb-8"
                  >
                    OF ACHIEVEMENT
                  </motion.p>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-6"
                  >
                    <p className="text-lg text-gray-700 mb-2">This certifies that</p>
                    <div className="border-b-3 border-gradient-to-r from-purple-400 to-indigo-500 pb-2 mb-4">
                      <h2 className="text-3xl font-bold text-gray-800 tracking-wide">
                        {result.user.full_name || result.user.email}
                      </h2>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mb-6"
                  >
                    <p className="text-lg text-gray-700 mb-2">has successfully completed</p>
                    <h3 className="text-2xl font-bold text-gray-800 leading-tight">
                      {result.quiz.title}
                    </h3>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mb-8"
                  >
                    <div className="flex items-center justify-center space-x-6 mb-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{result.score.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Final Score</div>
                      </div>
                      <div className="w-px h-12 bg-gray-300"></div>
                      <div className="text-center">
                        <div className={`text-lg font-bold px-4 py-2 rounded-full ${getEligibilityTier(result.score).bgClass} ${getEligibilityTier(result.score).textClass}`}>
                          {getEligibilityTier(result.score).label}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Achievement Level</div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="flex justify-between items-end text-sm text-gray-600"
                  >
                    <div className="text-left">
                      <div className="font-semibold">Thinkify Learning Platform</div>
                      <div>Certificate Authority</div>
                    </div>
                    <div className="text-right">
                      <div>Issued: {new Date(result.completed_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</div>
                      <div className="font-mono text-xs">ID: {result.id.substring(0, 8).toUpperCase()}</div>
                    </div>
                  </motion.div>
                </div>

                {/* Digital Signature */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                  className="absolute bottom-16 right-16"
                >
                  <div className="text-center">
                    <div className="w-24 h-px bg-gray-400 mx-auto mb-1"></div>
                    <div className="text-xs text-gray-500">Digital Signature</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Download and Share Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                onClick={downloadAsPDF}
                isLoading={isGenerating}
                fullWidth
              >
                {isGenerating ? 'Generating PDF...' : 'Download Certificate (PDF)'}
              </Button>
              
              <Button 
                onClick={addToLinkedIn}
                variant="outline"
                fullWidth
              >
                Add to LinkedIn Profile
              </Button>
            </motion.div>
          </>
        )}
      </motion.div>
    </Layout>
  );
} 