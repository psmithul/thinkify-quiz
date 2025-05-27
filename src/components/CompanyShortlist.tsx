'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

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
}

const TIER_LABELS = {
  1: { label: 'Beginner', color: 'bg-red-100 text-red-800', description: 'Entry-level positions' },
  2: { label: 'Basic', color: 'bg-orange-100 text-orange-800', description: 'Junior positions' },
  3: { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800', description: 'Mid-level positions' },
  4: { label: 'Proficient', color: 'bg-lime-100 text-lime-800', description: 'Senior positions' },
  5: { label: 'Expert', color: 'bg-green-100 text-green-800', description: 'Lead/Principal positions' }
};

export function CompanyShortlist({ userTier }: CompanyShortlistProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchCompanies() {
    try {
      setIsLoading(true);
      
      // Fetch companies for the user's tier and below (they qualify for these positions)
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .lte('tier', userTier) // Less than or equal to user's tier
        .order('tier', { ascending: false }) // Show highest tier first
        .order('name', { ascending: true });

      if (companiesError) throw companiesError;

      // Fetch recruiters for each company
      const companiesWithRecruiters = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { data: recruiters, error: recruitersError } = await supabase
            .from('recruiters')
            .select('id, name, linkedin_url, position, bio, profile_image_url')
            .eq('company_id', company.id)
            .eq('is_active', true);

          if (recruitersError) {
            console.warn(`Unable to fetch recruiters for ${company.name}:`, recruitersError);
          }

          return {
            ...company,
            recruiters: recruiters || []
          };
        })
      );

      setCompanies(companiesWithRecruiters);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchCompanies();
  }, [userTier]);

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const tierConfig = TIER_LABELS[userTier as keyof typeof TIER_LABELS];

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Company Opportunities</h2>
          <p className="text-sm text-gray-600 mt-1">
            Based on your <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tierConfig?.color}`}>
              Tier {userTier}: {tierConfig?.label}
            </span> performance
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {companies.length} companies available
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-500">No companies available for your current tier.</p>
          <p className="text-sm text-gray-400 mt-2">
            Complete more quizzes to improve your tier and unlock more opportunities!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {companies.map((company) => (
            <div key={company.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
              <div className="flex items-start space-x-4">
                {company.logo_url && (
                  <img
                    src={company.logo_url}
                    alt={`${company.name} logo`}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{company.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      TIER_LABELS[company.tier as keyof typeof TIER_LABELS]?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      Tier {company.tier}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {company.industry} • {company.location}
                  </p>
                  {company.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{company.description}</p>
                  )}
                  
                  {/* Recruiters Section */}
                  {company.recruiters && company.recruiters.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Connect with Recruiters
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {company.recruiters.map((recruiter) => (
                          <a
                            key={recruiter.id}
                            href={recruiter.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-sm group"
                            onClick={(e) => e.stopPropagation()}
                            title={recruiter.bio || `${recruiter.position || 'Recruiter'} at ${company.name}`}
                          >
                            <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            {recruiter.name}
                            {recruiter.position && (
                              <span className="text-xs text-blue-200 ml-1">({recruiter.position})</span>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-gray-500">
                      {TIER_LABELS[company.tier as keyof typeof TIER_LABELS]?.description}
                    </div>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                      >
                        View Jobs
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-purple-900">How it works</h4>
            <p className="text-sm text-purple-700 mt-1">
              Companies are categorized by tiers based on position levels. Your quiz performance determines which tiers you qualify for. 
              Higher scores unlock access to more senior positions at top-tier companies. Connect with recruiters on LinkedIn to explore opportunities!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 