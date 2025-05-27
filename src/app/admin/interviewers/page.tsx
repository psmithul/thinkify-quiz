'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { supabaseAdmin, createAdminOperation } from '@/lib/supabaseAdmin';
import { Button } from '@/components/Button';
import { formatErrorMessage } from '@/utils/errorHandler';

interface Company {
  id: string;
  name: string;
  tier: number;
}

interface Interviewer {
  id: string;
  name: string;
  position: string;
  email: string;
  linkedin_url: string;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
  companies?: Company;
}

interface InterviewerFormData {
  name: string;
  position: string;
  email: string;
  linkedin_url: string;
  is_active: boolean;
  company_id: string;
}

export default function InterviewersAdminPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredInterviewers, setFilteredInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingInterviewer, setEditingInterviewer] = useState<Interviewer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [formData, setFormData] = useState<InterviewerFormData>({
    name: '',
    position: '',
    email: '',
    linkedin_url: '',
    is_active: true,
    company_id: ''
  });

  const adminOps = createAdminOperation();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth/login');
      return;
    }
    if (isAdmin) {
      fetchData();
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    // Apply filters and search
    let filtered = interviewers;

    if (searchTerm) {
      filtered = filtered.filter(interviewer => 
        interviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interviewer.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interviewer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interviewer.companies?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (companyFilter !== 'all') {
      filtered = filtered.filter(interviewer => interviewer.company_id === companyFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(interviewer => 
        statusFilter === 'active' ? interviewer.is_active : !interviewer.is_active
      );
    }

    setFilteredInterviewers(filtered);
  }, [interviewers, searchTerm, companyFilter, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch interviewers with company data
      const { data: interviewersData, error: interviewersError } = await supabaseAdmin
        .from('recruiters')
        .select(`
          *,
          companies:companies(id, name, tier)
        `)
        .order('created_at', { ascending: false });

      if (interviewersError) throw interviewersError;

      // Fetch companies for the form dropdown
      const { data: companiesData, error: companiesError } = await supabaseAdmin
        .from('companies')
        .select('id, name, tier')
        .order('name');

      if (companiesError) throw companiesError;

      setInterviewers(interviewersData || []);
      setCompanies(companiesData || []);
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
      
      if (editingInterviewer) {
        await adminOps.updateRecruiter(editingInterviewer.id, formData);
      } else {
        await adminOps.createRecruiter(formData);
      }

      setShowForm(false);
      setEditingInterviewer(null);
      resetForm();
      await fetchData();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (interviewer: Interviewer) => {
    setEditingInterviewer(interviewer);
    setFormData({
      name: interviewer.name,
      position: interviewer.position,
      email: interviewer.email,
      linkedin_url: interviewer.linkedin_url,
      is_active: interviewer.is_active,
      company_id: interviewer.company_id
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      setLoading(true);
      await adminOps.deleteRecruiter(id);
      await fetchData();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (interviewer: Interviewer) => {
    try {
      setLoading(true);
      await adminOps.updateRecruiter(interviewer.id, {
        is_active: !interviewer.is_active
      });
      await fetchData();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      email: '',
      linkedin_url: '',
      is_active: true,
      company_id: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingInterviewer(null);
    resetForm();
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
              <h1 className="text-3xl font-bold text-gray-900">Interviewer Management</h1>
              <p className="text-gray-600 mt-2">
                Manage interviewers and their company associations.
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
                Search Interviewers
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name, position, email, or company..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Company
              </label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Companies</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name} (Tier {company.tier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setCompanyFilter('all');
                  setStatusFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Interviewers Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Interviewers ({filteredInterviewers.length} of {interviewers.length})
              </h2>
              <Button 
                variant="primary"
                onClick={() => setShowForm(true)}
                disabled={loading}
              >
                Add Interviewer
              </Button>
            </div>
          </div>

          {/* Interviewer Form */}
          {showForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingInterviewer ? 'Edit Interviewer' : 'Add New Interviewer'}
              </h3>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
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
                    Position *
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Senior Technical Recruiter"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company *
                  </label>
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name} (Tier {company.tier})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn URL *
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/in/username"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
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
                    {editingInterviewer ? 'Update' : 'Create'} Interviewer
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Interviewers Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interviewer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInterviewers.map((interviewer) => (
                  <tr key={interviewer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {interviewer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            <a
                              href={interviewer.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600"
                            >
                              LinkedIn Profile
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {interviewer.companies?.name}
                        </span>
                        {interviewer.companies?.tier && (
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getTierColor(interviewer.companies.tier)}`}>
                            Tier {interviewer.companies.tier}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {interviewer.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {interviewer.email || 'No email'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(interviewer)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          interviewer.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } transition-colors`}
                        disabled={loading}
                      >
                        {interviewer.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(interviewer)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(interviewer.id, interviewer.name)}
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

          {filteredInterviewers.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {interviewers.length === 0 ? 'No interviewers found.' : 'No interviewers match your filters.'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {interviewers.length === 0 ? 'Add interviewers to get started.' : 'Try adjusting your search criteria.'}
              </p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Interviewer Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {interviewers.filter(i => i.is_active).length}
              </div>
              <div className="text-sm text-blue-600">Active Interviewers</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {companies.length}
              </div>
              <div className="text-sm text-gray-600">Companies</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((interviewers.filter(i => i.is_active).length / Math.max(companies.length, 1)) * 10) / 10}
              </div>
              <div className="text-sm text-green-600">Avg. Active per Company</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 