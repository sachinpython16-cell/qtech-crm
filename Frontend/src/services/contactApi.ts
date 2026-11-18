import { fetchWithAuth } from './authApi';
import {
  ContactPerson,
  ContactCreateInput,
  ContactUpdateInput,
} from '../types/crm';

export function normalizeContact(item: any): ContactPerson {
  return {
    id: String(item.id),
    companyId: String(item.company_id),
    name: item.name,
    designation: item.designation || 'Contact Person',
    email: item.email || '',
    phone: item.phone || '',
    isPrimary: Boolean(item.is_primary),
    notes: item.notes || '',
    lastContactedDate: item.last_contacted_date || '',
    company_name: item.company_name,
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

export const contactApi = {
  /**
   * Fetch paginated contacts with optional company or search filters
   */
  async getContacts(params?: {
    company_id?: string | number;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ total: number; items: ContactPerson[] }> {
    const query = new URLSearchParams();
    if (params?.company_id) {
      query.append('company_id', String(params.company_id));
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

    const endpoint = `/contacts${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetchWithAuth(endpoint);

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    return {
      total: data.total,
      items: Array.isArray(data.items) ? data.items.map(normalizeContact) : [],
    };
  },

  /**
   * Fetch single contact by ID
   */
  async getContactById(contactId: string | number): Promise<ContactPerson> {
    const res = await fetchWithAuth(`/contacts/${contactId}`);
    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }
    const data = await res.json();
    return normalizeContact(data);
  },

  /**
   * Create a new contact person
   */
  async createContact(data: ContactCreateInput): Promise<ContactPerson> {
    const payload: Record<string, any> = {
      company_id: Number(data.company_id),
      name: data.name.trim(),
      designation: data.designation?.trim() || 'Contact Person',
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      is_primary: Boolean(data.is_primary),
      notes: data.notes?.trim() || null,
      last_contacted_date: data.last_contacted_date || undefined,
    };

    const res = await fetchWithAuth('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const created = await res.json();
    return normalizeContact(created);
  },

  /**
   * Update existing contact person
   */
  async updateContact(
    contactId: string | number,
    data: ContactUpdateInput
  ): Promise<ContactPerson> {
    const payload: Record<string, any> = {};
    if (data.company_id !== undefined) payload.company_id = Number(data.company_id);
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.designation !== undefined) payload.designation = data.designation.trim();
    if (data.email !== undefined) payload.email = data.email?.trim() || null;
    if (data.phone !== undefined) payload.phone = data.phone?.trim() || null;
    if (data.is_primary !== undefined) payload.is_primary = Boolean(data.is_primary);
    if (data.notes !== undefined) payload.notes = data.notes?.trim() || null;
    if (data.last_contacted_date !== undefined) payload.last_contacted_date = data.last_contacted_date;

    const res = await fetchWithAuth(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    const updated = await res.json();
    return normalizeContact(updated);
  },

  /**
   * Soft-delete contact person
   */
  async deleteContact(contactId: string | number): Promise<{ message: string }> {
    const res = await fetchWithAuth(`/contacts/${contactId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }

    return await res.json();
  },
};
