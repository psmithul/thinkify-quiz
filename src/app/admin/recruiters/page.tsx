'use client';

import { useState, useEffect } from 'react';
import { supabaseAdmin, createAdminOperation } from '@/lib/supabaseAdmin';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { formatErrorMessage } from '@/utils/errorHandler';

interface Company {
  id: string;
  name: string;
  tier: number;
}

interface Recruiter {
  id: string;
  name: string;
  linkedin_url: string;
  email?: string;
  position?: string;
  company_id: string;
  bio?: string;
  profile_image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
}

interface RecruiterFormData {
  name: string;
  linkedin_url: string;
  email: string;
  position: string;
  company_id: string;
  bio: string;
  profile_image_url: string;
  is_active: boolean;
}

export default function RecruitersAdminPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecruiter, setEditingRecruiter] = useState<Recruiter | null>(null);
  const [formData, setFormData] = useState<RecruiterFormData>({
    name: '',
    linkedin_url: '',
    email: '',
    position: '',
    company_id: '',
    bio: '',
    profile_image_url: '',
    is_active: true
  });

  const adminOps = createAdminOperation();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/auth/login');
      return;
    }
    if (isAdmin) {
      fetchRecruiters();
      fetchCompanies();
    }
  }, [user, isAdmin, isLoading, router]);

  const fetchRecruiters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from('recruiters')
        .select(`
          *,
          company:companies(id, name, tier)
        `)
        .order('name');

      if (error) throw error;
      setRecruiters(data || []);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('companies')
        .select('id, name, tier')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      // Non-critical error, companies list might just be empty
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      if (editingRecruiter) {
        // Update existing recruiter
        await adminOps.updateRecruiter(editingRecruiter.id, formData);
      } else {
        // Create new recruiter
        await adminOps.createRecruiter(formData);
      }

      setShowForm(false);
      setEditingRecruiter(null);
      resetForm();
      await fetchRecruiters();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (recruiter: Recruiter) => {
    setEditingRecruiter(recruiter);
    setFormData({
      name: recruiter.name,
      linkedin_url: recruiter.linkedin_url,
      email: recruiter.email || '',
      position: recruiter.position || '',
      company_id: recruiter.company_id,
      bio: recruiter.bio || '',
      profile_image_url: recruiter.profile_image_url || '',
      is_active: recruiter.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      setLoading(true);
      await adminOps.deleteRecruiter(id);
      await fetchRecruiters();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      linkedin_url: '',
      email: '',
      position: '',
      company_id: '',
      bio: '',
      profile_image_url: '',
      is_active: true
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecruiter(null);
    resetForm();
  };

  if (isLoading || !isAdmin) {
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
          <h1 className="text-3xl font-bold text-gray-900">Recruiter Management</h1>
          <p className="text-gray-600 mt-2">
            Manage company recruiters and their LinkedIn connections.
          </p>
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

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Recruiters ({recruiters.length})
              </h2>
              <Button 
                variant="primary"
                onClick={() => setShowForm(true)}
                disabled={loading}
              >
                Add Recruiter
              </Button>
            </div>
          </div>

          {showForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRecruiter ? 'Edit Recruiter' : 'Add New Recruiter'}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Senior Technical Recruiter"
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
                    Profile Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.profile_image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, profile_image_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Brief description of the recruiter's background..."
                  />
                </div>

                <div>
                  <label className="flex items-center">
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
                    {editingRecruiter ? 'Update' : 'Create'} Recruiter
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recruiter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LinkedIn
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
                {recruiters.map((recruiter) => (
                  <tr key={recruiter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {recruiter.profile_image_url && (
                          <img
                            className="h-8 w-8 rounded-full mr-3"
                            src={recruiter.profile_image_url}
                            alt={recruiter.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {recruiter.name}
                          </div>
                          {recruiter.email && (
                            <div className="text-sm text-gray-500">
                              {recruiter.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {recruiter.company?.name || 'N/A'}
                      </div>
                      {recruiter.company?.tier && (
                        <div className="text-sm text-gray-500">
                          Tier {recruiter.company.tier}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {recruiter.position || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={recruiter.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        LinkedIn Profile
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        recruiter.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {recruiter.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(recruiter)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(recruiter.id, recruiter.name)}
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

          {recruiters.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No recruiters found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Add recruiters to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 