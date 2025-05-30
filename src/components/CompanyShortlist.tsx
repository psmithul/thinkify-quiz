'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion, AnimatePresence } from 'framer-motion';

type Recruiter = {
  id: string;
  name: string;
  linkedin_url: string;
  position?: string;
  bio?: string;
  profile_image_url?: string;
};

type Company = {
  id: string;
  name: string;
  tier: number;
  industry: string;
  location: string;
  website?: string;
  description?: string;
  logo_url?: string;
  recruiters?: Recruiter[];
};

interface CompanyShortlistProps {
  userTier: number;
  quizId?: string;
}

const TIER_LABELS = {
  1: { label: 'Beginner', color: 'bg-red-100 text-red-800', description: 'Entry-level positions' },
  2: { label: 'Basic', color: 'bg-orange-100 text-orange-800', description: 'Junior positions' },
  3: { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800', description: 'Mid-level positions' },
  4: { label: 'Proficient', color: 'bg-lime-100 text-lime-800', description: 'Senior positions' },
  5: { label: 'Expert', color: 'bg-green-100 text-green-800', description: 'Lead/Principal positions' }
};

export function CompanyShortlist({ userTier, quizId }: CompanyShortlistProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  async function fetchCompanies() {
    try {
      setIsLoading(true);
      setError(null);
      
      let companiesData: Company[] = [];
      
      if (quizId) {
        // Fetch only companies associated with this specific quiz
        console.log('Fetching companies associated with quiz:', quizId);
        
        const { data: associations, error: associationsError } = await supabase
          .from('quiz_company_associations')
          .select(`
            company_id,
            companies (
              id,
              name,
              tier,
              industry,
              location,
              website,
              description,
              logo_url
            )
          `)
          .eq('quiz_id', quizId);

        if (associationsError) {
          console.error('Error fetching quiz company associations:', associationsError);
          throw new Error('Unable to load company opportunities for this quiz');
        }

        if (associations && associations.length > 0) {
          // Filter companies based on user's eligibility tier
          companiesData = associations
            .filter((assoc: any) => assoc.companies && typeof assoc.companies === 'object')
            .map((assoc: any) => assoc.companies as Company)
            .filter((company: Company) => company && company.tier <= userTier);
          
          console.log('Found associated companies eligible for user tier:', companiesData.length, 'out of', associations.length, 'total associations');
        } else {
          console.log('No company associations found for this quiz');
          companiesData = [];
        }
      } else {
        // If no quiz ID provided, show no companies (this should not happen in results context)
        console.log('No quiz ID provided - showing no companies');
        companiesData = [];
      }

      // Fetch recruiters for each company
      if (companiesData.length > 0) {
        const companiesWithRecruiters = await Promise.all(
          companiesData.map(async (company) => {
            try {
              const { data: recruiters } = await supabase
                .from('recruiters')
                .select('*')
                .eq('company_id', company.id)
                .limit(3); // Limit to 3 recruiters per company
              
              return {
                ...company,
                recruiters: recruiters || []
              };
            } catch (error) {
              console.warn('Error fetching recruiters for company:', company.id, error);
              return {
                ...company,
                recruiters: []
              };
            }
          })
        );
        
        companiesData = companiesWithRecruiters;
      }

      setCompanies(companiesData);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchCompanies();
  }, [userTier, quizId]);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading company opportunities...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Companies</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchCompanies}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="w-full">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="text-blue-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-2 8h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-blue-800 mb-2">No Company Opportunities Available</h3>
          <p className="text-blue-700 mb-4">
            {quizId 
              ? "This quiz doesn't have any associated companies, or you may need a higher tier score to unlock opportunities." 
              : `No companies are available for Tier ${userTier} and below.`
            }
          </p>
          <div className="text-sm text-blue-600 space-y-2">
            <p>💡 <strong>Tips to unlock more opportunities:</strong></p>
            <ul className="list-disc list-inside text-left max-w-md mx-auto">
              <li>Retake this quiz to improve your score</li>
              <li>Take other quizzes to demonstrate broader skills</li>
              <li>Companies may be added to this quiz in the future</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const tierConfig = TIER_LABELS[userTier as keyof typeof TIER_LABELS];

  return (
    <div className="w-full space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Company Opportunities</h2>
            <p className="text-gray-600 mt-1">
              Based on your quiz performance, you're eligible for <strong>Tier {userTier}</strong> companies and below
            </p>
          </div>
          <div className="text-center sm:text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${tierConfig.color}`}>
              🎯 {tierConfig.label} Level
            </div>
            <p className="text-xs text-gray-500 mt-1">{tierConfig.description}</p>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {companies.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Company Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={`${company.name} logo`}
                        className="w-12 h-12 rounded-lg object-cover mr-3"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-lg font-bold text-gray-600">
                          {company.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-500">{company.industry}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    TIER_LABELS[company.tier as keyof typeof TIER_LABELS]?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    Tier {company.tier}
                  </span>
                </div>

                {/* Company Details */}
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {company.location}
                  </div>

                  {company.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {company.description}
                    </p>
                  )}

                  {/* Recruiters */}
                  {company.recruiters && company.recruiters.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Recruiters</h4>
                      <div className="space-y-2">
                        {company.recruiters.slice(0, 2).map((recruiter) => (
                          <div key={recruiter.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              {recruiter.profile_image_url ? (
                                <img
                                  src={recruiter.profile_image_url}
                                  alt={recruiter.name}
                                  className="w-8 h-8 rounded-full mr-2"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-xs font-medium text-purple-800">
                                    {recruiter.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{recruiter.name}</p>
                                {recruiter.position && (
                                  <p className="text-xs text-gray-500">{recruiter.position}</p>
                                )}
                              </div>
                            </div>
                            {recruiter.linkedin_url && (
                              <a
                                href={recruiter.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                LinkedIn
                              </a>
                            )}
                          </div>
                        ))}
                        {company.recruiters.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{company.recruiters.length - 2} more recruiter{company.recruiters.length - 2 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-purple-600 text-white text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                      >
                        🌐 Visit Website
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedCompany(selectedCompany === company.id ? null : company.id)}
                      className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      {selectedCompany === company.id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedCompany === company.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-100"
                    >
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Why you're eligible</h5>
                          <p className="text-xs text-gray-600">
                            Your Tier {userTier} performance qualifies you for this Tier {company.tier} company. 
                            {company.tier < userTier && " You exceed their minimum requirements!"}
                          </p>
                        </div>
                        
                        {company.recruiters && company.recruiters.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">All Recruiters</h5>
                            <div className="space-y-2">
                              {company.recruiters.map((recruiter) => (
                                <div key={recruiter.id} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center">
                                      {recruiter.profile_image_url ? (
                                        <img
                                          src={recruiter.profile_image_url}
                                          alt={recruiter.name}
                                          className="w-10 h-10 rounded-full mr-3"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                          <span className="text-sm font-medium text-purple-800">
                                            {recruiter.name.charAt(0)}
                                          </span>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{recruiter.name}</p>
                                        {recruiter.position && (
                                          <p className="text-xs text-gray-500">{recruiter.position}</p>
                                        )}
                                        {recruiter.bio && (
                                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{recruiter.bio}</p>
                                        )}
                                      </div>
                                    </div>
                                    {recruiter.linkedin_url && (
                                      <a
                                        href={recruiter.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-blue-600 text-white py-1 px-3 rounded text-xs hover:bg-blue-700 transition-colors"
                                      >
                                        Connect
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Message */}
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600 text-sm">
          🎯 <strong>Showing {companies.length} company opportunit{companies.length === 1 ? 'y' : 'ies'}</strong> 
          {quizId && ' associated with this quiz'} that match your performance level.
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Take more quizzes or improve your scores to unlock additional opportunities!
        </p>
      </div>
    </div>
  );
} 