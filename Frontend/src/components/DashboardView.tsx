import React from 'react';
import { 
  Building2, 
  Users, 
  Briefcase, 
  CalendarClock, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Search,
  Check,
  Building
} from 'lucide-react';
import { Company, ContactPerson, InquiryDeal, FollowUpRecord, DashboardMetrics } from '../types/crm';
import { calculateDashboardMetrics, getCompanyStatistics } from '../services/storage';
import { ActiveTab } from './Navigation';

interface DashboardViewProps {
  companies: Company[];
  contacts: ContactPerson[];
  deals: InquiryDeal[];
  followUps: FollowUpRecord[];
  dashboardMetrics?: DashboardMetrics | null;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectCompany: (companyId: string) => void;
  onSelectDeal: (dealId: string) => void;
  onOpenQuickCompleteFollowUp: (followUp: FollowUpRecord) => void;
  onOpenLookup: (query?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  companies,
  contacts,
  deals,
  followUps,
  dashboardMetrics,
  onNavigateTab,
  onSelectCompany,
  onSelectDeal,
  onOpenQuickCompleteFollowUp,
  onOpenLookup,
}) => {
  const localMetrics = calculateDashboardMetrics(companies, contacts, deals, followUps);
  const metrics = dashboardMetrics ? {
    totalCompanies: dashboardMetrics.total_companies ?? localMetrics.totalCompanies,
    activeCompanies: dashboardMetrics.active_companies ?? localMetrics.activeCompanies,
    previousCompanies: dashboardMetrics.previous_companies ?? localMetrics.previousCompanies,
    totalContacts: dashboardMetrics.total_contacts ?? localMetrics.totalContacts,
    totalInquiries: dashboardMetrics.total_inquiries ?? localMetrics.totalInquiries,
    ongoingDeals: dashboardMetrics.ongoing_deals ?? localMetrics.ongoingDeals,
    closedDeals: dashboardMetrics.closed_deals ?? localMetrics.closedDeals,
    lostDeals: dashboardMetrics.lost_deals ?? localMetrics.lostDeals,
    pendingFollowUps: dashboardMetrics.pending_follow_ups ?? localMetrics.pendingFollowUps,
    firstFollowUpsPending: dashboardMetrics.first_follow_ups_pending ?? localMetrics.firstFollowUpsPending,
    firstFollowUpsCompleted: dashboardMetrics.first_follow_ups_completed ?? localMetrics.firstFollowUpsCompleted,
    secondFollowUpsPending: dashboardMetrics.second_follow_ups_pending ?? localMetrics.secondFollowUpsPending,
    secondFollowUpsCompleted: dashboardMetrics.second_follow_ups_completed ?? localMetrics.secondFollowUpsCompleted,
    thirdFollowUpsPending: dashboardMetrics.third_follow_ups_pending ?? localMetrics.thirdFollowUpsPending,
    thirdFollowUpsCompleted: dashboardMetrics.third_follow_ups_completed ?? localMetrics.thirdFollowUpsCompleted,
    additionalFollowUpsPending: dashboardMetrics.additional_follow_ups_pending ?? localMetrics.additionalFollowUpsPending,
    additionalFollowUpsCompleted: dashboardMetrics.additional_follow_ups_completed ?? localMetrics.additionalFollowUpsCompleted,
    overdueFollowUps: dashboardMetrics.overdue_follow_ups ?? localMetrics.overdueFollowUps,
    dueTodayFollowUps: dashboardMetrics.due_today_follow_ups ?? localMetrics.dueTodayFollowUps,
  } : localMetrics;

  // Urgent follow-ups (overdue or due today)
  const urgentFollowUps = followUps
    .filter(f => f.status === 'Pending' || f.status === 'Overdue')
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5);

  // Companies worked with multiple times (repeat relationships)
  const companiesWithWorkHistory = companies
    .map(comp => ({
      company: comp,
      stats: getCompanyStatistics(comp.id, deals, contacts, followUps),
    }))
    .filter(item => item.stats.totalProjects > 0)
    .sort((a, b) => b.stats.totalProjects - a.stats.totalProjects);

  // Recent Inquiries & Ongoing Deals
  const recentDeals = [...deals]
    .sort((a, b) => b.dateReceived.localeCompare(a.dateReceived))
    .slice(0, 6);

  const getCompanyName = (companyId: string) => companies.find(c => c.id === companyId)?.name || 'Unknown Company';
  const getContact = (contactId: string) => contacts.find(c => c.id === contactId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome / Verification Kicker */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#088395]">
            <span className="w-2 h-2 rounded-full bg-[#088395]"></span>
            <span>Enterprise Relationship Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mt-1 tracking-tight">
            Company Relationship & Inquiry Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Non-monetary portal managing work history, contact interactions, and sequence-based follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onOpenLookup()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Search className="w-4 h-4 text-slate-500" />
            <span>Instant History Lookup</span>
          </button>
          <button
            onClick={() => onNavigateTab('follow-ups')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#EB673E] hover:bg-[#d85830] rounded-lg transition-colors shadow-xs"
          >
            <CalendarClock className="w-4 h-4" />
            <span>View All Follow-Ups</span>
          </button>
        </div>
      </div>

      {/* Primary 10 Metrics Strip (strictly relationship & activity based, NO financial metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Companies */}
        <div 
          onClick={() => onNavigateTab('companies')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-[#088395] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Companies</span>
            <Building2 className="w-4 h-4 text-slate-400 group-hover:text-[#088395] transition-colors" />
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-slate-900 font-mono-tabular">
            {metrics.totalCompanies}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span className="font-medium text-emerald-700">{metrics.activeCompanies} Active</span>
            <span>·</span>
            <span className="text-slate-600">{metrics.previousCompanies} Past</span>
          </div>
        </div>

        {/* Total Contact Persons */}
        <div 
          onClick={() => onNavigateTab('contacts')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-[#088395] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Contact Persons</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-[#088395] transition-colors" />
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-slate-900 font-mono-tabular">
            {metrics.totalContacts}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            Across {metrics.totalCompanies} organizations
          </div>
        </div>

        {/* Total Inquiries */}
        <div 
          onClick={() => onNavigateTab('deals')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-[#088395] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Inquiries</span>
            <Briefcase className="w-4 h-4 text-slate-400 group-hover:text-[#088395] transition-colors" />
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-slate-900 font-mono-tabular">
            {metrics.totalInquiries}
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">
            Awaiting response & qualification
          </div>
        </div>

        {/* Ongoing Deals */}
        <div 
          onClick={() => onNavigateTab('deals')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-[#088395] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Ongoing Deals</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-slate-900 font-mono-tabular">
            {metrics.ongoingDeals}
          </div>
          <div className="text-[11px] text-blue-700 font-medium mt-1">
            Active project engagements
          </div>
        </div>

        {/* Successfully Closed Deals */}
        <div 
          onClick={() => onNavigateTab('deals')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-[#088395] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Closed Deals</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-slate-900 font-mono-tabular text-emerald-700">
            {metrics.closedDeals}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Successfully delivered work
          </div>
        </div>
      </div>

      {/* Follow-Up Sequence & Multi-Stage Progression Strip */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-display font-semibold text-base text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[#EB673E]" />
              <span>Multi-Stage Follow-Up Sequence Tracking</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks touchpoint progression across First, Second, and Third follow-up sequences.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600">
              Total Pending: <strong className="text-slate-900 font-mono-tabular">{metrics.pendingFollowUps}</strong>
            </span>
            {metrics.overdueFollowUps > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 rounded border border-red-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{metrics.overdueFollowUps} Overdue</span>
              </span>
            )}
          </div>
        </div>

        {/* Sequence Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* First Follow-Up */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">1st Follow-Up</span>
              <span className="text-[11px] text-slate-500 font-medium">Initial Outreach</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <span className="text-2xl font-bold font-display text-slate-900 font-mono-tabular">
                  {metrics.firstFollowUpsPending}
                </span>
                <span className="text-xs text-amber-700 font-medium ml-1.5">Pending</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-display text-emerald-700 font-mono-tabular">
                  {metrics.firstFollowUpsCompleted}
                </span>
                <span className="text-xs text-slate-500 block">Completed</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-[#088395] h-full rounded-full transition-all"
                style={{ 
                  width: `${(metrics.firstFollowUpsCompleted / Math.max(1, metrics.firstFollowUpsPending + metrics.firstFollowUpsCompleted)) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Second Follow-Up */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">2nd Follow-Up</span>
              <span className="text-[11px] text-slate-500 font-medium">Secondary Check-in</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <span className="text-2xl font-bold font-display text-slate-900 font-mono-tabular">
                  {metrics.secondFollowUpsPending}
                </span>
                <span className="text-xs text-amber-700 font-medium ml-1.5">Pending</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-display text-emerald-700 font-mono-tabular">
                  {metrics.secondFollowUpsCompleted}
                </span>
                <span className="text-xs text-slate-500 block">Completed</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-[#088395] h-full rounded-full transition-all"
                style={{ 
                  width: `${(metrics.secondFollowUpsCompleted / Math.max(1, metrics.secondFollowUpsPending + metrics.secondFollowUpsCompleted)) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Third Follow-Up */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">3rd Follow-Up</span>
              <span className="text-[11px] text-slate-500 font-medium">Third Touchpoint</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <span className="text-2xl font-bold font-display text-slate-900 font-mono-tabular">
                  {metrics.thirdFollowUpsPending}
                </span>
                <span className="text-xs text-amber-700 font-medium ml-1.5">Pending</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-display text-emerald-700 font-mono-tabular">
                  {metrics.thirdFollowUpsCompleted}
                </span>
                <span className="text-xs text-slate-500 block">Completed</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-[#088395] h-full rounded-full transition-all"
                style={{ 
                  width: `${(metrics.thirdFollowUpsCompleted / Math.max(1, metrics.thirdFollowUpsPending + metrics.thirdFollowUpsCompleted)) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Additional / Overdue Status */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Action Queue</span>
              <span className="text-[11px] text-slate-500 font-medium">Attention Required</span>
            </div>
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-700 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Overdue
                </span>
                <span className="font-mono-tabular font-bold text-red-700">{metrics.overdueFollowUps}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Due Today
                </span>
                <span className="font-mono-tabular font-bold text-slate-900">{metrics.dueTodayFollowUps}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-500">Additional Follow-Ups</span>
                <span className="font-mono-tabular font-medium text-slate-700">{metrics.additionalFollowUpsPending} pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Urgent Follow-Ups Queue & Repeat Client Relationships */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Urgent & Pending Follow-Ups (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-semibold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-[#EB673E]" />
                <span>Urgent & Next Pending Follow-Ups</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Priority follow-ups awaiting completion or next sequence scheduling.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('follow-ups')}
              className="text-xs font-semibold text-[#088395] hover:underline flex items-center gap-1"
            >
              <span>All ({metrics.pendingFollowUps})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {urgentFollowUps.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              All scheduled follow-ups are up to date!
            </div>
          ) : (
            <div className="space-y-2.5">
              {urgentFollowUps.map((item) => {
                const companyName = getCompanyName(item.companyId);
                const contact = getContact(item.contactPersonId);
                const deal = deals.find(d => d.id === item.inquiryDealId);
                const todayStr = new Date().toISOString().slice(0, 10);
                const isOverdue = item.status === 'Overdue' || (item.status === 'Pending' && item.scheduledDate < todayStr);
                const isToday = item.status === 'Pending' && item.scheduledDate === todayStr;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isOverdue
                        ? 'bg-red-50/50 border-red-200'
                        : isToday
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-semibold text-slate-900 hover:text-[#088395] cursor-pointer" onClick={() => onSelectCompany(item.companyId)}>
                          {companyName}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600 font-medium">
                          {contact ? contact.name : 'Unknown Contact'}
                        </span>
                        {contact?.designation && (
                          <span className="text-[11px] text-slate-400">({contact.designation})</span>
                        )}
                      </div>

                      <div className="text-xs text-slate-800 font-medium mt-1 truncate">
                        {deal ? deal.title : 'Inquiry Follow-up'}
                      </div>

                      <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mt-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                          {item.sequence}
                        </span>
                        <span className="font-mono-tabular">
                          Due: {item.scheduledDate} {isOverdue ? '(Overdue)' : isToday ? '(Today)' : ''}
                        </span>
                        <span>·</span>
                        <span className="text-slate-600">via {item.channel}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => onOpenQuickCompleteFollowUp(item)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-white bg-[#088395] hover:bg-[#077080] rounded-md transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
                        title="Mark complete & schedule next follow-up"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Log Complete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Company Relationship & Work History Counter (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-semibold text-base text-slate-900 flex items-center gap-2">
                <Building className="w-4.5 h-4.5 text-[#088395]" />
                <span>Repeat & Active Work History</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Companies tracked by number of projects and engagement depth.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('companies')}
              className="text-xs font-semibold text-[#088395] hover:underline flex items-center gap-1"
            >
              <span>All Companies</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {companiesWithWorkHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No companies with past engagements logged yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {companiesWithWorkHistory.slice(0, 5).map(({ company, stats }) => {
              const statusBadgeColor =
                company.relationshipStatus === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : company.relationshipStatus === 'previous'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200';

              const statusLabel =
                company.relationshipStatus === 'active'
                  ? 'Currently Working'
                  : company.relationshipStatus === 'previous'
                  ? 'Previously Worked With'
                  : 'Prospect / In Discussion';

              return (
                <div
                  key={company.id}
                  onClick={() => onSelectCompany(company.id)}
                  className="p-3 rounded-lg border border-slate-200/80 hover:border-[#088395] hover:bg-slate-50/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-[#088395] transition-colors truncate">
                      {company.name}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wider shrink-0 ${statusBadgeColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-700">
                        Worked <strong className="text-slate-900 font-mono-tabular">{stats.totalProjects}</strong> {stats.totalProjects === 1 ? 'time' : 'times'}
                      </span>
                      <span>·</span>
                      <span className="text-emerald-700 font-mono-tabular">{stats.closedProjects} Closed</span>
                      <span>·</span>
                      <span className="text-blue-700 font-mono-tabular">{stats.ongoingProjects} Ongoing</span>
                      {stats.lostProjects > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-slate-400 font-mono-tabular">{stats.lostProjects} Lost</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Recent Inquiries & Deal Progression */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-display font-semibold text-base text-slate-900">
              Recent Deals & Inquiries Log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest business inquiries and project milestones across all client accounts.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('deals')}
            className="text-xs font-semibold text-[#088395] hover:underline flex items-center gap-1"
          >
            <span>View All Deals</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Responsive Table Wrapper (ensures no horizontal cut-off!) */}
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider">
                <th className="pb-2.5 font-semibold">Title & Description</th>
                <th className="pb-2.5 font-semibold">Company</th>
                <th className="pb-2.5 font-semibold">Key Contact</th>
                <th className="pb-2.5 font-semibold">Date Received</th>
                <th className="pb-2.5 font-semibold">Current Status</th>
                <th className="pb-2.5 font-semibold">Follow-Up Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDeals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No active inquiries or deals logged yet.
                  </td>
                </tr>
              ) : (
                recentDeals.map((deal) => {
                const compName = getCompanyName(deal.companyId);
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
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-medium text-slate-900 max-w-[260px] truncate">
                      {deal.title}
                      <span className="block text-[11px] text-slate-500 font-normal truncate">
                        {deal.description}
                      </span>
                    </td>
                    <td className="py-3 text-slate-700 font-medium">
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCompany(deal.companyId);
                        }}
                        className="hover:text-[#088395] hover:underline"
                      >
                        {compName}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">
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
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EB673E]"></span>
                          {deal.currentFollowUpStage}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
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
