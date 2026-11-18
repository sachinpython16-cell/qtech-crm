import { fetchWithAuth } from './authApi';
import { DashboardMetrics, LookupResponse } from '../types/crm';
import { normalizeCompany } from './companyApi';
import { normalizeContact } from './contactApi';
import { normalizeDeal } from './dealApi';

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const errorData = await res.json();
    if (errorData?.detail) {
      if (typeof errorData.detail === 'string') return errorData.detail;
      if (Array.isArray(errorData.detail)) {
        return errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      }
    }
    return `Request failed with status ${res.status}`;
  } catch {
    return `Server returned status ${res.status}`;
  }
}

export const dashboardApi = {
  /**
   * Fetch live computed dashboard KPIs
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await fetchWithAuth('/dashboard/metrics');
    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }
    return await res.json();
  },

  /**
   * Fast universal relationship search across companies, contacts, and inquiries
   */
  async universalLookup(query: string): Promise<LookupResponse> {
    const res = await fetchWithAuth(`/dashboard/lookup?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }
    const data = await res.json();
    return {
      query: data.query,
      has_matches: Boolean(data.has_matches),
      matched_companies: Array.isArray(data.matched_companies)
        ? data.matched_companies.map(normalizeCompany)
        : [],
      matched_contacts: Array.isArray(data.matched_contacts)
        ? data.matched_contacts.map(normalizeContact)
        : [],
      matched_deals: Array.isArray(data.matched_deals)
        ? data.matched_deals.map(normalizeDeal)
        : [],
    };
  },
};
