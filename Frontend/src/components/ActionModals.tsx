import React, { useState, useEffect } from 'react';
import { X, Building2, UserPlus, Briefcase, CalendarClock, MessageSquare, AlertCircle, Loader2, Edit } from 'lucide-react';
import { Company, ContactPerson, InquiryDeal, FollowUpRecord, FollowUpSequence, DealType, DealStatus, RelationshipStatus } from '../types/crm';
import { advanceSequence } from '../services/storage';
import { SuggestiveCombobox } from './common/SuggestiveCombobox';
import {
  COMMON_INDUSTRIES,
  COMMON_LOCATIONS,
  COMMON_DESIGNATIONS,
  COMMON_PROJECT_TITLES,
  COMMON_LOST_REASONS,
  COMMON_CHANNELS,
  COMMON_PERFORMED_BY,
  COMMON_FOLLOW_UP_OUTCOMES,
  COMMON_INTERACTION_TYPES,
} from '../data/suggestionPresets';

const getTodayStr = () => new Date().toISOString().slice(0, 10);
const getFutureDateStr = (days: number = 7) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// ----------------------------------------------------
// 1. ADD COMPANY MODAL
// ----------------------------------------------------
interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCompanies: Company[];
  onAddCompany: (company: Omit<Company, 'id' | 'firstEngagedDate' | 'lastInteractionDate'>) => Promise<boolean | void> | void;
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  isOpen,
  onClose,
  existingCompanies,
  onAddCompany,
}) => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>('active');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Company name is required.');
      return;
    }

    // Client-side quick duplicate check
    const isDuplicate = existingCompanies.some(
      c => c.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (isDuplicate) {
      setError('A company with this name already exists in the system to avoid duplicate records.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onAddCompany({
        name: name.trim(),
        industry: industry.trim() || 'General Enterprise',
        relationshipStatus,
        location: location.trim() || 'Global / Remote',
        website: website.trim().replace(/^https?:\/\//, ''),
        notes: notes.trim(),
      });

      setName('');
      setIndustry('');
      setLocation('');
      setWebsite('');
      setNotes('');
      setError('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create company. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#EB673E]" />
            <h3 className="font-display font-bold text-base text-slate-900">Add New Company</h3>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Acme Industrial Dynamics"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SuggestiveCombobox
              label="Industry"
              value={industry}
              onChange={setIndustry}
              suggestions={[
                ...COMMON_INDUSTRIES,
                ...existingCompanies.map(c => c.industry),
              ]}
              placeholder="Select or type e.g. Healthcare Logistics"
            />

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Relationship Status</label>
              <select
                value={relationshipStatus}
                onChange={(e) => setRelationshipStatus(e.target.value as RelationshipStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                <option value="active">Currently Working With Us (Active)</option>
                <option value="previous">Previously Worked With (Past)</option>
                <option value="prospect">Prospect / New Inquiries</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SuggestiveCombobox
              label="Location"
              value={location}
              onChange={setLocation}
              suggestions={[
                ...COMMON_LOCATIONS,
                ...existingCompanies.map(c => c.location),
              ]}
              placeholder="Select or type e.g. Chicago, IL"
            />

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. acmeindustrial.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Relationship Context & Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Background on how we engaged, past agreements, key priorities..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-semibold text-white bg-[#EB673E] hover:bg-[#d85830] rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Saving...' : 'Save Company'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 1B. EDIT COMPANY MODAL
// ----------------------------------------------------
interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  companies?: Company[];
  onUpdateCompany: (companyId: string, data: Partial<Company>) => Promise<boolean | void> | void;
}

export const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  isOpen,
  onClose,
  company,
  companies = [],
  onUpdateCompany,
}) => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>('active');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [firstEngagedDate, setFirstEngagedDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setIndustry(company.industry || '');
      setRelationshipStatus(company.relationshipStatus || 'active');
      setLocation(company.location || '');
      setWebsite(company.website || '');
      setNotes(company.notes || '');
      setFirstEngagedDate(company.firstEngagedDate || '');
      setError('');
    }
  }, [company, isOpen]);

  if (!isOpen || !company) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Company name is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onUpdateCompany(company.id, {
        name: name.trim(),
        industry: industry.trim() || 'General Enterprise',
        relationshipStatus,
        location: location.trim() || 'Global / Remote',
        website: website.trim().replace(/^https?:\/\//, ''),
        notes: notes.trim(),
        firstEngagedDate: firstEngagedDate.trim() || company.firstEngagedDate,
      });
      setError('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update company. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#088395]" />
            <h3 className="font-display font-bold text-base text-slate-900">Edit Company Details</h3>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SuggestiveCombobox
              label="Industry"
              value={industry}
              onChange={setIndustry}
              suggestions={[
                ...COMMON_INDUSTRIES,
                ...companies.map(c => c.industry),
              ]}
              placeholder="Select or type custom..."
            />

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Relationship Status</label>
              <select
                value={relationshipStatus}
                onChange={(e) => setRelationshipStatus(e.target.value as RelationshipStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                <option value="active">Currently Working With Us (Active)</option>
                <option value="previous">Previously Worked With (Past)</option>
                <option value="prospect">Prospect / New Inquiries</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SuggestiveCombobox
              label="Location"
              value={location}
              onChange={setLocation}
              suggestions={[
                ...COMMON_LOCATIONS,
                ...companies.map(c => c.location),
              ]}
              placeholder="Select or type custom..."
            />

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">First Engaged Date</label>
            <input
              type="date"
              value={firstEngagedDate}
              onChange={(e) => setFirstEngagedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Relationship Context & Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-semibold text-white bg-[#088395] hover:bg-[#077080] rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. ADD CONTACT PERSON MODAL
// ----------------------------------------------------
interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  existingContacts: ContactPerson[];
  initialCompanyId?: string;
  onAddContact: (contact: Omit<ContactPerson, 'id' | 'lastContactedDate'>) => Promise<boolean | void> | void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  companies,
  existingContacts,
  initialCompanyId,
  onAddContact,
}) => {
  const [companyId, setCompanyId] = useState(initialCompanyId || '');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize companyId when modal opens or companies list changes
  React.useEffect(() => {
    if (isOpen) {
      if (initialCompanyId && companies.some(c => String(c.id) === String(initialCompanyId))) {
        setCompanyId(String(initialCompanyId));
      } else if (companies.length > 0) {
        if (!companyId || !companies.some(c => String(c.id) === String(companyId))) {
          setCompanyId(String(companies[0].id));
        }
      } else {
        setCompanyId('');
      }
      setError('');
    }
  }, [isOpen, initialCompanyId, companies]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !companyId.trim() || Number(companyId) <= 0) {
      setError('Please select an associated company. Create a company first if none exist.');
      return;
    }
    if (!name.trim()) {
      setError('Contact name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required for unique relationship tracking.');
      return;
    }

    // Check duplicate email
    const duplicate = existingContacts.find(
      c => c.email.toLowerCase().trim() === email.toLowerCase().trim()
    );
    if (duplicate) {
      setError(`A contact with email "${email}" already exists (${duplicate.name}). Avoiding duplicates as required.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onAddContact({
        companyId: String(companyId),
        name: name.trim(),
        designation: designation.trim() || 'Representative',
        email: email.trim(),
        phone: phone.trim(),
        isPrimary,
        notes: notes.trim(),
      });

      setName('');
      setDesignation('');
      setEmail('');
      setPhone('');
      setIsPrimary(false);
      setNotes('');
      setError('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create contact person.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#088395]" />
            <h3 className="font-display font-bold text-base text-slate-900">Add Contact Person</h3>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Associated Company *</label>
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            >
              {companies.length === 0 ? (
                <option value="" disabled>No companies found - please create one first</option>
              ) : (
                companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} {comp.industry ? `(${comp.industry})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              />
            </div>

            <SuggestiveCombobox
              label="Designation / Title"
              value={designation}
              onChange={setDesignation}
              suggestions={[
                ...COMMON_DESIGNATIONS,
                ...existingContacts.map(c => c.designation),
              ]}
              placeholder="Select or type e.g. VP of Operations"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. sjenkins@company.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPrimary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 text-[#088395] rounded border-slate-300"
            />
            <label htmlFor="isPrimary" className="text-slate-700 font-medium cursor-pointer">
              Mark as Primary Contact for this company
            </label>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Notes / Relationship Context</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Communication preferences, background notes..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-semibold text-white bg-[#088395] hover:bg-[#077080] rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Saving...' : 'Save Contact'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2B. EDIT CONTACT PERSON MODAL
// ----------------------------------------------------
interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: ContactPerson | null;
  companies: Company[];
  onUpdateContact: (contactId: string, data: Partial<ContactPerson>) => Promise<boolean | void> | void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  companies,
  onUpdateContact,
}) => {
  const [companyId, setCompanyId] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contact) {
      setCompanyId(contact.companyId || (companies[0]?.id || ''));
      setName(contact.name || '');
      setDesignation(contact.designation || '');
      setEmail(contact.email || '');
      setPhone(contact.phone || '');
      setIsPrimary(Boolean(contact.isPrimary));
      setNotes(contact.notes || '');
      setError('');
    }
  }, [contact, isOpen, companies]);

  if (!isOpen || !contact) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Contact name is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onUpdateContact(contact.id, {
        companyId,
        name: name.trim(),
        designation: designation.trim() || 'Representative',
        email: email.trim(),
        phone: phone.trim(),
        isPrimary,
        notes: notes.trim(),
      });
      setError('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#088395]" />
            <h3 className="font-display font-bold text-base text-slate-900">Edit Contact Details</h3>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Associated Company</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            >
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              />
            </div>

            <SuggestiveCombobox
              label="Designation / Title"
              value={designation}
              onChange={setDesignation}
              suggestions={COMMON_DESIGNATIONS}
              placeholder="Select or type custom..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editIsPrimary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 text-[#088395] rounded border-slate-300"
            />
            <label htmlFor="editIsPrimary" className="text-slate-700 font-medium cursor-pointer">
              Mark as Primary Contact for this company
            </label>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-semibold text-white bg-[#088395] hover:bg-[#077080] rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. ADD DEAL / INQUIRY MODAL (NO FINANCIAL DATA!)
// ----------------------------------------------------
interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  contacts: ContactPerson[];
  initialCompanyId?: string;
  initialContactId?: string;
  onAddDeal: (deal: Omit<InquiryDeal, 'id' | 'currentFollowUpStage'>) => Promise<boolean | void> | void;
}

export const AddDealModal: React.FC<AddDealModalProps> = ({
  isOpen,
  onClose,
  companies,
  contacts,
  initialCompanyId,
  initialContactId,
  onAddDeal,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DealType>('Inquiry');
  const [companyId, setCompanyId] = useState(initialCompanyId || '');
  const [contactPersonId, setContactPersonId] = useState(initialContactId || '');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [notes, setNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(() => getFutureDateStr(3));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialCompanyId && companies.some(c => String(c.id) === String(initialCompanyId))) {
        setCompanyId(String(initialCompanyId));
      } else if (companies.length > 0) {
        if (!companyId || !companies.some(c => String(c.id) === String(companyId))) {
          setCompanyId(String(companies[0].id));
        }
      } else {
        setCompanyId('');
      }

      if (initialContactId) {
        setContactPersonId(String(initialContactId));
      }
      setError('');
    }
  }, [isOpen, initialCompanyId, initialContactId, companies]);

  // Available contacts for selected company
  const companyContacts = contacts.filter(c => String(c.companyId) === String(companyId));

  // Set default contact if not set
  React.useEffect(() => {
    if (companyContacts.length > 0 && (!contactPersonId || !companyContacts.some(c => String(c.id) === String(contactPersonId)))) {
      setContactPersonId(String(companyContacts[0].id));
    }
  }, [companyId, companyContacts, contactPersonId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !companyId.trim() || Number(companyId) <= 0) {
      setError('Please select an associated company.');
      return;
    }
    if (!title.trim()) {
      setError('Title / project topic is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onAddDeal({
        title: title.trim(),
        type,
        companyId,
        contactPersonId: contactPersonId || (companyContacts[0]?.id || ''),
        description: description.trim() || 'Work scope and inquiry evaluation.',
        dateReceived: getTodayStr(),
        status: 'New',
        priority,
        notes: notes.trim(),
        nextFollowUpDate,
      });

      setTitle('');
      setDescription('');
      setNotes('');
      setError('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#EB673E]" />
            <h3 className="font-display font-bold text-base text-slate-900">New Deal / Inquiry</h3>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <SuggestiveCombobox
            label="Title / Project Topic"
            required
            value={title}
            onChange={setTitle}
            suggestions={COMMON_PROJECT_TITLES}
            placeholder="Select a project scope or type custom..."
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Company *</label>
              <select
                required
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Key Contact Person</label>
              <select
                value={contactPersonId}
                onChange={(e) => setContactPersonId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                <option value="">Unassigned</option>
                {companyContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Inquiry / Deal Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DealType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                <option value="Inquiry">General Inquiry</option>
                <option value="Project Deal">Project Deal</option>
                <option value="Pilot Program">Pilot Program</option>
                <option value="Technical Audit">Technical Audit</option>
                <option value="Implementation">Implementation</option>
                <option value="Retainer">Retainer Service</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Description & Requirements</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is the client requesting or what work needs to be delivered?"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Target Next Outreach Date</label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-semibold text-white bg-[#EB673E] hover:bg-[#d85830] rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Creating...' : 'Create Deal / Inquiry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3B. EDIT DEAL / INQUIRY MODAL
// ----------------------------------------------------
interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: InquiryDeal | null;
  companies: Company[];
  contacts: ContactPerson[];
  onUpdateDeal: (dealId: string, data: Partial<InquiryDeal>) => Promise<boolean | void> | void;
}

export const EditDealModal: React.FC<EditDealModalProps> = ({
  isOpen,
  onClose,
  deal,
  companies,
  contacts,
  onUpdateDeal,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DealType>('Inquiry');
  const [companyId, setCompanyId] = useState('');
  const [contactPersonId, setContactPersonId] = useState('');
  const [status, setStatus] = useState<DealStatus>('New');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [closedDate, setClosedDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (deal) {
      setTitle(deal.title || '');
      setType(deal.type || 'Inquiry');
      setCompanyId(deal.companyId || (companies[0]?.id || ''));
      setContactPersonId(deal.contactPersonId || '');
      setStatus(deal.status || 'New');
      setPriority(deal.priority || 'Medium');
      setDescription(deal.description || '');
      setNotes(deal.notes || '');
      setLostReason(deal.lostReason || '');
      setClosedDate(deal.closedDate || '');
      setError('');
    }
  }, [deal, isOpen, companies]);

  const companyContacts = contacts.filter(c => c.companyId === companyId);

  if (!isOpen || !deal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onUpdateDeal(deal.id, {
        title: title.trim(),
        type,
        companyId,
        contactPersonId: contactPersonId || '',
        status,
        priority,
        description: description.trim(),
        notes: notes.trim(),
        lostReason: status === 'Lost' ? lostReason.trim() : undefined,
        closedDate: status === 'Closed' ? (closedDate || getTodayStr()) : undefined,
      });
      setError('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#088395]" />
            <h3 className="font-display font-bold text-base text-slate-900">Edit Deal / Inquiry</h3>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <SuggestiveCombobox
            label="Title / Project Scope"
            required
            value={title}
            onChange={setTitle}
            suggestions={COMMON_PROJECT_TITLES}
            placeholder="Select a project scope or type custom..."
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Company</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Person</label>
              <select
                value={contactPersonId}
                onChange={(e) => setContactPersonId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                <option value="">Unassigned</option>
                {companyContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DealType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                <option value="Inquiry">General Inquiry</option>
                <option value="Project Deal">Project Deal</option>
                <option value="Pilot Program">Pilot Program</option>
                <option value="Technical Audit">Technical Audit</option>
                <option value="Implementation">Implementation</option>
                <option value="Retainer">Retainer Service</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DealStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Follow-Up Required">Follow-Up Required</option>
                <option value="Closed">Closed / Delivered</option>
                <option value="Lost">Lost / Cancelled</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {status === 'Lost' && (
            <SuggestiveCombobox
              label="Reason for Lost Deal"
              required
              value={lostReason}
              onChange={setLostReason}
              suggestions={COMMON_LOST_REASONS}
              placeholder="Select reason or type custom details..."
            />
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-semibold text-white bg-[#088395] hover:bg-[#077080] rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. LOG / COMPLETE FOLLOW-UP MODAL (WITH ADVANCE SEQUENCE)
// ----------------------------------------------------
interface CompleteFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUp: FollowUpRecord | null;
  onCompleteFollowUp: (
    followUpId: string,
    outcome: string,
    notes: string,
    scheduleNext: boolean,
    nextDate?: string
  ) => Promise<boolean | void> | void;
}

export const CompleteFollowUpModal: React.FC<CompleteFollowUpModalProps> = ({
  isOpen,
  onClose,
  followUp,
  onCompleteFollowUp,
}) => {
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduleNext, setScheduleNext] = useState(true);
  const [nextDate, setNextDate] = useState(() => getFutureDateStr(5));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !followUp) return null;

  const nextSeq = advanceSequence(followUp.sequence);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await onCompleteFollowUp(
        followUp.id,
        outcome.trim() || 'Touchpoint completed successfully.',
        notes.trim() || followUp.notes,
        scheduleNext,
        scheduleNext ? nextDate : undefined
      );
      setError('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete follow-up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[#088395]" />
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Log Completed {followUp.sequence}
              </h3>
              <span className="text-[11px] text-slate-500">Record touchpoint outcome and sequence progression</span>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Current Touchpoint</div>
            <div className="font-semibold text-slate-900 mt-0.5">{followUp.sequence} via {followUp.channel}</div>
            <p className="text-slate-600 mt-1">{followUp.notes}</p>
          </div>

          <SuggestiveCombobox
            label="Touchpoint Outcome / Summary"
            required
            value={outcome}
            onChange={setOutcome}
            suggestions={COMMON_FOLLOW_UP_OUTCOMES}
            placeholder="Select quick outcome template or type custom notes..."
          />

          {/* Sequence Progression Option */}
          <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="scheduleNext"
                checked={scheduleNext}
                onChange={(e) => setScheduleNext(e.target.checked)}
                className="w-4 h-4 text-[#088395] rounded border-slate-300"
              />
              <label htmlFor="scheduleNext" className="font-semibold text-slate-800 cursor-pointer">
                Automatically schedule next stage: <strong className="text-[#088395]">{nextSeq}</strong>
              </label>
            </div>

            {scheduleNext && (
              <div className="pl-6 pt-1">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Next Follow-Up Date ({nextSeq})
                </label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#088395]"
                />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-semibold text-white bg-[#088395] hover:bg-[#077080] rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Saving...' : 'Complete & Save Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 5. SCHEDULE NEW FOLLOW-UP MODAL
// ----------------------------------------------------
interface ScheduleFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  contacts: ContactPerson[];
  deals: InquiryDeal[];
  initialDealId?: string;
  initialContactId?: string;
  onScheduleFollowUp: (record: Omit<FollowUpRecord, 'id' | 'status'>) => Promise<boolean | void> | void;
}

export const ScheduleFollowUpModal: React.FC<ScheduleFollowUpModalProps> = ({
  isOpen,
  onClose,
  companies,
  contacts,
  deals,
  initialDealId,
  initialContactId,
  onScheduleFollowUp,
}) => {
  const [selectedDealId, setSelectedDealId] = useState(initialDealId || '');
  const [sequence, setSequence] = useState<FollowUpSequence>('First Follow-Up');
  const [channel, setChannel] = useState<any>('Phone Call');
  const [performedBy, setPerformedBy] = useState('Account Lead');
  const [scheduledDate, setScheduledDate] = useState(() => getFutureDateStr(3));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialDealId && deals.some(d => String(d.id) === String(initialDealId))) {
        setSelectedDealId(String(initialDealId));
      } else if (deals.length > 0) {
        if (!selectedDealId || !deals.some(d => String(d.id) === String(selectedDealId))) {
          setSelectedDealId(String(deals[0].id));
        }
      } else {
        setSelectedDealId('');
      }
      setError('');
    }
  }, [isOpen, initialDealId, deals]);

  if (!isOpen) return null;

  const currentDeal = deals.find(d => d.id === selectedDealId);
  const company = companies.find(c => c.id === currentDeal?.companyId);
  const contact = contacts.find(c => c.id === currentDeal?.contactPersonId) || contacts.find(c => c.id === initialContactId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeal || !company) {
      setError('Please select a valid deal and company.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onScheduleFollowUp({
        inquiryDealId: currentDeal.id,
        companyId: company.id,
        contactPersonId: contact?.id || currentDeal.contactPersonId,
        sequence,
        channel,
        scheduledDate,
        performedBy: performedBy.trim() || 'Account Lead',
        notes: notes.trim() || `Follow-up regarding ${currentDeal.title}`,
      });

      setNotes('');
      setError('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to schedule follow-up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[#EB673E]" />
            <h3 className="font-display font-bold text-base text-slate-900">Schedule Follow-Up</h3>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Select Deal / Inquiry *</label>
            <select
              required
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            >
              {deals.map((d) => {
                const comp = companies.find(c => c.id === d.companyId);
                return (
                  <option key={d.id} value={d.id}>
                    {d.title} ({comp ? comp.name : 'Unknown'})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Follow-Up Sequence *</label>
              <select
                value={sequence}
                onChange={(e) => setSequence(e.target.value as FollowUpSequence)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                <option value="First Follow-Up">First Follow-Up</option>
                <option value="Second Follow-Up">Second Follow-Up</option>
                <option value="Third Follow-Up">Third Follow-Up</option>
                <option value="Additional Follow-Up">Additional Follow-Up</option>
              </select>
            </div>

            <SuggestiveCombobox
              label="Communication Channel"
              value={channel}
              onChange={(val) => setChannel(val)}
              suggestions={COMMON_CHANNELS}
              placeholder="Select channel or type custom..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Scheduled Date *</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              />
            </div>

            <SuggestiveCombobox
              label="Responsible Lead"
              value={performedBy}
              onChange={setPerformedBy}
              suggestions={COMMON_PERFORMED_BY}
              placeholder="Select role or type name..."
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Action Agenda & Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What points need to be discussed during this touchpoint?"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-semibold text-white bg-[#EB673E] hover:bg-[#d85830] rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Saving...' : 'Save Scheduled Follow-Up'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 6. LOG INTERACTION / TIMELINE ENTRY MODAL
// ----------------------------------------------------
interface LogInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  contacts: ContactPerson[];
  initialCompanyId?: string;
  onLogInteraction: (entry: {
    companyId: string;
    contactPersonId: string;
    type: any;
    title: string;
    details: string;
    date: string;
  }) => Promise<boolean | void> | void;
}

export const LogInteractionModal: React.FC<LogInteractionModalProps> = ({
  isOpen,
  onClose,
  companies,
  contacts,
  initialCompanyId,
  onLogInteraction,
}) => {
  const [companyId, setCompanyId] = useState(initialCompanyId || '');
  const [contactPersonId, setContactPersonId] = useState('');
  const [type, setType] = useState('Status Update');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState(() => getTodayStr());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialCompanyId && companies.some(c => String(c.id) === String(initialCompanyId))) {
        setCompanyId(String(initialCompanyId));
      } else if (companies.length > 0) {
        if (!companyId || !companies.some(c => String(c.id) === String(companyId))) {
          setCompanyId(String(companies[0].id));
        }
      } else {
        setCompanyId('');
      }
      setError('');
    }
  }, [isOpen, initialCompanyId, companies]);

  const companyContacts = contacts.filter(c => String(c.companyId) === String(companyId));

  React.useEffect(() => {
    if (companyContacts.length > 0 && (!contactPersonId || !companyContacts.some(c => String(c.id) === String(contactPersonId)))) {
      setContactPersonId(String(companyContacts[0].id));
    }
  }, [companyId, companyContacts, contactPersonId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !companyId.trim() || Number(companyId) <= 0) {
      setError('Please select an associated company.');
      return;
    }
    if (!title.trim()) {
      setError('Title / Headline is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onLogInteraction({
        companyId,
        contactPersonId: contactPersonId || (companyContacts[0]?.id || ''),
        type,
        title: title.trim(),
        details: details.trim() || 'Interaction recorded.',
        date,
      });

      setTitle('');
      setDetails('');
      setError('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to log interaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#088395]" />
            <h3 className="font-display font-bold text-base text-slate-900">Log Historical Touchpoint / Milestone</h3>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Company</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Person</label>
              <select
                value={contactPersonId}
                onChange={(e) => setContactPersonId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              >
                <option value="">None</option>
                {companyContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SuggestiveCombobox
              label="Touchpoint Type"
              value={type}
              onChange={setType}
              suggestions={COMMON_INTERACTION_TYPES}
              placeholder="Select or type custom..."
            />

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
              />
            </div>
          </div>

          <SuggestiveCombobox
            label="Headline / Title"
            required
            value={title}
            onChange={setTitle}
            suggestions={[
              'Initial Discovery Call',
              'Technical Architecture Review',
              'Scope & Milestone Sign-Off',
              'Weekly Status Sync',
              'Executive Briefing',
              'Proposal & Pricing Walkthrough',
              'Contract & Terms Review',
              'Deliverable Handoff & Acceptance',
            ]}
            placeholder="Select a headline or type custom title..."
          />

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Details & Outcomes</label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Summary of conversation, key deliverables discussed..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#088395]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-semibold text-white bg-[#088395] hover:bg-[#077080] rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Logging...' : 'Save Touchpoint Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

