'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

type Company = {
  id: string;
  name: string;
  tier: number;
  industry: string;
  location: string;
  website?: string;
  description?: string;
  logo_url?: string;
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
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .lte('tier', userTier) // Less than or equal to user's tier
        .order('tier', { ascending: false }) // Show highest tier first
        .order('name', { ascending: true });

      if (error) throw error;
      setCompanies(data || []);
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
              Higher scores unlock access to more senior positions at top-tier companies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 