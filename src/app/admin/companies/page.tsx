'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { supabaseAdmin, createAdminOperation } from '@/lib/supabaseAdmin';
import { Button } from '@/components/Button';
import { formatErrorMessage } from '@/utils/errorHandler';

interface Recruiter {
  id: string;
  name: string;
  position: string;
  email: string;
  linkedin_url: string;
  is_active: boolean;
}

interface Company {
  id: string;
  name: string;
  tier: number;
  industry: string;
  location: string;
  website?: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  recruiters?: Recruiter[];
}

interface CompanyFormData {
  name: string;
  tier: number;
  industry: string;
  location: string;
  website: string;
  description: string;
  logo_url: string;
}

interface InterviewerFormData {
  name: string;
  position: string;
  email: string;
  linkedin_url: string;
  is_active: boolean;
}

export default function CompaniesAdminPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showInterviewerModal, setShowInterviewerModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<number | 'all'>('all');
  const [industryFilter, setIndustryFilter] = useState<string | 'all'>('all');
  
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    tier: 3,
    industry: '',
    location: '',
    website: '',
    description: '',
    logo_url: ''
  });

  const [interviewerData, setInterviewerData] = useState<InterviewerFormData>({
    name: '',
    position: '',
    email: '',
    linkedin_url: '',
    is_active: true
  });

  // Bulk operations state
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'delete' | 'tier' | null>(null);
  const [bulkTierValue, setBulkTierValue] = useState<number>(3);

  const adminOps = createAdminOperation();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth/login');
      return;
    }
    if (isAdmin) {
      fetchCompanies();
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    // Apply filters and search
    let filtered = companies;

    if (searchTerm) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(company => company.tier === tierFilter);
    }

    if (industryFilter !== 'all') {
      filtered = filtered.filter(company => company.industry === industryFilter);
    }

    setFilteredCompanies(filtered);
  }, [companies, searchTerm, tierFilter, industryFilter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from('companies')
        .select(`
          *,
          recruiters:recruiters(id, name, position, email, linkedin_url, is_active)
        `)
        .order('tier', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      if (editingCompany) {
        await adminOps.updateCompany(editingCompany.id, formData);
      } else {
        await adminOps.createCompany(formData);
      }

      setShowForm(false);
      setEditingCompany(null);
      resetForm();
      await fetchCompanies();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInterviewerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) return;

    try {
      setLoading(true);
      setError(null);
      
      await adminOps.createRecruiter({
        ...interviewerData,
        company_id: selectedCompany.id
      });

      setShowInterviewerModal(false);
      setSelectedCompany(null);
      resetInterviewerForm();
      await fetchCompanies();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      tier: company.tier,
      industry: company.industry,
      location: company.location,
      website: company.website || '',
      description: company.description || '',
      logo_url: company.logo_url || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also remove all associated interviewers.`)) return;

    try {
      setLoading(true);
      await adminOps.deleteCompany(id);
      await fetchCompanies();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddInterviewer = (company: Company) => {
    setSelectedCompany(company);
    setShowInterviewerModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      tier: 3,
      industry: '',
      location: '',
      website: '',
      description: '',
      logo_url: ''
    });
  };

  const resetInterviewerForm = () => {
    setInterviewerData({
      name: '',
      position: '',
      email: '',
      linkedin_url: '',
      is_active: true
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCompany(null);
    resetForm();
  };

  const handleInterviewerCancel = () => {
    setShowInterviewerModal(false);
    setSelectedCompany(null);
    resetInterviewerForm();
  };

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedCompanies.size === filteredCompanies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(filteredCompanies.map(c => c.id)));
    }
  };

  const handleSelectCompany = (companyId: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  const handleBulkDelete = async () => {
    const selectedCompanyNames = companies
      .filter(c => selectedCompanies.has(c.id))
      .map(c => c.name)
      .join(', ');
    
    if (!confirm(`Are you sure you want to delete ${selectedCompanies.size} companies (${selectedCompanyNames})? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Delete companies one by one to handle potential foreign key constraints
      for (const companyId of selectedCompanies) {
        await adminOps.deleteCompany(companyId);
      }
      
      setSelectedCompanies(new Set());
      setShowBulkActions(false);
      await fetchCompanies();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkTierUpdate = async () => {
    if (!confirm(`Are you sure you want to update ${selectedCompanies.size} companies to ${getTierLabel(bulkTierValue)}?`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Update companies one by one
      for (const companyId of selectedCompanies) {
        await adminOps.updateCompany(companyId, { tier: bulkTierValue });
      }
      
      setSelectedCompanies(new Set());
      setShowBulkActions(false);
      await fetchCompanies();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getTierLabel = (tier: number) => {
    const labels = {
      5: 'Tier 5 (FAANG)',
      4: 'Tier 4 (Large Tech)',
      3: 'Tier 3 (Mid-size)',
      2: 'Tier 2 (Growing)',
      1: 'Tier 1 (Startup)'
    };
    return labels[tier as keyof typeof labels] || `Tier ${tier}`;
  };

  const getTierColor = (tier: number) => {
    const colors = {
      5: 'bg-purple-100 text-purple-800',
      4: 'bg-blue-100 text-blue-800',
      3: 'bg-green-100 text-green-800',
      2: 'bg-yellow-100 text-yellow-800',
      1: 'bg-gray-100 text-gray-800'
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const uniqueIndustries = [...new Set(companies.map(c => c.industry))].sort();

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
              <p className="text-gray-600 mt-2">
                Manage companies and their interviewers across different tiers.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Companies
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name, industry, or location..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Tier
              </label>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value={5}>Tier 5 (FAANG)</option>
                <option value={4}>Tier 4 (Large Tech)</option>
                <option value={3}>Tier 3 (Mid-size)</option>
                <option value={2}>Tier 2 (Growing)</option>
                <option value={1}>Tier 1 (Startup)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Industry
              </label>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Industries</option>
                {uniqueIndustries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setTierFilter('all');
                  setIndustryFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Companies ({filteredCompanies.length} of {companies.length})
              </h2>
              <div className="flex items-center gap-3">
                {selectedCompanies.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {selectedCompanies.size} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkActions(!showBulkActions)}
                    >
                      Bulk Actions
                    </Button>
                  </div>
                )}
                <Button 
                  variant="primary"
                  onClick={() => setShowForm(true)}
                  disabled={loading}
                >
                  Add Company
                </Button>
              </div>
            </div>

            {/* Bulk Actions Panel */}
            {showBulkActions && selectedCompanies.size > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Bulk Actions ({selectedCompanies.size} companies selected)
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-3 py-2 bg-red-100 text-red-800 text-sm rounded-md hover:bg-red-200 transition-colors"
                    disabled={loading}
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Update Tier:</span>
                    <select
                      value={bulkTierValue}
                      onChange={(e) => setBulkTierValue(parseInt(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5}>Tier 5 (FAANG)</option>
                      <option value={4}>Tier 4 (Large Tech)</option>
                      <option value={3}>Tier 3 (Mid-size)</option>
                      <option value={2}>Tier 2 (Growing)</option>
                      <option value={1}>Tier 1 (Startup)</option>
                    </select>
                    <button
                      onClick={handleBulkTierUpdate}
                      className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded-md hover:bg-blue-200 transition-colors"
                      disabled={loading}
                    >
                      Update Tier
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCompanies(new Set());
                      setShowBulkActions(false);
                    }}
                    className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Company Form */}
          {showForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCompany ? 'Edit Company' : 'Add New Company'}
              </h3>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tier *
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData(prev => ({ ...prev, tier: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={5}>Tier 5 (FAANG)</option>
                    <option value={4}>Tier 4 (Large Tech)</option>
                    <option value={3}>Tier 3 (Mid-size)</option>
                    <option value={2}>Tier 2 (Growing)</option>
                    <option value={1}>Tier 1 (Startup)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry *
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Technology, Finance, Healthcare"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. San Francisco, CA"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://logo.clearbit.com/company.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Brief description of the company..."
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                  >
                    {editingCompany ? 'Update' : 'Create'} Company
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Companies Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCompanies.size === filteredCompanies.length && filteredCompanies.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interviewers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCompanies.has(company.id)}
                        onChange={() => handleSelectCompany(company.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {company.logo_url && (
                          <img
                            className="h-8 w-8 rounded-full mr-3"
                            src={company.logo_url}
                            alt={company.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {company.name}
                          </div>
                          {company.website && (
                            <div className="text-sm text-gray-500">
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-600"
                              >
                                {company.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierColor(company.tier)}`}>
                        {getTierLabel(company.tier)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.industry}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.location}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {company.recruiters && company.recruiters.length > 0 ? (
                            company.recruiters.slice(0, 2).map((recruiter) => (
                              <a
                                key={recruiter.id}
                                href={recruiter.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200 transition-colors"
                                title={recruiter.position}
                              >
                                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                {recruiter.name}
                              </a>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">No interviewers</span>
                          )}
                          {company.recruiters && company.recruiters.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{company.recruiters.length - 2} more
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddInterviewer(company)}
                          className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200 transition-colors"
                          title="Add Interviewer"
                        >
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(company)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(company.id, company.name)}
                        className="text-red-600 hover:text-red-900"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCompanies.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {companies.length === 0 ? 'No companies found.' : 'No companies match your filters.'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {companies.length === 0 ? 'Add companies to get started.' : 'Try adjusting your search criteria.'}
              </p>
            </div>
          )}
        </div>

        {/* Tier System Statistics */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tier System Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[5, 4, 3, 2, 1].map((tier) => {
              const tierCompanies = companies.filter(c => c.tier === tier);
              const totalInterviewers = tierCompanies.reduce((sum, c) => sum + (c.recruiters?.length || 0), 0);
              
              return (
                <div key={tier} className="text-center">
                  <div className={`px-3 py-2 rounded-lg ${getTierColor(tier)}`}>
                    {getTierLabel(tier)}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {tierCompanies.length} companies
                  </p>
                  <p className="text-xs text-gray-400">
                    {totalInterviewers} interviewers
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Interviewer Modal */}
      {showInterviewerModal && selectedCompany && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Interviewer to {selectedCompany.name}
              </h3>
              
              <form onSubmit={handleInterviewerSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={interviewerData.name}
                    onChange={(e) => setInterviewerData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position *
                  </label>
                  <input
                    type="text"
                    value={interviewerData.position}
                    onChange={(e) => setInterviewerData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Senior Technical Recruiter"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={interviewerData.email}
                    onChange={(e) => setInterviewerData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn URL *
                  </label>
                  <input
                    type="url"
                    value={interviewerData.linkedin_url}
                    onChange={(e) => setInterviewerData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/in/username"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={interviewerData.is_active}
                      onChange={(e) => setInterviewerData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleInterviewerCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                  >
                    Add Interviewer
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 