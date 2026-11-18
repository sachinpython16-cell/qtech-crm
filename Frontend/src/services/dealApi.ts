import { fetchWithAuth } from './authApi';
import {
  InquiryDeal,
  DealCreateInput,
  DealUpdateInput,
  DealType,
  DealStatus,
  FollowUpSequence,
} from '../types/crm';

export function normalizeDeal(item: any): InquiryDeal {
  return {
    id: String(item.id),
    title: item.title,
    type: (item.deal_type || 'Inquiry') as DealType,
    companyId: String(item.company_id),
    contactPersonId: item.contact_person_id ? String(item.contact_person_id) : '',
    description: item.description || '',
    dateReceived: item.date_received || '',
    status: (item.status || 'New') as DealStatus,
    priority: (item.priority || 'Medium') as 'High' | 'Medium' | 'Low',
    currentFollowUpStage: (item.current_follow_up_stage || 'None') as FollowUpSequence | 'None',
    nextFollowUpDate: item.next_follow_up_date || undefined,
    notes: item.notes || '',
    closedDate: item.closed_date || undefined,
    lostReason: item.lost_reason || undefined,
    company_name: item.company_name,
    contact_name: item.contact_name,
    created_at: item.created_at,
    updated_at: item.updated_at,
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

export const dealApi = {
  /**
   * Fetch paginated deals with filters
   */
  async getDeals(params?: {
    company_id?: string | number;
    status?: string;
    priority?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ total: number; items: InquiryDeal[] }> {
    const query = new URLSearchParams();
    if (params?.company_id) query.append('company_id', String(params.company_id));
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params?.search) query.append('search', params.search);
    if (params?.skip !== undefined) query.append('skip', String(params.skip));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));

    const endpoint = `/deals${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetchWithAuth(endpoint);

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    return {
      total: data.total,
      items: Array.isArray(data.items) ? data.items.map(normalizeDeal) : [],
    };
  },

  /**
   * Fetch single deal by ID
   */
  async getDealById(dealId: string | number): Promise<InquiryDeal> {
    const res = await fetchWithAuth(`/deals/${dealId}`);
    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }
    const data = await res.json();
    return normalizeDeal(data);
  },

  /**
   * Create a new deal or inquiry (auto-schedules follow-up if next_follow_up_date is provided)
   */
  async createDeal(data: DealCreateInput): Promise<InquiryDeal> {
    const payload: Record<string, any> = {
      title: data.title.trim(),
      deal_type: data.deal_type || 'Inquiry',
      company_id: Number(data.company_id),
      contact_person_id: data.contact_person_id ? Number(data.contact_person_id) : null,
      description: data.description?.trim() || null,
      date_received: data.date_received || undefined,
      status: data.status || 'New',
      priority: data.priority || 'Medium',
      current_follow_up_stage: data.current_follow_up_stage || 'First Follow-Up',
      next_follow_up_date: data.next_follow_up_date || null,
      notes: data.notes?.trim() || null,
    };

    const res = await fetchWithAuth('/deals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const created = await res.json();
    return normalizeDeal(created);
  },

  /**
   * Update existing deal (status, priority, closedDate, lostReason)
   */
  async updateDeal(
    dealId: string | number,
    data: DealUpdateInput
  ): Promise<InquiryDeal> {
    const payload: Record<string, any> = {};
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.deal_type !== undefined) payload.deal_type = data.deal_type;
    if (data.company_id !== undefined) payload.company_id = Number(data.company_id);
    if (data.contact_person_id !== undefined) {
      payload.contact_person_id = data.contact_person_id ? Number(data.contact_person_id) : null;
    }
    if (data.description !== undefined) payload.description = data.description?.trim() || null;
    if (data.status !== undefined) payload.status = data.status;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.current_follow_up_stage !== undefined) payload.current_follow_up_stage = data.current_follow_up_stage;
    if (data.next_follow_up_date !== undefined) payload.next_follow_up_date = data.next_follow_up_date || null;
    if (data.notes !== undefined) payload.notes = data.notes?.trim() || null;
    if (data.closed_date !== undefined) payload.closed_date = data.closed_date;
    if (data.lost_reason !== undefined) payload.lost_reason = data.lost_reason?.trim() || null;

    const res = await fetchWithAuth(`/deals/${dealId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const updated = await res.json();
    return normalizeDeal(updated);
  },

  /**
   * Soft-delete deal
   */
  async deleteDeal(dealId: string | number): Promise<{ message: string }> {
    const res = await fetchWithAuth(`/deals/${dealId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    return await res.json();
  },
};
