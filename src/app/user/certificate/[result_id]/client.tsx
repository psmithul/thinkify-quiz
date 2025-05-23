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
              className="border-8 border-blue-200 bg-white p-12 shadow-lg rounded-lg relative overflow-hidden"
              style={{ aspectRatio: '1.414', maxWidth: '100%', height: 'auto' }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5 z-0">
                <div className="absolute inset-0 bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                }}></div>
              </div>

              {/* Certificate Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <div className="text-center">
                  <motion.h1 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-bold text-blue-600 mb-6"
                  >
                    Certificate of Achievement
                  </motion.h1>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xl mb-8"
                  >
                    This is to certify that
                  </motion.p>
                  
                  <motion.h2 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-3xl font-bold mb-8 text-gray-800 border-b-2 border-gray-300 pb-2"
                  >
                    {result.user.full_name || result.user.email}
                  </motion.h2>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="text-xl mb-6"
                  >
                    has successfully completed
                  </motion.p>
                  
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="text-2xl font-bold text-gray-800 mb-6"
                  >
                    {result.quiz.title}
                  </motion.h3>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                    className="text-lg mb-6"
                  >
                    with a score of <span className="font-bold">{result.score.toFixed(1)}%</span>
                  </motion.p>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="text-lg mb-8"
                  >
                    Achieving {getEligibilityTier(result.score).label} Level Eligibility
                  </motion.p>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.7 }}
                    className="mt-12 text-gray-600"
                  >
                    <p>Issued on: {new Date(result.completed_at).toLocaleDateString()}</p>
                    <p>Certificate ID: {result.id.substring(0, 8).toUpperCase()}</p>
                  </motion.div>
                </div>
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