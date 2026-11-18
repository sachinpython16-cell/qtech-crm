import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Users, 
  Briefcase, 
  CalendarClock, 
  History, 
  ExternalLink, 
  ArrowLeft, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MessageSquare,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { Company, ContactPerson, InquiryDeal, FollowUpRecord, InteractionLog, RelationshipStatus } from '../types/crm';
import { getCompanyStatistics } from '../services/storage';

interface CompaniesViewProps {
  companies: Company[];
  contacts: ContactPerson[];
  deals: InquiryDeal[];
  followUps: FollowUpRecord[];
  interactions: InteractionLog[];
  selectedCompanyId: string | null;
  onSelectCompany: (companyId: string | null) => void;
  onOpenAddCompany: () => void;
  onOpenEditCompany: (company: Company) => void;
  onDeleteCompany: (companyId: string) => Promise<void> | void;
  onOpenAddContactForCompany: (companyId: string) => void;
  onOpenAddDealForCompany: (companyId: string) => void;
  onOpenLogInteractionForCompany: (companyId: string) => void;
  onSelectContact: (contactId: string) => void;
  onSelectDeal: (dealId: string) => void;
  onOpenLookup: (query?: string) => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  companies,
  contacts,
  deals,
  followUps,
  interactions,
  selectedCompanyId,
  onSelectCompany,
  onOpenAddCompany,
  onOpenEditCompany,
  onDeleteCompany,
  onOpenAddContactForCompany,
  onOpenAddDealForCompany,
  onOpenLogInteractionForCompany,
  onSelectContact,
  onSelectDeal,
  onOpenLookup,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | RelationshipStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Find active selected company if viewing dedicated profile
  const selectedCompany = companies.find(c => String(c.id) === String(selectedCompanyId));

  // Filtered companies list
  const filteredCompanies = companies.filter(company => {
    const matchesFilter = statusFilter === 'all' || company.relationshipStatus === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      company.name.toLowerCase().includes(q) ||
      company.industry.toLowerCase().includes(q) ||
      company.location.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // Dedicated Company Profile View
  if (selectedCompany) {
    const stats = selectedCompany.stats
      ? {
          totalProjects: selectedCompany.stats.total_projects,
          closedProjects: selectedCompany.stats.closed_projects,
          ongoingProjects: selectedCompany.stats.ongoing_projects,
          lostProjects: selectedCompany.stats.lost_projects,
          inquiryCount: selectedCompany.stats.inquiry_count,
          contactsCount: selectedCompany.stats.contacts_count,
          pendingFollowUps: selectedCompany.stats.pending_follow_ups,
          hasWorkedBefore: selectedCompany.stats.has_worked_before,
        }
      : getCompanyStatistics(String(selectedCompany.id), deals, contacts, followUps);
    const companyContacts = contacts.filter(c => String(c.companyId) === String(selectedCompany.id));
    const companyDeals = deals.filter(d => String(d.companyId) === String(selectedCompany.id));
    const companyFollowUps = followUps.filter(f => String(f.companyId) === String(selectedCompany.id));
    const companyInteractions = interactions
      .filter(i => String(i.companyId) === String(selectedCompany.id))
      .sort((a, b) => b.date.localeCompare(a.date));

    const statusBadge =
      selectedCompany.relationshipStatus === 'active'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : selectedCompany.relationshipStatus === 'previous'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';

    const statusLabel =
      selectedCompany.relationshipStatus === 'active'
        ? 'Currently Working With Us'
        : selectedCompany.relationshipStatus === 'previous'
        ? 'Previously Worked With Us'
        : 'Prospect / Early Inquiries';

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelectCompany(null)}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#088395] hover:text-[#077080] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Companies</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenEditCompany(selectedCompany)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#088395] bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => onOpenLookup(selectedCompany.name)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Verify in Relationship Search
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-display font-bold text-base text-slate-900">Delete Company?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete <strong>{selectedCompany.name}</strong>? This will soft-delete the record in your database.
              </p>
              {deleteError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {deleteError}
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteError('');
                  }}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsDeleting(true);
                    setDeleteError('');
                    try {
                      await onDeleteCompany(selectedCompany.id);
                      setShowDeleteConfirm(false);
                      onSelectCompany(null);
                    } catch (err: any) {
                      setDeleteError(err?.message || 'Failed to delete company');
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Company Header Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
                  {selectedCompany.name}
                </h2>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded border uppercase tracking-wider ${statusBadge}`}>
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 mt-2 flex-wrap">
                <span className="font-medium text-slate-700">{selectedCompany.industry}</span>
                <span>·</span>
                <span>{selectedCompany.location}</span>
                {selectedCompany.website && (
                  <>
                    <span>·</span>
                    <a
                      href={`https://${selectedCompany.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#088395] hover:underline flex items-center gap-1"
                    >
                      <span>{selectedCompany.website}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
                <span>·</span>
                <span className="font-mono-tabular">First Engaged: {selectedCompany.firstEngagedDate}</span>
              </div>
              {selectedCompany.notes && (
                <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/70 mt-3 max-w-4xl">
                  {selectedCompany.notes}
                </p>
              )}
            </div>

            {/* Quick Action Buttons on Profile */}
            <div className="flex sm:flex-col gap-2 shrink-0">
              <button
                onClick={() => onOpenAddContactForCompany(selectedCompany.id)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Add Contact Person</span>
              </button>
              <button
                onClick={() => onOpenAddDealForCompany(selectedCompany.id)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#EB673E] hover:bg-[#d85830] rounded-lg transition-colors whitespace-nowrap shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Deal / Inquiry</span>
              </button>
              <button
                onClick={() => onOpenLogInteractionForCompany(selectedCompany.id)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#088395] bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Log Interaction</span>
              </button>
            </div>
          </div>

          {/* Requirement 7: Company Relationship & Work History Metrics */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Times Worked
              </span>
              <span className="text-xl font-bold font-display text-slate-900 font-mono-tabular">
                {stats.totalProjects} {stats.totalProjects === 1 ? 'Project' : 'Projects'}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Total engagements</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Successfully Closed
              </span>
              <span className="text-xl font-bold font-display text-emerald-700 font-mono-tabular">
                {stats.closedProjects}
              </span>
              <span className="text-[11px] text-emerald-700 block mt-0.5">Delivered projects</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Ongoing Deals
              </span>
              <span className="text-xl font-bold font-display text-blue-700 font-mono-tabular">
                {stats.ongoingProjects}
              </span>
              <span className="text-[11px] text-blue-700 block mt-0.5">Active contracts</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Unsuccessful / Lost
              </span>
              <span className="text-xl font-bold font-display text-slate-600 font-mono-tabular">
                {stats.lostProjects}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Shelved inquiries</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Associated Contacts
              </span>
              <span className="text-xl font-bold font-display text-slate-900 font-mono-tabular">
                {stats.contactsCount}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Key stakeholders</span>
            </div>
          </div>
        </div>

        {/* Section 1: Associated Contact Persons */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-semibold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#088395]" />
                <span>Associated Contact Persons ({companyContacts.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All representatives and decision makers on record for {selectedCompany.name}.
              </p>
            </div>
            <button
              onClick={() => onOpenAddContactForCompany(selectedCompany.id)}
              className="text-xs font-semibold text-[#088395] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Person</span>
            </button>
          </div>

          {companyContacts.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No contacts associated yet. Click &quot;Add Contact Person&quot; above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {companyContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => onSelectContact(contact.id)}
                  className="p-3.5 rounded-lg border border-slate-200/80 hover:border-[#088395] hover:bg-slate-50/60 transition-all cursor-pointer group space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-slate-900 group-hover:text-[#088395] transition-colors flex items-center gap-1.5">
                        <span>{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-teal-50 text-[#088395] rounded border border-teal-200 uppercase">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {contact.designation || 'Representative'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono-tabular">{contact.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-[#088395] font-medium pt-1">
                    Click to view full interaction history →
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Complete Deals & Inquiries History */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-semibold text-base text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#EB673E]" />
                <span>Deals & Inquiries History ({companyDeals.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every project, pilot, and inquiry handled with {selectedCompany.name} (NO financial amounts).
              </p>
            </div>
            <button
              onClick={() => onOpenAddDealForCompany(selectedCompany.id)}
              className="text-xs font-semibold text-[#088395] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Deal / Inquiry</span>
            </button>
          </div>

          {companyDeals.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No inquiries or deals logged for this company yet.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider">
                    <th className="pb-2.5 font-semibold">Title & Scope</th>
                    <th className="pb-2.5 font-semibold">Type</th>
                    <th className="pb-2.5 font-semibold">Contact Person</th>
                    <th className="pb-2.5 font-semibold">Date Received</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold">Follow-Up Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companyDeals.map((deal) => {
                    const contact = contacts.find(c => c.id === deal.contactPersonId);
                    const statusBadge =
                      deal.status === 'Closed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : deal.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : deal.status === 'Follow-Up Required'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : deal.status === 'Lost'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-teal-50 text-teal-700 border-teal-200';

                    return (
                      <tr
                        key={deal.id}
                        onClick={() => onSelectDeal(deal.id)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 font-medium text-slate-900 max-w-[280px]">
                          <div className="truncate font-semibold">{deal.title}</div>
                          <div className="text-[11px] text-slate-500 truncate">{deal.description}</div>
                        </td>
                        <td className="py-3 text-slate-600">
                          {deal.type}
                        </td>
                        <td className="py-3 text-slate-700">
                          {contact ? contact.name : '—'}
                        </td>
                        <td className="py-3 text-slate-500 font-mono-tabular">
                          {deal.dateReceived}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded border uppercase tracking-wider ${statusBadge}`}>
                            {deal.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">
                          {deal.currentFollowUpStage !== 'None' ? (
                            <span className="font-medium text-slate-800">
                              {deal.currentFollowUpStage}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 3: Follow-Up History & Upcoming Schedule */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-semibold text-base text-slate-900 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#088395]" />
                <span>Follow-Up Logs & Schedules ({companyFollowUps.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                First, Second, and Third sequence touchpoints recorded for this account.
              </p>
            </div>
          </div>

          {companyFollowUps.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No follow-ups recorded yet for this company.
            </div>
          ) : (
            <div className="space-y-2.5">
              {companyFollowUps.map((fol) => {
                const contact = contacts.find(c => c.id === fol.contactPersonId);
                const todayStr = new Date().toISOString().slice(0, 10);
                const isOverdue = fol.status === 'Overdue' || (fol.status === 'Pending' && fol.scheduledDate < todayStr);

                return (
                  <div
                    key={fol.id}
                    className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isOverdue
                        ? 'bg-red-50/40 border-red-200'
                        : fol.status === 'Completed'
                        ? 'bg-emerald-50/30 border-emerald-200/80'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{fol.sequence}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-700">Contact: <strong>{contact ? contact.name : '—'}</strong></span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">via {fol.channel}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{fol.notes}</p>
                      {fol.outcome && (
                        <p className="text-emerald-800 font-medium mt-0.5">Outcome: {fol.outcome}</p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className="font-mono-tabular text-slate-600">
                        Date: {fol.completedDate || fol.scheduledDate}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wider ${
                          fol.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isOverdue
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {isOverdue ? 'Overdue' : fol.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 4: Chronological Communication & Work Timeline */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-semibold text-base text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <span>Communication & Deliverables Timeline</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological journal of reviews, milestones, and client updates.
              </p>
            </div>
            <button
              onClick={() => onOpenLogInteractionForCompany(selectedCompany.id)}
              className="text-xs font-semibold text-[#088395] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Entry</span>
            </button>
          </div>

          {companyInteractions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No historical interactions recorded yet. Click &quot;Log Entry&quot; to add one.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {companyInteractions.map((entry) => {
                const contact = contacts.find(c => c.id === entry.contactPersonId);

                return (
                  <div key={entry.id} className="relative group text-xs">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#088395] ring-4 ring-white" />
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div className="font-semibold text-slate-900 text-sm">
                        {entry.title}
                      </div>
                      <div className="font-mono-tabular text-slate-400 text-[11px]">
                        {entry.date} · Logged by {entry.loggedBy}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">{entry.type}</span>
                      {contact && (
                        <>
                          <span>·</span>
                          <span>With {contact.name} ({contact.designation})</span>
                        </>
                      )}
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      {entry.details}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // All Companies List Table / Directory View
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
              Company Records & Work History
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Tracks whether we are currently working with a company or worked with them previously, along with total project counts.
            </p>
          </div>
          <button
            onClick={onOpenAddCompany}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#EB673E] hover:bg-[#d85830] rounded-lg transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Status Filter Segmented Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Companies ({companies.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Currently Working ({companies.filter(c => c.relationshipStatus === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('previous')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'previous'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Previously Worked With ({companies.filter(c => c.relationshipStatus === 'previous').length})
            </button>
            <button
              onClick={() => setStatusFilter('prospect')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'prospect'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prospects ({companies.filter(c => c.relationshipStatus === 'prospect').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, industry..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#088395] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Companies Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Company Name & Industry</th>
                <th className="py-3 px-4 font-semibold">Relationship Status</th>
                <th className="py-3 px-4 font-semibold">Work History & Times Worked</th>
                <th className="py-3 px-4 font-semibold">Project Breakdown</th>
                <th className="py-3 px-4 font-semibold">Contact Persons</th>
                <th className="py-3 px-4 font-semibold">Last Interaction</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No companies found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => {
                  const stats = company.stats
                    ? {
                        totalProjects: company.stats.total_projects,
                        closedProjects: company.stats.closed_projects,
                        ongoingProjects: company.stats.ongoing_projects,
                        lostProjects: company.stats.lost_projects,
                        inquiryCount: company.stats.inquiry_count,
                        contactsCount: company.stats.contacts_count,
                        pendingFollowUps: company.stats.pending_follow_ups,
                        hasWorkedBefore: company.stats.has_worked_before,
                      }
                    : getCompanyStatistics(String(company.id), deals, contacts, followUps);
                  const companyContacts = contacts.filter(c => String(c.companyId) === String(company.id));

                  const statusBadge =
                    company.relationshipStatus === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : company.relationshipStatus === 'previous'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';

                  const statusLabel =
                    company.relationshipStatus === 'active'
                      ? 'Currently Working'
                      : company.relationshipStatus === 'previous'
                      ? 'Previously Worked'
                      : 'Prospect';

                  return (
                    <tr
                      key={company.id}
                      onClick={() => onSelectCompany(company.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Name & Industry */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="font-semibold text-sm text-slate-900 hover:text-[#088395] transition-colors">
                          {company.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {company.industry} · {company.location}
                        </div>
                      </td>

                      {/* Relationship Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded border uppercase tracking-wider ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </td>

                      {/* Work History */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          Worked <strong className="font-mono-tabular text-slate-900">{stats.totalProjects}</strong> {stats.totalProjects === 1 ? 'time' : 'times'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {stats.totalProjects > 0 ? (
                            <span className="text-emerald-700 font-medium">Verified track record</span>
                          ) : (
                            <span className="text-slate-400">Initial engagement</span>
                          )}
                        </div>
                      </td>

                      {/* Project Breakdown */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-700 font-medium font-mono-tabular">
                            {stats.closedProjects} Closed
                          </span>
                          <span>·</span>
                          <span className="text-blue-700 font-medium font-mono-tabular">
                            {stats.ongoingProjects} Ongoing
                          </span>
                          {stats.lostProjects > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-slate-400 font-mono-tabular">
                                {stats.lostProjects} Lost
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Contacts */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-800">{companyContacts.length} persons</span>
                        </div>
                        {companyContacts[0] && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                            Lead: {companyContacts[0].name}
                          </div>
                        )}
                      </td>

                      {/* Last Interaction */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono-tabular">
                        {company.lastInteractionDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCompany(company.id);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-[#088395] hover:bg-teal-50 rounded transition-colors"
                        >
                          View Profile →
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
    </div>
  );
};
