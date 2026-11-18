import { fetchWithAuth } from './authApi';
import {
  InteractionLog,
  InteractionCreateInput,
} from '../types/crm';

export function normalizeInteraction(item: any): InteractionLog {
  return {
    id: String(item.id),
    companyId: String(item.company_id),
    contactPersonId: item.contact_person_id ? String(item.contact_person_id) : '',
    inquiryDealId: item.inquiry_deal_id ? String(item.inquiry_deal_id) : undefined,
    date: item.date || '',
    type: item.type || item.interaction_type || 'Status Update',
    title: item.title,
    details: item.details || '',
    loggedBy: item.logged_by || 'Team Member',
    company_name: item.company_name,
    contact_name: item.contact_name,
    created_at: item.created_at,
  };
}

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

export const interactionApi = {
  /**
   * Fetch interaction timeline logs with optional company, contact, or deal filter
   */
  async getInteractions(params?: {
    company_id?: string | number;
    contact_person_id?: string | number;
    inquiry_deal_id?: string | number;
    skip?: number;
    limit?: number;
  }): Promise<{ total: number; items: InteractionLog[] }> {
    const query = new URLSearchParams();
    if (params?.company_id) query.append('company_id', String(params.company_id));
    if (params?.contact_person_id) query.append('contact_person_id', String(params.contact_person_id));
    if (params?.inquiry_deal_id) query.append('inquiry_deal_id', String(params.inquiry_deal_id));
    if (params?.skip !== undefined) query.append('skip', String(params.skip));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));

    const endpoint = `/interactions${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetchWithAuth(endpoint);

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    return {
      total: data.total,
      items: Array.isArray(data.items) ? data.items.map(normalizeInteraction) : [],
    };
  },

  /**
   * Log an interaction event (auto-updates company last_interaction_date)
   */
  async logInteraction(data: InteractionCreateInput): Promise<InteractionLog> {
    const payload: Record<string, any> = {
      company_id: Number(data.company_id),
      contact_person_id: data.contact_person_id ? Number(data.contact_person_id) : null,
      inquiry_deal_id: data.inquiry_deal_id ? Number(data.inquiry_deal_id) : null,
      date: data.date || undefined,
      interaction_type: data.interaction_type || 'Status Update',
      title: data.title.trim(),
      details: data.details?.trim() || null,
      logged_by: data.logged_by || 'Team Member',
    };

    const res = await fetchWithAuth('/interactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const created = await res.json();
    return normalizeInteraction(created);
  },
};
