import { fetchWithAuth } from './authApi';
import {
  Company,
  CompanyCreateInput,
  CompanyUpdateInput,
  RelationshipStatus,
} from '../types/crm';

/**
 * Normalizes backend company response into the frontend Company interface
 */
export function normalizeCompany(item: any): Company {
  return {
    id: String(item.id),
    name: item.name,
    industry: item.industry || 'General Enterprise',
    relationshipStatus: (item.relationship_status || 'prospect') as RelationshipStatus,
    location: item.location || 'Global / Remote',
    website: item.website ? item.website.replace(/^https?:\/\//, '') : '',
    notes: item.notes || '',
    firstEngagedDate: item.first_engaged_date || '',
    lastInteractionDate: item.last_interaction_date || '',
    stats: item.stats || {
      total_projects: 0,
      closed_projects: 0,
      ongoing_projects: 0,
      lost_projects: 0,
      inquiry_count: 0,
      contacts_count: 0,
      pending_follow_ups: 0,
      has_worked_before: false,
    },
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const errorData = await res.json();
    if (errorData?.detail) {
      if (typeof errorData.detail === 'string') {
        return errorData.detail;
      }
      if (Array.isArray(errorData.detail)) {
        return errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      }
    }
    return `Request failed with status ${res.status}`;
  } catch {
    return `Server returned status ${res.status}`;
  }
}

export const companyApi = {
  /**
   * Fetch paginated list of companies with optional status and search filters
   */
  async getCompanies(params?: {
    status?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ total: number; items: Company[] }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') {
      query.append('status', params.status);
    }
    if (params?.search) {
      query.append('search', params.search);
    }
    if (params?.skip !== undefined) {
      query.append('skip', String(params.skip));
    }
    if (params?.limit !== undefined) {
      query.append('limit', String(params.limit));
    }

    const endpoint = `/companies${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetchWithAuth(endpoint);

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    return {
      total: data.total,
      items: Array.isArray(data.items) ? data.items.map(normalizeCompany) : [],
    };
  },

  /**
   * Fetch a single company with computed stats by ID
   */
  async getCompanyById(companyId: string | number): Promise<Company> {
    const res = await fetchWithAuth(`/companies/${companyId}`);

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    return normalizeCompany(data);
  },

  /**
   * Create a new company record (with duplicate name validation)
   */
  async createCompany(data: CompanyCreateInput): Promise<Company> {
    const payload: Record<string, any> = {
      name: data.name.trim(),
      industry: data.industry?.trim() || 'General Enterprise',
      relationship_status: data.relationship_status || 'prospect',
      location: data.location?.trim() || 'Global / Remote',
      website: data.website ? data.website.trim().replace(/^https?:\/\//, '') : null,
      notes: data.notes?.trim() || null,
      first_engaged_date: data.first_engaged_date || undefined,
    };

    const res = await fetchWithAuth('/companies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const created = await res.json();
    return normalizeCompany(created);
  },

  /**
   * Update an existing company record
   */
  async updateCompany(
    companyId: string | number,
    data: CompanyUpdateInput
  ): Promise<Company> {
    const payload: Record<string, any> = {};

    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.industry !== undefined) payload.industry = data.industry.trim();
    if (data.relationship_status !== undefined) payload.relationship_status = data.relationship_status;
    if (data.location !== undefined) payload.location = data.location.trim();
    if (data.website !== undefined) {
      payload.website = data.website ? data.website.trim().replace(/^https?:\/\//, '') : null;
    }
    if (data.notes !== undefined) payload.notes = data.notes.trim();
    if (data.first_engaged_date !== undefined) payload.first_engaged_date = data.first_engaged_date;
    if (data.last_interaction_date !== undefined) payload.last_interaction_date = data.last_interaction_date;

    const res = await fetchWithAuth(`/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const updated = await res.json();
    return normalizeCompany(updated);
  },

  /**
   * Soft-delete a company record
   */
  async deleteCompany(companyId: string | number): Promise<{ message: string }> {
    const res = await fetchWithAuth(`/companies/${companyId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    return await res.json();
  },
};
