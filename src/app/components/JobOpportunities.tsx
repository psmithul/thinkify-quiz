'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/Button';

type JobOpportunity = {
  id: string;
  company: string;
  title: string;
  location: string;
  salary: string;
  description: string;
  logoUrl: string;
};

type JobOpportunitiesProps = {
  score: number;
  quizType: string;
};

export function JobOpportunities({ score, quizType }: JobOpportunitiesProps) {
  const [showPaywall, setShowPaywall] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Mock job opportunities based on quiz type and score
  const generateJobs = (): JobOpportunity[] => {
    // Categories of jobs that might be available based on quiz type
    const jobsByType: Record<string, Partial<JobOpportunity>[]> = {
      "programming": [
        { company: "TechCorp", title: "Junior Software Developer", location: "Remote", salary: "$85,000 - $105,000" },
        { company: "Innovate Solutions", title: "Full Stack Engineer", location: "San Francisco, CA", salary: "$120,000 - $150,000" },
        { company: "DataTech", title: "Frontend Developer", location: "New York, NY", salary: "$90,000 - $120,000" },
      ],
      "data": [
        { company: "Analytics Pro", title: "Data Analyst", location: "Chicago, IL", salary: "$75,000 - $95,000" },
        { company: "BigData Inc", title: "Data Scientist", location: "Remote", salary: "$110,000 - $140,000" },
        { company: "Insight Analytics", title: "Business Intelligence Analyst", location: "Boston, MA", salary: "$80,000 - $100,000" },
      ],
      "business": [
        { company: "Growth Ventures", title: "Business Development Associate", location: "Austin, TX", salary: "$70,000 - $90,000" },
        { company: "Enterprise Solutions", title: "Project Manager", location: "Seattle, WA", salary: "$85,000 - $110,000" },
        { company: "Strategic Partners", title: "Marketing Specialist", location: "Remote", salary: "$65,000 - $85,000" },
      ],
      "default": [
        { company: "Global Innovations", title: "Junior Associate", location: "Remote", salary: "$60,000 - $80,000" },
        { company: "Future Tech", title: "Research Assistant", location: "Chicago, IL", salary: "$55,000 - $75,000" },
        { company: "Next Generation", title: "Entry Level Specialist", location: "Atlanta, GA", salary: "$50,000 - $70,000" },
      ]
    };

    // Determine appropriate job type based on quiz title if available
    let jobType = quizType.toLowerCase();
    
    // Try to parse relevant job type from the quiz title if no specific category is provided
    if (!jobsByType[jobType]) {
      const title = quizType.toLowerCase();
      if (title.includes('programming') || title.includes('coding') || title.includes('development')) {
        jobType = 'programming';
      } else if (title.includes('data') || title.includes('analytics') || title.includes('analysis')) {
        jobType = 'data';
      } else if (title.includes('business') || title.includes('marketing') || title.includes('management')) {
        jobType = 'business';
      } else {
        jobType = 'default';
      }
    }
    
    // Get jobs based on the quiz type or use default
    const relevantJobs = jobsByType[jobType] || jobsByType.default;
    
    // Number of available jobs based on score
    const numJobs = score >= 90 ? 3 : (score >= 75 ? 2 : 1);
    
    // Generate detailed job listings
    return relevantJobs.slice(0, numJobs).map((job, index) => ({
      id: `job-${index}`,
      company: job.company || "Unknown Company",
      title: job.title || "Position",
      location: job.location || "Remote",
      salary: job.salary || "Competitive",
      description: `This is an exciting opportunity to join ${job.company} as a ${job.title}. The ideal candidate will have strong ${jobType} skills and a passion for innovation. Based on your quiz score of ${score}%, you are a strong candidate for this position.`,
      logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || "Company")}&background=random&color=fff&size=128`
    }));
  };

  const jobs = generateJobs();

  const handleUnlock = () => {
    setIsLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false);
      setIsPaid(true);
      setShowPaywall(false);
    }, 1500);
  };

  if (showPaywall) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <h2 className="text-2xl font-bold">Unlock Job Opportunities</h2>
          <p className="mt-2 opacity-90">
            Companies are looking for candidates with your skills! Based on your quiz score, 
            we've found {jobs.length} job{jobs.length !== 1 ? 's' : ''} that might be a perfect match.
          </p>
        </div>
        
        {/* Paywall Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">What you'll get:</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Access to {jobs.length} job opportunities matched to your skill level</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Company details and salary ranges</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Job descriptions tailored to your quiz performance</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-800 font-medium">Unlock Job Opportunities</p>
                <p className="text-sm text-gray-500">One-time payment</p>
              </div>
              <div className="text-xl font-bold text-gray-900">$9.99</div>
            </div>
          </div>
          
          <div className="text-center">
            <Button 
              onClick={handleUnlock} 
              isLoading={isLoading}
              fullWidth
            >
              {isLoading ? 'Processing Payment...' : 'Unlock Now for $9.99'}
            </Button>
            <p className="mt-2 text-xs text-gray-500">
              Secure payment. You'll get immediate access after purchase.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Opportunities For You</h2>
        <p className="text-gray-600 mb-6">
          Based on your quiz score of {score.toFixed(1)}%, we've matched you with {jobs.length} job{jobs.length !== 1 ? 's' : ''} that align with your skills in {quizType}.
        </p>
        
        <div className="space-y-6">
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img 
                    src={job.logoUrl} 
                    alt={job.company} 
                    className="w-16 h-16 rounded-lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{job.title}</h3>
                  <p className="text-sm font-medium text-purple-600">{job.company}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{job.location}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{job.salary}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => window.open(`mailto:careers@${job.company.toLowerCase().replace(/\s+/g, '')}.example.com?subject=Application for ${job.title}`)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>{job.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
} 