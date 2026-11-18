import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  CalendarClock, 
  History, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { Company, ContactPerson, InquiryDeal, FollowUpRecord, InteractionLog } from '../types/crm';
import { getCompanyStatistics } from '../services/storage';
import { dashboardApi } from '../services/dashboardApi';

interface RelationshipLookupProps {
  companies: Company[];
  contacts: ContactPerson[];
  deals: InquiryDeal[];
  followUps: FollowUpRecord[];
  interactions: InteractionLog[];
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSelectCompany: (companyId: string) => void;
  onSelectContact: (contactId: string) => void;
  onSelectDeal: (dealId: string) => void;
  isFullPageView?: boolean;
}

export const RelationshipLookupModal: React.FC<RelationshipLookupProps> = ({
  companies,
  contacts,
  deals,
  followUps,
  interactions,
  isOpen,
  onClose,
  initialQuery = '',
  onSelectCompany,
  onSelectContact,
  onSelectDeal,
  isFullPageView = false,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [apiResults, setApiResults] = useState<{
    matchedCompanies: Company[];
    matchedContacts: ContactPerson[];
    matchedDeals: InquiryDeal[];
  } | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const cleanQuery = query.toLowerCase().trim();

  // Debounced API search via /dashboard/lookup
  useEffect(() => {
    if (!cleanQuery) {
      setApiResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await dashboardApi.universalLookup(cleanQuery);
        setApiResults({
          matchedCompanies: res.matched_companies,
          matchedContacts: res.matched_contacts,
          matchedDeals: res.matched_deals,
        });
      } catch (err) {
        // Fall back to client filtering
        setApiResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [cleanQuery]);

  if (!isOpen && !isFullPageView) return null;

  // Local fallback contacts
  const localMatchedContacts = contacts.filter((c) => {
    if (!cleanQuery) return false;
    const comp = companies.find(comp => comp.id === c.companyId);
    return (
      c.name.toLowerCase().includes(cleanQuery) ||
      c.email.toLowerCase().includes(cleanQuery) ||
      c.phone.toLowerCase().includes(cleanQuery) ||
      c.designation.toLowerCase().includes(cleanQuery) ||
      (comp && comp.name.toLowerCase().includes(cleanQuery))
    );
  });

  // Local fallback companies
  const localMatchedCompanies = companies.filter((comp) => {
    if (!cleanQuery) return false;
    return (
      comp.name.toLowerCase().includes(cleanQuery) ||
      comp.industry.toLowerCase().includes(cleanQuery) ||
      comp.location.toLowerCase().includes(cleanQuery)
    );
  });

  const matchedContacts = apiResults ? apiResults.matchedContacts : localMatchedContacts;
  const matchedCompanies = apiResults ? apiResults.matchedCompanies : localMatchedCompanies;

  // Quick lookups derived dynamically from active records (no dummy records)
  const sampleSearches = [
    ...companies.slice(0, 3).map(c => ({ label: c.name, query: c.name })),
    ...contacts.slice(0, 2).map(c => ({ label: c.name, query: c.name })),
  ];

  const content = (
    <div className="space-y-6">
      {/* Search Bar & Instruction */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Universal Relationship & Work History Lookup
          </label>
          <span className="text-[11px] text-slate-400">Search by name, email, phone, or company</span>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a contact person name, email address, phone, or company name..."
            autoFocus
            className="w-full pl-11 pr-10 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#088395] focus:ring-2 focus:ring-[#088395]/15 transition-all shadow-inner"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Test Chips */}
        {sampleSearches.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs text-slate-500">
            <span className="text-[11px] font-medium text-slate-400">Quick lookups:</span>
            {sampleSearches.map((sample) => (
              <button
                key={sample.label}
                onClick={() => setQuery(sample.query)}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* When query is empty */}
      {!cleanQuery && (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-display font-semibold text-slate-800 text-base">
            Identify Existing Relationships Instantly
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            When an inbound email, phone call, or message arrives, enter their details above. The system instantly verifies whether we have worked with this person before, whether we worked with their company, what inquiries they handled, and past follow-up history.
          </p>
        </div>
      )}

      {/* When query produces no matches */}
      {cleanQuery && matchedContacts.length === 0 && matchedCompanies.length === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto font-bold text-sm">
            ?
          </div>
          <h4 className="font-display font-semibold text-slate-900 text-base">
            No Previous Relationship Found for &quot;{query}&quot;
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            This contact or company does not appear in our historical records. This is a brand new lead.
          </p>
        </div>
      )}

      {/* Matched Contacts Results List */}
      {matchedContacts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-[#088395]" />
              <span>Matching Contact Persons ({matchedContacts.length})</span>
            </h4>
          </div>

          <div className="space-y-4">
            {matchedContacts.map((contact) => {
              const company = companies.find(c => c.id === contact.companyId);
              const companyStats = company ? getCompanyStatistics(company.id, deals, contacts, followUps) : null;
              const personDeals = deals.filter(d => d.contactPersonId === contact.id);
              const personInteractions = interactions.filter(i => i.contactPersonId === contact.id);
              const personFollowUps = followUps.filter(f => f.contactPersonId === contact.id);

              const workedWithPerson = personDeals.some(d => d.status === 'Closed' || d.status === 'In Progress') || personInteractions.length > 1;
              const workedWithCompany = companyStats ? companyStats.hasWorkedBefore : false;

              return (
                <div
                  key={contact.id}
                  className="bg-white border-2 border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4"
                >
                  {/* Contact Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-lg text-slate-900">{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-teal-50 text-[#088395] rounded border border-teal-200 uppercase">
                            Primary
                          </span>
                        )}
                        <span className="text-xs text-slate-500">({contact.designation})</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {contact.email}
                        </span>
                        {contact.phone && (
                          <span className="flex items-center gap-1 font-mono-tabular">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {contact.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onClose();
                          onSelectContact(contact.id);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#088395] bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Full Person Profile →
                      </button>
                    </div>
                  </div>

                  {/* Immediate 5 Answers Verification Verdict Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {/* Answer 1: Worked with this person? */}
                    <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                      workedWithPerson ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase">
                        1. Worked With Person Before?
                      </div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        {workedWithPerson ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-800">YES — Existing Collaborator</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">NO — First-Time Inquiry</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {personDeals.length} deals on record · {personInteractions.length} interaction logs
                      </p>
                    </div>

                    {/* Answer 2: Worked with company before? */}
                    <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                      workedWithCompany ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase">
                        2. Worked With Their Company Before?
                      </div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        {workedWithCompany ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-800">YES — Worked {companyStats?.totalProjects} Times</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">NO / Prospect Company</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {companyStats?.closedProjects} closed projects · {companyStats?.ongoingProjects} ongoing
                      </p>
                    </div>
                  </div>

                  {/* Answer 3: Associated Company */}
                  {company && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                          3. Associated Company
                        </span>
                        <span className="font-semibold text-slate-900 text-sm">{company.name}</span>
                        <span className="text-slate-500 ml-2">({company.industry} · {company.location})</span>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          onSelectCompany(company.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors whitespace-nowrap"
                      >
                        Company History →
                      </button>
                    </div>
                  )}

                  {/* Answer 4: Previous Inquiries or Deals Involving Them */}
                  <div className="space-y-1.5 text-xs">
                    <span className="font-semibold text-slate-700 uppercase text-[11px] flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#EB673E]" />
                      <span>4. Previous Inquiries / Deals Involving Them ({personDeals.length})</span>
                    </span>

                    {personDeals.length === 0 ? (
                      <p className="text-slate-400 italic">No prior deals or inquiries recorded.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {personDeals.map((d) => (
                          <div
                            key={d.id}
                            onClick={() => {
                              onClose();
                              onSelectDeal(d.id);
                            }}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/80 cursor-pointer transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900">{d.title}</span>
                              <span className="text-slate-500 text-[11px] block truncate">{d.description}</span>
                            </div>
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white border border-slate-200 uppercase shrink-0">
                              {d.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Answer 5: Previous Interaction & Follow-Up History */}
                  <div className="space-y-1.5 text-xs">
                    <span className="font-semibold text-slate-700 uppercase text-[11px] flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-[#088395]" />
                      <span>5. Previous Follow-Up & Interaction History ({personFollowUps.length + personInteractions.length})</span>
                    </span>

                    {personFollowUps.length === 0 && personInteractions.length === 0 ? (
                      <p className="text-slate-400 italic">No communication touchpoints logged yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {personFollowUps.slice(0, 3).map((f) => (
                          <div key={f.id} className="p-2 bg-slate-50 rounded border border-slate-200/70 text-[11px] flex items-center justify-between gap-2">
                            <div>
                              <span className="font-semibold text-slate-800">{f.sequence}</span>
                              <span className="text-slate-500 ml-1">· via {f.channel}</span>
                              <p className="text-slate-600 truncate max-w-md">{f.notes}</p>
                            </div>
                            <span className="font-mono-tabular text-slate-500 shrink-0">
                              {f.completedDate || f.scheduledDate}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Matched Companies Results */}
      {matchedCompanies.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#088395]" />
              <span>Matching Organizations ({matchedCompanies.length})</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {matchedCompanies.map((comp) => {
              const stats = getCompanyStatistics(comp.id, deals, contacts, followUps);
              const compContacts = contacts.filter(c => c.companyId === comp.id);

              return (
                <div
                  key={comp.id}
                  onClick={() => {
                    onClose();
                    onSelectCompany(comp.id);
                  }}
                  className="p-4 bg-white border border-slate-200/90 hover:border-[#088395] rounded-xl shadow-xs transition-all cursor-pointer group space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-display font-bold text-sm text-slate-900 group-hover:text-[#088395] transition-colors">
                        {comp.name}
                      </h5>
                      <span className="text-xs text-slate-500">{comp.industry} · {comp.location}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 uppercase">
                      {comp.relationshipStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span>Worked <strong className="font-mono-tabular text-slate-900">{stats.totalProjects}</strong> times</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-mono-tabular">{stats.closedProjects} Closed</span>
                    <span>·</span>
                    <span>{compContacts.length} Contacts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // If rendering inside a modal overlay
  if (!isFullPageView) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#088395] flex items-center justify-center text-white">
                <Search className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Relationship History & Verification Search
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  // Full page view inside the tabs
  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        {content}
      </div>
    </div>
  );
};
