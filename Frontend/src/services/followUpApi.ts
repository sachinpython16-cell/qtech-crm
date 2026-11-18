import { fetchWithAuth } from './authApi';
import {
  FollowUpRecord,
  FollowUpCreateInput,
  FollowUpCompleteInput,
  FollowUpRescheduleInput,
  FollowUpSequence,
  FollowUpStatus,
} from '../types/crm';

export function normalizeFollowUp(item: any): FollowUpRecord {
  return {
    id: String(item.id),
    inquiryDealId: String(item.inquiry_deal_id),
    companyId: String(item.company_id),
    contactPersonId: item.contact_person_id ? String(item.contact_person_id) : '',
    sequence: (item.sequence || 'First Follow-Up') as FollowUpSequence,
    status: (item.status || 'Pending') as FollowUpStatus,
    scheduledDate: item.scheduled_date || '',
    completedDate: item.completed_date || undefined,
    performedBy: item.performed_by || 'Account Lead',
    channel: item.channel || 'Phone Call',
    notes: item.notes || '',
    outcome: item.outcome || undefined,
    nextFollowUpDate: item.next_follow_up_date || undefined,
    company_name: item.company_name,
    contact_name: item.contact_name,
    deal_title: item.deal_title,
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

export const followUpApi = {
  /**
   * Fetch paginated follow-up records with status, sequence, and company filters
   */
  async getFollowUps(params?: {
    company_id?: string | number;
    deal_id?: string | number;
    status?: string;
    sequence?: string;
    overdue_only?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<{ total: number; items: FollowUpRecord[] }> {
    const query = new URLSearchParams();
    if (params?.company_id) query.append('company_id', String(params.company_id));
    if (params?.deal_id) query.append('deal_id', String(params.deal_id));
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.sequence && params.sequence !== 'all') query.append('sequence', params.sequence);
    if (params?.overdue_only !== undefined) query.append('overdue_only', String(params.overdue_only));
    if (params?.skip !== undefined) query.append('skip', String(params.skip));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));

    const endpoint = `/followups${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetchWithAuth(endpoint);

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    return {
      total: data.total,
      items: Array.isArray(data.items) ? data.items.map(normalizeFollowUp) : [],
    };
  },

  /**
   * Schedule a new follow-up
   */
  async scheduleFollowUp(data: FollowUpCreateInput): Promise<FollowUpRecord> {
    const payload: Record<string, any> = {
      inquiry_deal_id: data.inquiry_deal_id ? Number(data.inquiry_deal_id) : null,
      company_id: Number(data.company_id),
      contact_person_id: data.contact_person_id ? Number(data.contact_person_id) : null,
      sequence: data.sequence || 'First Follow-Up',
      scheduled_date: data.scheduled_date,
      performed_by: data.performed_by || 'Account Lead',
      channel: data.channel || 'Phone Call',
      notes: data.notes?.trim() || null,
    };

    const res = await fetchWithAuth('/followups', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const created = await res.json();
    return normalizeFollowUp(created);
  },

  /**
   * Complete a follow-up and optionally auto-advance sequence
   */
  async completeFollowUp(
    followUpId: string | number,
    data: FollowUpCompleteInput
  ): Promise<{ completed: FollowUpRecord; next_follow_up?: FollowUpRecord }> {
    const payload: Record<string, any> = {
      completed_date: data.completed_date || undefined,
      outcome: data.outcome?.trim() || null,
      next_follow_up_date: data.next_follow_up_date || null,
      next_notes: data.next_notes?.trim() || null,
      schedule_next: Boolean(data.schedule_next),
    };

    const res = await fetchWithAuth(`/followups/${followUpId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const result = await res.json();
    return {
      completed: normalizeFollowUp(result.completed || result),
      next_follow_up: result.next_follow_up ? normalizeFollowUp(result.next_follow_up) : undefined,
    };
  },

  /**
   * Reschedule a follow-up
   */
  async rescheduleFollowUp(
    followUpId: string | number,
    data: FollowUpRescheduleInput
  ): Promise<FollowUpRecord> {
    const payload: Record<string, any> = {
      scheduled_date: data.scheduled_date,
      reason: data.reason?.trim() || null,
    };

    const res = await fetchWithAuth(`/followups/${followUpId}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const updated = await res.json();
    return normalizeFollowUp(updated);
  },

  /**
   * Delete follow-up
   */
  async deleteFollowUp(followUpId: string | number): Promise<{ message: string }> {
    const res = await fetchWithAuth(`/followups/${followUpId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    return await res.json();
  },
};
