/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Company, 
  ContactPerson, 
  InquiryDeal, 
  FollowUpRecord, 
  InteractionLog, 
  DealStatus, 
  FollowUpSequence,
  DashboardMetrics 
} from './types/crm';
import { storage, calculateDashboardMetrics, advanceSequence } from './services/storage';
import { Navigation, ActiveTab } from './components/Navigation';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { CompaniesView } from './components/CompaniesView';
import { ContactsView } from './components/ContactsView';
import { FollowUpsView } from './components/FollowUpsView';
import { DealsInquiriesView } from './components/DealsInquiriesView';
import { RelationshipLookupModal } from './components/RelationshipLookupModal';
import { 
  AddCompanyModal, 
  EditCompanyModal,
  AddContactModal, 
  EditContactModal,
  AddDealModal, 
  EditDealModal,
  CompleteFollowUpModal,
  ScheduleFollowUpModal,
  LogInteractionModal
} from './components/ActionModals';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthView } from './components/auth/AuthView';
import { companyApi } from './services/companyApi';
import { contactApi } from './services/contactApi';
import { dealApi } from './services/dealApi';
import { followUpApi } from './services/followUpApi';
import { interactionApi } from './services/interactionApi';
import { dashboardApi } from './services/dashboardApi';

function CRMWorkspace() {
  // Persistent CRM State
  const [companies, setCompanies] = useState<Company[]>(() => storage.getCompanies());
  const [contacts, setContacts] = useState<ContactPerson[]>(() => storage.getContacts());
  const [deals, setDeals] = useState<InquiryDeal[]>(() => storage.getDeals());
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>(() => storage.getFollowUps());
  const [interactions, setInteractions] = useState<InteractionLog[]>(() => storage.getInteractions());
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);

  // Backend Sync State
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selected Detail Views
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Modal Open States
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [addContactOpen, setAddContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);
  const [addContactInitialCompanyId, setAddContactInitialCompanyId] = useState<string | undefined>();

  const [addDealOpen, setAddDealOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<InquiryDeal | null>(null);
  const [addDealInitialCompanyId, setAddDealInitialCompanyId] = useState<string | undefined>();
  const [addDealInitialContactId, setAddDealInitialContactId] = useState<string | undefined>();

  const [completingFollowUp, setCompletingFollowUp] = useState<FollowUpRecord | null>(null);

  const [scheduleFollowUpOpen, setScheduleFollowUpOpen] = useState(false);
  const [scheduleFollowUpDealId, setScheduleFollowUpDealId] = useState<string | undefined>();
  const [scheduleFollowUpContactId, setScheduleFollowUpContactId] = useState<string | undefined>();

  const [logInteractionOpen, setLogInteractionOpen] = useState(false);
  const [logInteractionCompanyId, setLogInteractionCompanyId] = useState<string | undefined>();

  // Fetch Live Data Concurrently on Mount from Backend APIs
  const loadBackendData = async () => {
    setIsLoadingData(true);
    setSyncError(null);
    try {
      const [compRes, contRes, dealRes, folRes, intRes, dashRes] = await Promise.allSettled([
        companyApi.getCompanies({ limit: 500 }),
        contactApi.getContacts({ limit: 500 }),
        dealApi.getDeals({ limit: 500 }),
        followUpApi.getFollowUps({ limit: 500 }),
        interactionApi.getInteractions({ limit: 500 }),
        dashboardApi.getDashboardMetrics(),
      ]);

      let syncFailed = false;

      if (compRes.status === 'fulfilled') {
        setCompanies(compRes.value.items);
        storage.saveCompanies(compRes.value.items);
      } else {
        syncFailed = true;
      }

      if (contRes.status === 'fulfilled') {
        setContacts(contRes.value.items);
        storage.saveContacts(contRes.value.items);
      } else {
        syncFailed = true;
      }

      if (dealRes.status === 'fulfilled') {
        setDeals(dealRes.value.items);
        storage.saveDeals(dealRes.value.items);
      } else {
        syncFailed = true;
      }

      if (folRes.status === 'fulfilled') {
        setFollowUps(folRes.value.items);
        storage.saveFollowUps(folRes.value.items);
      } else {
        syncFailed = true;
      }

      if (intRes.status === 'fulfilled') {
        setInteractions(intRes.value.items);
        storage.saveInteractions(intRes.value.items);
      } else {
        syncFailed = true;
      }

      if (dashRes.status === 'fulfilled') {
        setDashboardMetrics(dashRes.value);
      }

      if (syncFailed) {
        setSyncError('Some live CRM records could not be synced from the backend.');
      }
    } catch (err: any) {
      console.warn('Backend sync failed:', err);
      setSyncError('Could not sync live records with backend.');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadBackendData();
  }, []);

  // Metrics for badges
  const metrics = calculateDashboardMetrics(companies, contacts, deals, followUps);

  // Handlers
  const handleResetData = () => {
    storage.resetAll();
    setCompanies([]);
    setContacts([]);
    setDeals([]);
    setFollowUps([]);
    setInteractions([]);
    setSelectedCompanyId(null);
    setSelectedContactId(null);
    setSelectedDealId(null);
  };

  // Company Handlers
  const handleAddCompany = async (newCompData: Omit<Company, 'id' | 'firstEngagedDate' | 'lastInteractionDate'>) => {
    try {
      const createdCompany = await companyApi.createCompany({
        name: newCompData.name,
        industry: newCompData.industry,
        relationship_status: newCompData.relationshipStatus,
        location: newCompData.location,
        website: newCompData.website,
        notes: newCompData.notes,
      });
      const updated = [createdCompany, ...companies];
      setCompanies(updated);
      storage.saveCompanies(updated);
      setSelectedCompanyId(createdCompany.id);
      setActiveTab('companies');
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdateCompany = async (companyId: string, data: Partial<Company>) => {
    try {
      const updatedCompany = await companyApi.updateCompany(companyId, {
        name: data.name,
        industry: data.industry,
        relationship_status: data.relationshipStatus,
        location: data.location,
        website: data.website,
        notes: data.notes,
        first_engaged_date: data.firstEngagedDate,
      });
      const updated = companies.map(c => String(c.id) === String(companyId) ? updatedCompany : c);
      setCompanies(updated);
      storage.saveCompanies(updated);
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      await companyApi.deleteCompany(companyId);
      const updated = companies.filter(c => String(c.id) !== String(companyId));
      setCompanies(updated);
      storage.saveCompanies(updated);
      if (String(selectedCompanyId) === String(companyId)) {
        setSelectedCompanyId(null);
      }
    } catch (err: any) {
      throw err;
    }
  };

  // Contact Handlers
  const handleAddContact = async (newContactData: Omit<ContactPerson, 'id' | 'lastContactedDate'>) => {
    try {
      const createdContact = await contactApi.createContact({
        company_id: Number(newContactData.companyId),
        name: newContactData.name,
        email: newContactData.email,
        phone: newContactData.phone,
        designation: newContactData.designation,
        is_primary: newContactData.isPrimary,
        notes: newContactData.notes,
      });
      const updated = [createdContact, ...contacts];
      setContacts(updated);
      storage.saveContacts(updated);
      setSelectedContactId(createdContact.id);
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdateContact = async (contactId: string, data: Partial<ContactPerson>) => {
    try {
      const updatedContact = await contactApi.updateContact(contactId, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        designation: data.designation,
        is_primary: data.isPrimary,
        notes: data.notes,
      });
      const updated = contacts.map(c => String(c.id) === String(contactId) ? updatedContact : c);
      setContacts(updated);
      storage.saveContacts(updated);
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await contactApi.deleteContact(contactId);
      const updated = contacts.filter(c => String(c.id) !== String(contactId));
      setContacts(updated);
      storage.saveContacts(updated);
      if (String(selectedContactId) === String(contactId)) {
        setSelectedContactId(null);
      }
    } catch (err: any) {
      throw err;
    }
  };

  // Deal Handlers
  const handleAddDeal = async (dealData: Omit<InquiryDeal, 'id' | 'currentFollowUpStage'>) => {
    try {
      const created = await dealApi.createDeal({
        company_id: Number(dealData.companyId),
        contact_person_id: dealData.contactPersonId ? Number(dealData.contactPersonId) : undefined,
        title: dealData.title,
        deal_type: dealData.type,
        description: dealData.description,
        date_received: dealData.dateReceived,
        status: dealData.status,
        priority: dealData.priority,
        next_follow_up_date: dealData.nextFollowUpDate,
        notes: dealData.notes,
      });
      const updatedDeals = [created, ...deals];
      setDeals(updatedDeals);
      storage.saveDeals(updatedDeals);
      setSelectedDealId(created.id);

      // Refresh follow-ups if backend created initial follow-up
      try {
        const folRes = await followUpApi.getFollowUps({ deal_id: created.id });
        if (folRes.items.length > 0) {
          const updatedF = [...folRes.items, ...followUps.filter(f => f.inquiryDealId !== created.id)];
          setFollowUps(updatedF);
          storage.saveFollowUps(updatedF);
        }
      } catch (_) {}
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdateDeal = async (dealId: string, data: Partial<InquiryDeal>) => {
    try {
      const updatedDeal = await dealApi.updateDeal(dealId, {
        title: data.title,
        deal_type: data.type,
        description: data.description,
        status: data.status,
        priority: data.priority,
        next_follow_up_date: data.nextFollowUpDate,
        notes: data.notes,
        lost_reason: data.lostReason,
        closed_date: data.closedDate,
      });
      const updated = deals.map(d => String(d.id) === String(dealId) ? updatedDeal : d);
      setDeals(updated);
      storage.saveDeals(updated);
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdateDealStatus = async (dealId: string, newStatus: DealStatus, lostReason?: string) => {
    try {
      const updatedDeal = await dealApi.updateDeal(dealId, {
        status: newStatus,
        lost_reason: newStatus === 'Lost' ? (lostReason || 'Client did not proceed.') : undefined,
        closed_date: newStatus === 'Closed' ? new Date().toISOString().slice(0, 10) : undefined,
      });
      const updated = deals.map(d => String(d.id) === String(dealId) ? updatedDeal : d);
      setDeals(updated);
      storage.saveDeals(updated);
    } catch (err: any) {
      console.error('Failed to update deal status on backend:', err);
      // Local optimistic fallback
      const updatedDeals = deals.map((d) => {
        if (String(d.id) === String(dealId)) {
          return {
            ...d,
            status: newStatus,
            lostReason: newStatus === 'Lost' ? (lostReason || 'Client did not proceed.') : undefined,
            closedDate: newStatus === 'Closed' ? new Date().toISOString().slice(0, 10) : d.closedDate,
          };
        }
        return d;
      });
      setDeals(updatedDeals);
      storage.saveDeals(updatedDeals);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    try {
      await dealApi.deleteDeal(dealId);
      const updated = deals.filter(d => String(d.id) !== String(dealId));
      setDeals(updated);
      storage.saveDeals(updated);
      if (String(selectedDealId) === String(dealId)) {
        setSelectedDealId(null);
      }
    } catch (err: any) {
      throw err;
    }
  };

  // Follow-Up Handlers
  const handleCompleteFollowUp = async (
    followUpId: string,
    outcome: string,
    notes: string,
    scheduleNext: boolean,
    nextDate?: string
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const target = followUps.find(f => String(f.id) === String(followUpId));
    try {
      const result = await followUpApi.completeFollowUp(followUpId, {
        outcome,
        notes,
        completed_date: today,
        schedule_next: scheduleNext,
        next_date: nextDate,
      });

      let updatedFollowUps = followUps.map(f => String(f.id) === String(followUpId) ? result.completed : f);
      if (result.next_follow_up) {
        updatedFollowUps = [result.next_follow_up, ...updatedFollowUps];
      }
      setFollowUps(updatedFollowUps);
      storage.saveFollowUps(updatedFollowUps);

      if (target?.inquiryDealId) {
        const nextStage = result.next_follow_up?.sequence || target.sequence;
        const updatedDeals = deals.map((d) => {
          if (String(d.id) === String(target.inquiryDealId)) {
            return {
              ...d,
              currentFollowUpStage: nextStage,
              nextFollowUpDate: scheduleNext ? nextDate : undefined,
            };
          }
          return d;
        });
        setDeals(updatedDeals);
        storage.saveDeals(updatedDeals);
      }

      // Add to interaction timeline
      const newLog: InteractionLog = {
        id: `log-${Date.now()}`,
        companyId: target?.companyId || '',
        contactPersonId: target?.contactPersonId || '',
        inquiryDealId: target?.inquiryDealId,
        date: today,
        type: 'Follow-Up Call',
        title: `${target?.sequence || 'Follow-Up'} Completed`,
        details: outcome,
        loggedBy: 'Account Lead',
      };
      const updatedLogs = [newLog, ...interactions];
      setInteractions(updatedLogs);
      storage.saveInteractions(updatedLogs);
    } catch (err: any) {
      console.warn('Backend complete follow-up failed, falling back to local update:', err);
      if (!target) return;
      let nextStage: FollowUpSequence = target.sequence;
      let updatedFollowUps = followUps.map((f) => {
        if (String(f.id) === String(followUpId)) {
          return {
            ...f,
            status: 'Completed' as const,
            completedDate: today,
            outcome,
            notes,
          };
        }
        return f;
      });

      if (scheduleNext && nextDate) {
        nextStage = advanceSequence(target.sequence);
        const newFol: FollowUpRecord = {
          id: `fol-${Date.now()}`,
          inquiryDealId: target.inquiryDealId,
          companyId: target.companyId,
          contactPersonId: target.contactPersonId,
          sequence: nextStage,
          status: 'Pending',
          scheduledDate: nextDate,
          performedBy: 'Account Lead',
          channel: 'Email',
          notes: `Follow-up sequence (${nextStage}) after: ${outcome}`,
        };
        updatedFollowUps.unshift(newFol);
      }
      setFollowUps(updatedFollowUps);
      storage.saveFollowUps(updatedFollowUps);

      if (target.inquiryDealId) {
        const updatedDeals = deals.map((d) => {
          if (String(d.id) === String(target.inquiryDealId)) {
            return {
              ...d,
              currentFollowUpStage: scheduleNext ? nextStage : target.sequence,
              nextFollowUpDate: scheduleNext ? nextDate : undefined,
            };
          }
          return d;
        });
        setDeals(updatedDeals);
        storage.saveDeals(updatedDeals);
      }
    }
  };

  const handleScheduleFollowUp = async (record: Omit<FollowUpRecord, 'id' | 'status'>) => {
    try {
      const created = await followUpApi.scheduleFollowUp({
        company_id: Number(record.companyId),
        contact_person_id: record.contactPersonId ? Number(record.contactPersonId) : undefined,
        inquiry_deal_id: record.inquiryDealId ? Number(record.inquiryDealId) : undefined,
        sequence: record.sequence,
        scheduled_date: record.scheduledDate,
        channel: record.channel,
        performed_by: record.performedBy,
        notes: record.notes,
      });
      const updated = [created, ...followUps];
      setFollowUps(updated);
      storage.saveFollowUps(updated);

      if (record.inquiryDealId) {
        const updatedDeals = deals.map((d) => {
          if (String(d.id) === String(record.inquiryDealId)) {
            return {
              ...d,
              currentFollowUpStage: record.sequence,
              nextFollowUpDate: record.scheduledDate,
            };
          }
          return d;
        });
        setDeals(updatedDeals);
        storage.saveDeals(updatedDeals);
      }
    } catch (err: any) {
      console.warn('Backend schedule follow up failed, saving locally:', err);
      const newFol: FollowUpRecord = {
        ...record,
        id: `fol-${Date.now()}`,
        status: 'Pending',
      };
      const updated = [newFol, ...followUps];
      setFollowUps(updated);
      storage.saveFollowUps(updated);
    }
  };

  const handleDeleteFollowUp = async (followUpId: string) => {
    try {
      await followUpApi.deleteFollowUp(followUpId);
      const updated = followUps.filter(f => String(f.id) !== String(followUpId));
      setFollowUps(updated);
      storage.saveFollowUps(updated);
    } catch (err: any) {
      throw err;
    }
  };

  // Interaction Handlers
  const handleLogInteraction = async (entry: {
    companyId: string;
    contactPersonId: string;
    type: any;
    title: string;
    details: string;
    date: string;
  }) => {
    try {
      const created = await interactionApi.logInteraction({
        company_id: Number(entry.companyId),
        contact_person_id: entry.contactPersonId ? Number(entry.contactPersonId) : undefined,
        interaction_type: entry.type,
        title: entry.title,
        details: entry.details,
        date: entry.date,
        logged_by: 'Account Lead',
      });
      const updated = [created, ...interactions];
      setInteractions(updated);
      storage.saveInteractions(updated);

      const updatedCompanies = companies.map((c) => {
        if (String(c.id) === String(entry.companyId)) {
          return {
            ...c,
            lastInteractionDate: entry.date,
          };
        }
        return c;
      });
      setCompanies(updatedCompanies);
      storage.saveCompanies(updatedCompanies);
    } catch (err: any) {
      console.warn('Backend log interaction failed, saving locally:', err);
      const newLog: InteractionLog = {
        ...entry,
        id: `log-${Date.now()}`,
        loggedBy: 'Team Member',
      };
      const updated = [newLog, ...interactions];
      setInteractions(updated);
      storage.saveInteractions(updated);
    }
  };

  // Quick navigation helpers
  const navigateToCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setActiveTab('companies');
  };

  const navigateToContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setActiveTab('contacts');
  };

  const navigateToDeal = (dealId: string) => {
    setSelectedDealId(dealId);
    setActiveTab('deals');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#1D1D1D] flex flex-col lg:flex-row antialiased">
      {/* Navigation Sidebar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'companies') setSelectedCompanyId(null);
          if (tab !== 'contacts') setSelectedContactId(null);
          if (tab !== 'deals') setSelectedDealId(null);
        }}
        pendingFollowUpsCount={metrics.pendingFollowUps}
        overdueCount={metrics.overdueFollowUps}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onRefreshData={loadBackendData}
        onResetData={handleResetData}
      />

      {/* Main Workspace Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Bar with Context Title, Universal Search, and Quick Entry CTA */}
        <TopBar
          activeTab={activeTab}
          onOpenLookup={(query) => {
            setLookupQuery(query || '');
            setLookupModalOpen(true);
          }}
          onOpenAddCompany={() => setAddCompanyOpen(true)}
          onOpenAddContact={() => {
            setAddContactInitialCompanyId(undefined);
            setAddContactOpen(true);
          }}
          onOpenAddDeal={() => {
            setAddDealInitialCompanyId(undefined);
            setAddDealInitialContactId(undefined);
            setAddDealOpen(true);
          }}
          onOpenLogFollowUp={() => {
            setScheduleFollowUpDealId(undefined);
            setScheduleFollowUpContactId(undefined);
            setScheduleFollowUpOpen(true);
          }}
        />

        {/* Sync Status Banner */}
        {syncError && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between">
            <span>{syncError}</span>
            <button
              onClick={() => setSyncError(null)}
              className="font-bold text-amber-900 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Area with strict anti-cutoff constraints */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              companies={companies}
              contacts={contacts}
              deals={deals}
              followUps={followUps}
              dashboardMetrics={dashboardMetrics}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectCompany={navigateToCompany}
              onSelectDeal={navigateToDeal}
              onOpenQuickCompleteFollowUp={(item) => setCompletingFollowUp(item)}
              onOpenLookup={(q) => {
                setLookupQuery(q || '');
                setLookupModalOpen(true);
              }}
            />
          )}

          {activeTab === 'companies' && (
            <CompaniesView
              companies={companies}
              contacts={contacts}
              deals={deals}
              followUps={followUps}
              interactions={interactions}
              selectedCompanyId={selectedCompanyId}
              onSelectCompany={(id) => setSelectedCompanyId(id)}
              onOpenAddCompany={() => setAddCompanyOpen(true)}
              onOpenEditCompany={(comp) => setEditingCompany(comp)}
              onDeleteCompany={handleDeleteCompany}
              onOpenAddContactForCompany={(cId) => {
                setAddContactInitialCompanyId(String(cId));
                setAddContactOpen(true);
              }}
              onOpenAddDealForCompany={(cId) => {
                setAddDealInitialCompanyId(String(cId));
                setAddDealInitialContactId(undefined);
                setAddDealOpen(true);
              }}
              onOpenLogInteractionForCompany={(cId) => {
                setLogInteractionCompanyId(String(cId));
                setLogInteractionOpen(true);
              }}
              onSelectContact={navigateToContact}
              onSelectDeal={navigateToDeal}
              onOpenLookup={(q) => {
                setLookupQuery(q || '');
                setLookupModalOpen(true);
              }}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsView
              companies={companies}
              contacts={contacts}
              deals={deals}
              followUps={followUps}
              interactions={interactions}
              selectedContactId={selectedContactId}
              onSelectContact={(id) => setSelectedContactId(id)}
              onSelectCompany={navigateToCompany}
              onOpenAddContact={() => {
                setAddContactInitialCompanyId(undefined);
                setAddContactOpen(true);
              }}
              onOpenEditContact={(cont) => setEditingContact(cont)}
              onDeleteContact={handleDeleteContact}
              onOpenAddDealForContact={(cId, pId) => {
                setAddDealInitialCompanyId(cId);
                setAddDealInitialContactId(pId);
                setAddDealOpen(true);
              }}
              onOpenLogFollowUpForContact={(pId) => {
                const deal = deals.find(d => d.contactPersonId === pId);
                setScheduleFollowUpDealId(deal?.id);
                setScheduleFollowUpContactId(pId);
                setScheduleFollowUpOpen(true);
              }}
            />
          )}

          {activeTab === 'follow-ups' && (
            <FollowUpsView
              companies={companies}
              contacts={contacts}
              deals={deals}
              followUps={followUps}
              onOpenScheduleFollowUp={() => {
                setScheduleFollowUpDealId(undefined);
                setScheduleFollowUpContactId(undefined);
                setScheduleFollowUpOpen(true);
              }}
              onOpenLogCompleteFollowUp={(fol) => setCompletingFollowUp(fol)}
              onDeleteFollowUp={handleDeleteFollowUp}
              onSelectCompany={navigateToCompany}
              onSelectDeal={navigateToDeal}
            />
          )}

          {activeTab === 'deals' && (
            <DealsInquiriesView
              companies={companies}
              contacts={contacts}
              deals={deals}
              followUps={followUps}
              interactions={interactions}
              selectedDealId={selectedDealId}
              onSelectDeal={(id) => setSelectedDealId(id)}
              onSelectCompany={navigateToCompany}
              onOpenAddDeal={() => {
                setAddDealInitialCompanyId(undefined);
                setAddDealInitialContactId(undefined);
                setAddDealOpen(true);
              }}
              onOpenEditDeal={(deal) => setEditingDeal(deal)}
              onDeleteDeal={handleDeleteDeal}
              onUpdateDealStatus={handleUpdateDealStatus}
              onOpenScheduleFollowUpForDeal={(dId) => {
                setScheduleFollowUpDealId(dId);
                setScheduleFollowUpContactId(undefined);
                setScheduleFollowUpOpen(true);
              }}
            />
          )}

          {activeTab === 'lookup' && (
            <RelationshipLookupModal
              companies={companies}
              contacts={contacts}
              deals={deals}
              followUps={followUps}
              interactions={interactions}
              isOpen={true}
              onClose={() => {}}
              initialQuery={lookupQuery}
              onSelectCompany={navigateToCompany}
              onSelectContact={navigateToContact}
              onSelectDeal={navigateToDeal}
              isFullPageView={true}
            />
          )}
        </main>
      </div>

      {/* Floating Global Universal Relationship Lookup Popover Modal */}
      {lookupModalOpen && (
        <RelationshipLookupModal
          companies={companies}
          contacts={contacts}
          deals={deals}
          followUps={followUps}
          interactions={interactions}
          isOpen={lookupModalOpen}
          onClose={() => {
            setLookupModalOpen(false);
            setLookupQuery('');
          }}
          initialQuery={lookupQuery}
          onSelectCompany={navigateToCompany}
          onSelectContact={navigateToContact}
          onSelectDeal={navigateToDeal}
          isFullPageView={false}
        />
      )}

      {/* Action Modals */}
      <AddCompanyModal
        isOpen={addCompanyOpen}
        onClose={() => setAddCompanyOpen(false)}
        existingCompanies={companies}
        onAddCompany={handleAddCompany}
      />

      <EditCompanyModal
        isOpen={!!editingCompany}
        onClose={() => setEditingCompany(null)}
        company={editingCompany}
        companies={companies}
        onUpdateCompany={handleUpdateCompany}
      />

      <AddContactModal
        isOpen={addContactOpen}
        onClose={() => setAddContactOpen(false)}
        companies={companies}
        existingContacts={contacts}
        initialCompanyId={addContactInitialCompanyId}
        onAddContact={handleAddContact}
      />

      <EditContactModal
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        contact={editingContact}
        companies={companies}
        onUpdateContact={handleUpdateContact}
      />

      <AddDealModal
        isOpen={addDealOpen}
        onClose={() => setAddDealOpen(false)}
        companies={companies}
        contacts={contacts}
        initialCompanyId={addDealInitialCompanyId}
        initialContactId={addDealInitialContactId}
        onAddDeal={handleAddDeal}
      />

      <EditDealModal
        isOpen={!!editingDeal}
        onClose={() => setEditingDeal(null)}
        deal={editingDeal}
        companies={companies}
        contacts={contacts}
        onUpdateDeal={handleUpdateDeal}
      />

      <CompleteFollowUpModal
        isOpen={!!completingFollowUp}
        onClose={() => setCompletingFollowUp(null)}
        followUp={completingFollowUp}
        onCompleteFollowUp={handleCompleteFollowUp}
      />

      <ScheduleFollowUpModal
        isOpen={scheduleFollowUpOpen}
        onClose={() => setScheduleFollowUpOpen(false)}
        companies={companies}
        contacts={contacts}
        deals={deals}
        initialDealId={scheduleFollowUpDealId}
        initialContactId={scheduleFollowUpContactId}
        onScheduleFollowUp={handleScheduleFollowUp}
      />

      <LogInteractionModal
        isOpen={logInteractionOpen}
        onClose={() => setLogInteractionOpen(false)}
        companies={companies}
        contacts={contacts}
        initialCompanyId={logInteractionCompanyId}
        onLogInteraction={handleLogInteraction}
      />
    </div>
  );
}

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#EB673E] animate-spin" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Loading RelateFlow CRM...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return <CRMWorkspace />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
