import { Company, ContactPerson, InquiryDeal, FollowUpRecord, InteractionLog, FollowUpSequence } from '../types/crm';

const STORAGE_KEYS = {
  COMPANIES: 'relateflow_companies_v2',
  CONTACTS: 'relateflow_contacts_v2',
  DEALS: 'relateflow_deals_v2',
  FOLLOW_UPS: 'relateflow_follow_ups_v2',
  INTERACTIONS: 'relateflow_interactions_v2',
};

// Cleanup any old legacy v1 keys that stored hardcoded dummy data
try {
  localStorage.removeItem('relateflow_companies_v1');
  localStorage.removeItem('relateflow_contacts_v1');
  localStorage.removeItem('relateflow_deals_v1');
  localStorage.removeItem('relateflow_follow_ups_v1');
  localStorage.removeItem('relateflow_interactions_v1');
} catch {}

export const storage = {
  getCompanies(): Company[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCompanies(companies: Company[]) {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  },

  getContacts(): ContactPerson[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveContacts(contacts: ContactPerson[]) {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  },

  getDeals(): InquiryDeal[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEALS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveDeals(deals: InquiryDeal[]) {
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals));
  },

  getFollowUps(): FollowUpRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveFollowUps(followUps: FollowUpRecord[]) {
    localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(followUps));
  },

  getInteractions(): InteractionLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INTERACTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveInteractions(interactions: InteractionLog[]) {
    localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(interactions));
  },

  resetAll() {
    localStorage.removeItem(STORAGE_KEYS.COMPANIES);
    localStorage.removeItem(STORAGE_KEYS.CONTACTS);
    localStorage.removeItem(STORAGE_KEYS.DEALS);
    localStorage.removeItem(STORAGE_KEYS.FOLLOW_UPS);
    localStorage.removeItem(STORAGE_KEYS.INTERACTIONS);
  }
};

export interface CompanyStats {
  totalProjects: number;
  closedProjects: number;
  ongoingProjects: number;
  lostProjects: number;
  inquiryCount: number;
  contactsCount: number;
  pendingFollowUps: number;
  hasWorkedBefore: boolean;
}

export function getCompanyStatistics(companyId: string, deals: InquiryDeal[], contacts: ContactPerson[], followUps: FollowUpRecord[]): CompanyStats {
  const companyDeals = deals.filter(d => String(d.companyId) === String(companyId));
  const companyContacts = contacts.filter(c => String(c.companyId) === String(companyId));
  const companyFollowUps = followUps.filter(f => String(f.companyId) === String(companyId));

  const closedProjects = companyDeals.filter(d => d.status === 'Closed').length;
  const ongoingProjects = companyDeals.filter(d => d.status === 'In Progress' || d.status === 'New' || d.status === 'Follow-Up Required').length;
  const lostProjects = companyDeals.filter(d => d.status === 'Lost').length;
  const totalProjects = closedProjects + ongoingProjects + lostProjects;

  const pendingFollowUps = companyFollowUps.filter(f => f.status === 'Pending' || f.status === 'Overdue').length;

  return {
    totalProjects,
    closedProjects,
    ongoingProjects,
    lostProjects,
    inquiryCount: companyDeals.length,
    contactsCount: companyContacts.length,
    pendingFollowUps,
    hasWorkedBefore: closedProjects > 0 || totalProjects > 1,
  };
}

export interface DashboardMetrics {
  totalCompanies: number;
  activeCompanies: number;
  previousCompanies: number;
  totalContacts: number;
  totalInquiries: number;
  ongoingDeals: number;
  closedDeals: number;
  lostDeals: number;
  pendingFollowUps: number;
  firstFollowUpsPending: number;
  firstFollowUpsCompleted: number;
  secondFollowUpsPending: number;
  secondFollowUpsCompleted: number;
  thirdFollowUpsPending: number;
  thirdFollowUpsCompleted: number;
  additionalFollowUpsPending: number;
  additionalFollowUpsCompleted: number;
  overdueFollowUps: number;
  dueTodayFollowUps: number;
}

export function calculateDashboardMetrics(
  companies: Company[],
  contacts: ContactPerson[],
  deals: InquiryDeal[],
  followUps: FollowUpRecord[]
): DashboardMetrics {
  const todayStr = new Date().toISOString().slice(0, 10);

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.relationshipStatus === 'active').length;
  const previousCompanies = companies.filter(c => c.relationshipStatus === 'previous').length;
  const totalContacts = contacts.length;

  const totalInquiries = deals.filter(d => d.type === 'Inquiry' || d.status === 'New' || d.status === 'Follow-Up Required').length;
  const ongoingDeals = deals.filter(d => d.status === 'In Progress').length;
  const closedDeals = deals.filter(d => d.status === 'Closed').length;
  const lostDeals = deals.filter(d => d.status === 'Lost').length;

  // Follow up statistics
  const isOverdue = (f: FollowUpRecord) => f.status === 'Overdue' || (f.status === 'Pending' && f.scheduledDate < todayStr);
  const isDueToday = (f: FollowUpRecord) => f.status === 'Pending' && f.scheduledDate === todayStr;

  const overdueFollowUps = followUps.filter(isOverdue).length;
  const dueTodayFollowUps = followUps.filter(isDueDue => isDueToday(isDueDue)).length;
  const pendingFollowUps = followUps.filter(f => f.status === 'Pending' || f.status === 'Overdue').length;

  const firstFollowUpsPending = followUps.filter(f => f.sequence === 'First Follow-Up' && (f.status === 'Pending' || f.status === 'Overdue')).length;
  const firstFollowUpsCompleted = followUps.filter(f => f.sequence === 'First Follow-Up' && f.status === 'Completed').length;

  const secondFollowUpsPending = followUps.filter(f => f.sequence === 'Second Follow-Up' && (f.status === 'Pending' || f.status === 'Overdue')).length;
  const secondFollowUpsCompleted = followUps.filter(f => f.sequence === 'Second Follow-Up' && f.status === 'Completed').length;

  const thirdFollowUpsPending = followUps.filter(f => f.sequence === 'Third Follow-Up' && (f.status === 'Pending' || f.status === 'Overdue')).length;
  const thirdFollowUpsCompleted = followUps.filter(f => f.sequence === 'Third Follow-Up' && f.status === 'Completed').length;

  const additionalFollowUpsPending = followUps.filter(f => f.sequence === 'Additional Follow-Up' && (f.status === 'Pending' || f.status === 'Overdue')).length;
  const additionalFollowUpsCompleted = followUps.filter(f => f.sequence === 'Additional Follow-Up' && f.status === 'Completed').length;

  return {
    totalCompanies,
    activeCompanies,
    previousCompanies,
    totalContacts,
    totalInquiries,
    ongoingDeals,
    closedDeals,
    lostDeals,
    pendingFollowUps,
    firstFollowUpsPending,
    firstFollowUpsCompleted,
    secondFollowUpsPending,
    secondFollowUpsCompleted,
    thirdFollowUpsPending,
    thirdFollowUpsCompleted,
    additionalFollowUpsPending,
    additionalFollowUpsCompleted,
    overdueFollowUps,
    dueTodayFollowUps,
  };
}

export function advanceSequence(current: FollowUpSequence): FollowUpSequence {
  switch (current) {
    case 'First Follow-Up':
      return 'Second Follow-Up';
    case 'Second Follow-Up':
      return 'Third Follow-Up';
    case 'Third Follow-Up':
    case 'Additional Follow-Up':
      return 'Additional Follow-Up';
    default:
      return 'First Follow-Up';
  }
}
