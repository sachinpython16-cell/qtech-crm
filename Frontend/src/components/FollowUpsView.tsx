import React, { useState } from 'react';
import { 
  CalendarClock, 
  Search, 
  Plus, 
  Check, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Building2, 
  User, 
  Calendar,
  Filter,
  Trash2,
  Loader2
} from 'lucide-react';
import { Company, ContactPerson, InquiryDeal, FollowUpRecord, FollowUpSequence, FollowUpStatus } from '../types/crm';
import { calculateDashboardMetrics } from '../services/storage';

interface FollowUpsViewProps {
  companies: Company[];
  contacts: ContactPerson[];
  deals: InquiryDeal[];
  followUps: FollowUpRecord[];
  onOpenScheduleFollowUp: () => void;
  onOpenLogCompleteFollowUp: (followUp: FollowUpRecord) => void;
  onDeleteFollowUp?: (followUpId: string) => Promise<void> | void;
  onSelectCompany: (companyId: string) => void;
  onSelectDeal: (dealId: string) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  companies,
  contacts,
  deals,
  followUps,
  onOpenScheduleFollowUp,
  onOpenLogCompleteFollowUp,
  onDeleteFollowUp,
  onSelectCompany,
  onSelectDeal,
}) => {
  const [sequenceFilter, setSequenceFilter] = useState<'all' | FollowUpSequence>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const metrics = calculateDashboardMetrics(companies, contacts, deals, followUps);

  // Filter follow-ups
  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredFollowUps = followUps.filter((item) => {
    const isOverdue = item.status === 'Overdue' || (item.status === 'Pending' && item.scheduledDate < todayStr);
    
    // Status filter matching
    if (statusFilter === 'pending' && (item.status !== 'Pending' || isOverdue)) return false;
    if (statusFilter === 'overdue' && !isOverdue) return false;
    if (statusFilter === 'completed' && item.status !== 'Completed') return false;

    // Sequence filter
    if (sequenceFilter !== 'all' && item.sequence !== sequenceFilter) return false;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const company = companies.find(c => c.id === item.companyId);
    const contact = contacts.find(c => c.id === item.contactPersonId);
    const deal = deals.find(d => d.id === item.inquiryDealId);

    return (
      item.sequence.toLowerCase().includes(q) ||
      item.notes.toLowerCase().includes(q) ||
      (company && company.name.toLowerCase().includes(q)) ||
      (contact && contact.name.toLowerCase().includes(q)) ||
      (deal && deal.title.toLowerCase().includes(q))
    );
  });

  const getCompanyName = (companyId: string) => {
    const comp = companies.find(c => c.id === companyId);
    return comp ? comp.name : 'Unknown Company';
  };

  const getContact = (contactId?: string) => {
    if (!contactId) return null;
    return contacts.find(c => c.id === contactId);
  };

  const getDeal = (dealId: string) => {
    return deals.find(d => d.id === dealId);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onDeleteFollowUp) return;
    if (!confirm('Are you sure you want to delete this scheduled follow-up?')) return;

    setDeletingId(id);
    try {
      await onDeleteFollowUp(id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete follow-up.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
              Client Outreach & Follow-Up Queue
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Automates sequence progression (1st, 2nd, and 3rd follow-ups) with overdue notifications.
            </p>
          </div>
          <button
            onClick={onOpenScheduleFollowUp}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#EB673E] hover:bg-[#d85830] rounded-lg transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Follow-Up</span>
          </button>
        </div>

        {/* Operational Highlights Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              1st Follow-Up Stage
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-display text-slate-900 font-mono-tabular">
                {metrics.firstFollowUpsPending}
              </span>
              <span className="text-xs text-slate-500">pending ({metrics.firstFollowUpsCompleted} done)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              2nd Follow-Up Stage
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-display text-slate-900 font-mono-tabular">
                {metrics.secondFollowUpsPending}
              </span>
              <span className="text-xs text-slate-500">pending ({metrics.secondFollowUpsCompleted} done)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              3rd Follow-Up Stage
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-display text-slate-900 font-mono-tabular">
                {metrics.thirdFollowUpsPending}
              </span>
              <span className="text-xs text-slate-500">pending ({metrics.thirdFollowUpsCompleted} done)</span>
            </div>
          </div>

          <div className="p-3 bg-red-50/50 rounded-lg border border-red-200/80">
            <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider block">
              Attention Required
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-display text-red-700 font-mono-tabular">
                {metrics.overdueFollowUps}
              </span>
              <span className="text-xs text-red-600">tasks overdue</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records ({followUps.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'pending'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming ({metrics.pendingFollowUps - metrics.overdueFollowUps})
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'overdue'
                  ? 'bg-red-600 text-white shadow-2xs font-semibold'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              Overdue ({metrics.overdueFollowUps})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({followUps.filter(f => f.status === 'Completed').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sequence, notes, deal..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#088395] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Follow-Up Records Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Sequence & Channel</th>
                <th className="py-3 px-4 font-semibold">Associated Company</th>
                <th className="py-3 px-4 font-semibold">Contact Person</th>
                <th className="py-3 px-4 font-semibold">Deal / Inquiry Subject</th>
                <th className="py-3 px-4 font-semibold">Due Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Follow-Up Notes & Outcome</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFollowUps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No follow-ups found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredFollowUps.map((item) => {
                  const companyName = getCompanyName(item.companyId);
                  const contact = getContact(item.contactPersonId);
                  const deal = getDeal(item.inquiryDealId);
                  const isOverdue = item.status === 'Overdue' || (item.status === 'Pending' && item.scheduledDate < todayStr);
                  const isToday = item.status === 'Pending' && item.scheduledDate === todayStr;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isOverdue
                          ? 'bg-red-50/30 hover:bg-red-50/60'
                          : item.status === 'Completed'
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/50'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Sequence & Channel */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#EB673E]"></span>
                          <span>{item.sequence}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          via {item.channel}
                        </div>
                      </td>

                      {/* Associated Company */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <span
                          onClick={() => onSelectCompany(item.companyId)}
                          className="hover:text-[#088395] hover:underline cursor-pointer"
                        >
                          {companyName}
                        </span>
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-4 text-slate-700">
                        {contact ? (
                          <div>
                            <div className="font-semibold">{contact.name}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{contact.designation}</div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Deal / Inquiry Subject */}
                      <td className="py-3.5 px-4 text-slate-800 max-w-[200px]">
                        {deal ? (
                          <span
                            onClick={() => onSelectDeal(deal.id)}
                            className="hover:text-[#088395] hover:underline cursor-pointer font-medium block truncate"
                          >
                            {deal.title}
                          </span>
                        ) : (
                          <span className="text-slate-400">General Inquiry</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 font-mono-tabular">
                        <div className="font-semibold text-slate-900">
                          {item.completedDate || item.scheduledDate}
                        </div>
                        {isOverdue && (
                          <span className="text-[11px] text-red-600 font-medium">Overdue</span>
                        )}
                        {isToday && (
                          <span className="text-[11px] text-amber-600 font-medium">Due Today</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded border uppercase tracking-wider ${
                            item.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isOverdue
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : item.status}
                        </span>
                      </td>

                      {/* Follow-up Notes & Outcome */}
                      <td className="py-3.5 px-4 text-slate-600 max-w-[240px]">
                        <div className="truncate text-xs">{item.notes}</div>
                        {item.outcome && (
                          <div className="text-[11px] text-emerald-700 font-medium truncate">
                            Outcome: {item.outcome}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== 'Completed' ? (
                            <button
                              onClick={() => onOpenLogCompleteFollowUp(item)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-[#088395] hover:bg-[#077080] rounded shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Logged</span>
                            </span>
                          )}

                          {onDeleteFollowUp && (
                            <button
                              onClick={(e) => handleDelete(e, item.id)}
                              disabled={deletingId === item.id}
                              title="Delete follow-up task"
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
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
