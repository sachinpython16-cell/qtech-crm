import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  CalendarClock, 
  History, 
  CheckCircle2, 
  Clock, 
  X, 
  ExternalLink,
  Edit,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Company, ContactPerson, InquiryDeal, FollowUpRecord, InteractionLog } from '../types/crm';
import { getCompanyStatistics } from '../services/storage';

interface ContactsViewProps {
  companies: Company[];
  contacts: ContactPerson[];
  deals: InquiryDeal[];
  followUps: FollowUpRecord[];
  interactions: InteractionLog[];
  selectedContactId: string | null;
  onSelectContact: (contactId: string | null) => void;
  onSelectCompany: (companyId: string) => void;
  onOpenAddContact: () => void;
  onOpenEditContact: (contact: ContactPerson) => void;
  onDeleteContact: (contactId: string) => Promise<void> | void;
  onOpenAddDealForContact: (companyId: string, contactId: string) => void;
  onOpenLogFollowUpForContact: (contactId: string) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  companies,
  contacts,
  deals,
  followUps,
  interactions,
  selectedContactId,
  onSelectContact,
  onSelectCompany,
  onOpenAddContact,
  onOpenEditContact,
  onDeleteContact,
  onOpenAddDealForContact,
  onOpenLogFollowUpForContact,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    const q = searchQuery.toLowerCase().trim();
    const company = companies.find(c => c.id === contact.companyId);
    const matchesCompany = companyFilter === 'all' || contact.companyId === companyFilter;
    const matchesSearch =
      !q ||
      contact.name.toLowerCase().includes(q) ||
      contact.designation.toLowerCase().includes(q) ||
      contact.email.toLowerCase().includes(q) ||
      contact.phone.includes(q) ||
      (company && company.name.toLowerCase().includes(q));

    return matchesCompany && matchesSearch;
  });

  const activeContact = contacts.find(c => c.id === selectedContactId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
              Contact Person Directory & Interaction History
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Instantly recognize whether we have worked with this person or their company before, and inspect past inquiries.
            </p>
          </div>
          <button
            onClick={onOpenAddContact}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#EB673E] hover:bg-[#d85830] rounded-lg transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact Person</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Filter by Company:
            </span>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-[#088395]"
            >
              <option value="all">All Companies ({contacts.length} Contacts)</option>
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, phone, title..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#088395] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Contacts Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Contact Name & Title</th>
                <th className="py-3 px-4 font-semibold">Associated Company</th>
                <th className="py-3 px-4 font-semibold">Worked With Person Before?</th>
                <th className="py-3 px-4 font-semibold">Email & Phone</th>
                <th className="py-3 px-4 font-semibold">Deals / Inquiries</th>
                <th className="py-3 px-4 font-semibold">Last Contacted</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No contact persons found matching current search/filter.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => {
                  const company = companies.find(c => c.id === contact.companyId);
                  const personDeals = deals.filter(d => d.contactPersonId === contact.id);
                  const personInteractions = interactions.filter(i => i.contactPersonId === contact.id);
                  const workedWithBefore = personDeals.some(d => d.status === 'Closed' || d.status === 'In Progress') || personInteractions.length > 1;

                  return (
                    <tr
                      key={contact.id}
                      onClick={() => onSelectContact(contact.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Name & Title */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="font-semibold text-sm text-slate-900 hover:text-[#088395] transition-colors flex items-center gap-1.5">
                          <span>{contact.name}</span>
                          {contact.isPrimary && (
                            <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-teal-50 text-[#088395] rounded border border-teal-200 uppercase">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {contact.designation || 'Representative'}
                        </div>
                      </td>

                      {/* Associated Company */}
                      <td className="py-3.5 px-4">
                        {company ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCompany(company.id);
                            }}
                            className="font-medium text-slate-800 hover:text-[#088395] hover:underline flex items-center gap-1.5"
                          >
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{company.name}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                        {company && (
                          <div className="text-[10px] text-slate-400">{company.industry}</div>
                        )}
                      </td>

                      {/* Worked Before Badge (Requirement 4) */}
                      <td className="py-3.5 px-4">
                        {workedWithBefore ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Yes ({personDeals.length} deals)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>No / New Contact</span>
                          </span>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="truncate max-w-[190px]">{contact.email}</div>
                        <div className="text-[11px] text-slate-500 font-mono-tabular">{contact.phone}</div>
                      </td>

                      {/* Deals Count */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 font-mono-tabular">
                          {personDeals.length}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1">inquiries/deals</span>
                      </td>

                      {/* Last Contacted */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono-tabular">
                        {contact.lastContactedDate}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectContact(contact.id);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-[#088395] hover:bg-teal-50 rounded transition-colors"
                        >
                          Full History →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dedicated Contact History Modal / Slide-over Drawer */}
      {activeContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-display font-bold text-slate-900">
                    {activeContact.name}
                  </h3>
                  {activeContact.isPrimary && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-teal-50 text-[#088395] rounded border border-teal-200 uppercase">
                      Primary Contact
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 mt-1">
                  {activeContact.designation} · {activeContact.email} · <span className="font-mono-tabular">{activeContact.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenEditContact(activeContact)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#088395] bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => onSelectContact(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-red-700 font-semibold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Delete this contact person?</span>
                </div>
                <p className="text-xs text-slate-600">
                  Are you sure you want to remove <strong>{activeContact.name}</strong>? This will soft-delete their contact record.
                </p>
                {deleteError && (
                  <div className="text-xs text-red-600 font-medium">{deleteError}</div>
                )}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteError('');
                    }}
                    disabled={isDeleting}
                    className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setIsDeleting(true);
                      setDeleteError('');
                      try {
                        await onDeleteContact(activeContact.id);
                        setShowDeleteConfirm(false);
                        onSelectContact(null);
                      } catch (err: any) {
                        setDeleteError(err?.message || 'Failed to delete contact.');
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    disabled={isDeleting}
                    className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1"
                  >
                    {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Delete</span>
                  </button>
                </div>
              </div>
            )}

            {/* The 5 Immediate Answers */}
            {(() => {
              const company = companies.find(c => c.id === activeContact.companyId);
              const companyStats = company ? getCompanyStatistics(company.id, deals, contacts, followUps) : null;
              const personDeals = deals.filter(d => d.contactPersonId === activeContact.id);
              const personFollowUps = followUps.filter(f => f.contactPersonId === activeContact.id);
              const personInteractions = interactions
                .filter(i => i.contactPersonId === activeContact.id)
                .sort((a, b) => b.date.localeCompare(a.date));

              const workedWithPerson = personDeals.some(d => d.status === 'Closed' || d.status === 'In Progress') || personInteractions.length > 1;
              const workedWithCompany = companyStats ? companyStats.hasWorkedBefore : false;

              return (
                <div className="space-y-5">
                  {/* Verdict Quick Summary Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Person History Answer */}
                    <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Worked With This Person Before?
                      </span>
                      <div className="flex items-center gap-2">
                        {workedWithPerson ? (
                          <span className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            YES — Established Relationship
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-500" />
                            NO — New Contact Lead
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {personDeals.length} project inquiries logged · {personInteractions.length} interaction notes
                      </p>
                    </div>

                    {/* Company History Answer */}
                    <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Worked With Their Company Before?
                      </span>
                      <div className="flex items-center gap-2">
                        {workedWithCompany ? (
                          <span className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            YES — Worked {companyStats?.totalProjects} Times
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-500" />
                            NO / Prospect Organization
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {company ? `${company.name} (${company.relationshipStatus.toUpperCase()})` : 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  {/* Company Association Details */}
                  {company && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase">Associated Organization</div>
                        <div className="font-semibold text-slate-900 text-sm mt-0.5">{company.name}</div>
                        <div className="text-xs text-slate-600">{company.industry} · {company.location}</div>
                      </div>
                      <button
                        onClick={() => {
                          onSelectContact(null);
                          onSelectCompany(company.id);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#088395] hover:bg-teal-50 rounded border border-teal-200 transition-colors"
                      >
                        View Company Profile →
                      </button>
                    </div>
                  )}

                  {/* Previous Inquiries or Deals Involving Them */}
                  <div className="space-y-2">
                    <h4 className="font-display font-semibold text-sm text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#EB673E]" />
                      <span>Inquiries & Deals Involving {activeContact.name} ({personDeals.length})</span>
                    </h4>

                    {personDeals.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">No deals or inquiries recorded with this person yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {personDeals.map((deal) => (
                          <div key={deal.id} className="p-3 rounded-lg border border-slate-200 text-xs bg-white space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">{deal.title}</span>
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 uppercase">
                                {deal.status}
                              </span>
                            </div>
                            <p className="text-slate-600">{deal.description}</p>
                            <div className="text-[11px] text-slate-400 font-mono-tabular">
                              Received: {deal.dateReceived} · Follow-up stage: {deal.currentFollowUpStage}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interaction & Follow-Up History */}
                  <div className="space-y-2">
                    <h4 className="font-display font-semibold text-sm text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-[#088395]" />
                      <span>Previous Interaction & Communication History ({personInteractions.length})</span>
                    </h4>

                    {personInteractions.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">No prior communication logged.</p>
                    ) : (
                      <div className="space-y-2">
                        {personInteractions.map((entry) => (
                          <div key={entry.id} className="p-3 rounded-lg border border-slate-200/80 bg-slate-50 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">{entry.title}</span>
                              <span className="text-[11px] text-slate-500 font-mono-tabular">{entry.date}</span>
                            </div>
                            <p className="text-slate-600">{entry.details}</p>
                            <div className="text-[11px] text-slate-400">
                              Logged by {entry.loggedBy} · Type: {entry.type}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
                    {company && (
                      <button
                        onClick={() => {
                          const cId = company.id;
                          const pId = activeContact.id;
                          onSelectContact(null);
                          onOpenAddDealForContact(cId, pId);
                        }}
                        className="px-3 py-2 text-xs font-semibold text-white bg-[#EB673E] hover:bg-[#d85830] rounded-lg transition-colors shadow-xs"
                      >
                        + Create Inquiry for {activeContact.name}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const pId = activeContact.id;
                        onSelectContact(null);
                        onOpenLogFollowUpForContact(pId);
                      }}
                      className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Log Follow-Up
                    </button>
                    <button
                      onClick={() => onSelectContact(null)}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
