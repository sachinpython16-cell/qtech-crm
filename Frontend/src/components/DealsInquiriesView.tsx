import React, { useState } from 'react';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Building2, 
  Users, 
  CalendarClock, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { Company, ContactPerson, InquiryDeal, FollowUpRecord, InteractionLog, DealStatus, DealType } from '../types/crm';
import { calculateDashboardMetrics } from '../services/storage';

interface DealsInquiriesViewProps {
  companies: Company[];
  contacts: ContactPerson[];
  deals: InquiryDeal[];
  followUps: FollowUpRecord[];
  interactions: InteractionLog[];
  selectedDealId: string | null;
  onSelectDeal: (dealId: string | null) => void;
  onSelectCompany: (companyId: string) => void;
  onOpenAddDeal: () => void;
  onOpenEditDeal: (deal: InquiryDeal) => void;
  onDeleteDeal: (dealId: string) => Promise<void> | void;
  onUpdateDealStatus: (dealId: string, newStatus: DealStatus, lostReason?: string) => void;
  onOpenScheduleFollowUpForDeal: (dealId: string) => void;
}

export const DealsInquiriesView: React.FC<DealsInquiriesViewProps> = ({
  companies,
  contacts,
  deals,
  followUps,
  interactions,
  selectedDealId,
  onSelectDeal,
  onSelectCompany,
  onOpenAddDeal,
  onOpenEditDeal,
  onDeleteDeal,
  onUpdateDealStatus,
  onOpenScheduleFollowUpForDeal,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | DealStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | DealType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const metrics = calculateDashboardMetrics(companies, contacts, deals, followUps);

  // Filtered deals
  const filteredDeals = deals.filter((deal) => {
    if (statusFilter !== 'all' && deal.status !== statusFilter) return false;
    if (typeFilter !== 'all' && deal.type !== typeFilter) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const company = companies.find(c => c.id === deal.companyId);
    const contact = contacts.find(c => c.id === deal.contactPersonId);

    return (
      deal.title.toLowerCase().includes(q) ||
      deal.description.toLowerCase().includes(q) ||
      (company && company.name.toLowerCase().includes(q)) ||
      (contact && contact.name.toLowerCase().includes(q))
    );
  });

  const activeDeal = deals.find(d => d.id === selectedDealId);

  const getCompanyName = (companyId: string) => {
    const comp = companies.find(c => c.id === companyId);
    return comp ? comp.name : 'Unknown Company';
  };

  const getContact = (contactId?: string) => {
    if (!contactId) return null;
    return contacts.find(c => c.id === contactId);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
              Deals & Inquiries Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Strictly monitors active inquiries and progress stages across clients without storing financial contracts.
            </p>
          </div>
          <button
            onClick={onOpenAddDeal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#EB673E] hover:bg-[#d85830] rounded-lg transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Deal / Inquiry</span>
          </button>
        </div>

        {/* Operational Highlights Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Active Inquiries
            </span>
            <span className="text-xl font-bold font-display text-slate-900 font-mono-tabular">
              {metrics.totalInquiries}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">In pipeline</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              In Progress
            </span>
            <span className="text-xl font-bold font-display text-blue-700 font-mono-tabular">
              {metrics.ongoingDeals}
            </span>
            <span className="text-[11px] text-blue-700 block mt-0.5">Under evaluation</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Delivered / Closed
            </span>
            <span className="text-xl font-bold font-display text-emerald-700 font-mono-tabular">
              {metrics.closedDeals}
            </span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">Successfully delivered</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Lost / Cancelled
            </span>
            <span className="text-xl font-bold font-display text-slate-500 font-mono-tabular">
              {metrics.lostDeals}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Archived</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
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
              All Deals ({deals.length})
            </button>
            <button
              onClick={() => setStatusFilter('New')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'New'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New ({deals.filter(d => d.status === 'New').length})
            </button>
            <button
              onClick={() => setStatusFilter('In Progress')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'In Progress'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Progress ({deals.filter(d => d.status === 'In Progress').length})
            </button>
            <button
              onClick={() => setStatusFilter('Follow-Up Required')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'Follow-Up Required'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Follow-Up ({deals.filter(d => d.status === 'Follow-Up Required').length})
            </button>
            <button
              onClick={() => setStatusFilter('Closed')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'Closed'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Closed ({deals.filter(d => d.status === 'Closed').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, description..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#088395] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Title & Description</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Associated Company</th>
                <th className="py-3 px-4 font-semibold">Contact Person</th>
                <th className="py-3 px-4 font-semibold">Date Received</th>
                <th className="py-3 px-4 font-semibold">Current Status</th>
                <th className="py-3 px-4 font-semibold">Follow-Up Stage</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No deals or inquiries match current criteria.
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => {
                  const companyName = getCompanyName(deal.companyId);
                  const contact = getContact(deal.contactPersonId);

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
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Title & Description */}
                      <td className="py-3.5 px-4 font-medium text-slate-900 max-w-[280px]">
                        <div className="font-semibold text-sm text-slate-900 hover:text-[#088395] transition-colors truncate">
                          {deal.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {deal.description}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {deal.type}
                      </td>

                      {/* Associated Company */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCompany(deal.companyId);
                          }}
                          className="hover:text-[#088395] hover:underline"
                        >
                          {companyName}
                        </span>
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-4 text-slate-700">
                        {contact ? contact.name : '—'}
                      </td>

                      {/* Date Received */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono-tabular">
                        {deal.dateReceived}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded border uppercase tracking-wider ${statusBadge}`}>
                          {deal.status}
                        </span>
                      </td>

                      {/* Follow-up Stage */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {deal.currentFollowUpStage !== 'None' ? (
                          <div>
                            <span className="font-semibold text-slate-800">
                              {deal.currentFollowUpStage}
                            </span>
                            {deal.nextFollowUpDate && (
                              <div className="text-[11px] text-slate-400 font-mono-tabular">
                                Due: {deal.nextFollowUpDate}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Details Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDeal(deal.id);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-[#088395] hover:bg-teal-50 rounded transition-colors"
                        >
                          Manage →
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

      {/* Detailed Deal Management Modal */}
      {activeDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#088395]">
                  {activeDeal.type} Record
                </span>
                <h3 className="text-xl font-display font-bold text-slate-900 mt-0.5">
                  {activeDeal.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Received {activeDeal.dateReceived}</span>
                  <span>·</span>
                  <span className="text-slate-800 font-semibold">{getCompanyName(activeDeal.companyId)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenEditDeal(activeDeal)}
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
                  onClick={() => onSelectDeal(null)}
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
                  <span>Delete this deal / inquiry?</span>
                </div>
                <p className="text-xs text-slate-600">
                  Are you sure you want to remove <strong>{activeDeal.title}</strong>? This will soft-delete the record.
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
                        await onDeleteDeal(activeDeal.id);
                        setShowDeleteConfirm(false);
                        onSelectDeal(null);
                      } catch (err: any) {
                        setDeleteError(err?.message || 'Failed to delete deal.');
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

            {/* Scope / Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-500">Inquiry Scope & Details</label>
              <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed">
                {activeDeal.description}
              </p>
            </div>

            {/* Status Change Selector */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <label className="text-xs font-semibold uppercase text-slate-600 block">
                Update Status (Workflow State)
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {(['New', 'In Progress', 'Follow-Up Required', 'Closed', 'Lost'] as DealStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => onUpdateDealStatus(activeDeal.id, status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeDeal.status === status
                        ? 'bg-[#088395] text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {activeDeal.status === 'Lost' && (
                <div className="pt-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Reason: </span>
                  {activeDeal.lostReason || 'Client did not proceed.'}
                </div>
              )}
            </div>

            {/* Follow-Up History for this Deal */}
            {(() => {
              const dealFollowUps = followUps.filter(f => f.inquiryDealId === activeDeal.id);
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4 text-[#EB673E]" />
                      <span>Follow-Up Progression for this Deal ({dealFollowUps.length})</span>
                    </label>
                    <button
                      onClick={() => {
                        const dId = activeDeal.id;
                        onSelectDeal(null);
                        onOpenScheduleFollowUpForDeal(dId);
                      }}
                      className="text-xs font-semibold text-[#088395] hover:underline"
                    >
                      + Schedule Follow-Up
                    </button>
                  </div>

                  {dealFollowUps.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200/70">
                      No follow-ups recorded yet for this deal.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dealFollowUps.map((fol) => (
                        <div key={fol.id} className="p-3 rounded-lg border border-slate-200 text-xs bg-white space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{fol.sequence} ({fol.status})</span>
                            <span className="font-mono-tabular text-slate-500 text-[11px]">
                              {fol.completedDate || fol.scheduledDate} · via {fol.channel}
                            </span>
                          </div>
                          <p className="text-slate-600">{fol.notes}</p>
                          {fol.outcome && (
                            <p className="text-emerald-700 font-medium">Outcome: {fol.outcome}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const compId = activeDeal.companyId;
                  onSelectDeal(null);
                  onSelectCompany(compId);
                }}
                className="text-xs font-semibold text-[#088395] hover:underline flex items-center gap-1"
              >
                <span>View Full Company Work History →</span>
              </button>

              <button
                onClick={() => onSelectDeal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
