export type RelationshipStatus = 'active' | 'previous' | 'prospect';

export type DealStatus = 'New' | 'In Progress' | 'Follow-Up Required' | 'Closed' | 'Lost';

export type DealType = 'Inquiry' | 'Project Deal' | 'Pilot Program' | 'Technical Audit' | 'Implementation' | 'Retainer';

export type FollowUpSequence = 'First Follow-Up' | 'Second Follow-Up' | 'Third Follow-Up' | 'Additional Follow-Up';

export type FollowUpStatus = 'Pending' | 'Completed' | 'Overdue' | 'Rescheduled';

export interface CompanyBackendStats {
  total_projects: number;
  closed_projects: number;
  ongoing_projects: number;
  lost_projects: number;
  inquiry_count: number;
  contacts_count: number;
  pending_follow_ups: number;
  has_worked_before: boolean;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  relationshipStatus: RelationshipStatus; // active = currently working, previous = worked with before, prospect = new lead
  location: string;
  website: string;
  notes: string;
  firstEngagedDate: string;
  lastInteractionDate: string;
  stats?: CompanyBackendStats;
  created_at?: string;
  updated_at?: string | null;
}

export interface CompanyCreateInput {
  name: string;
  industry?: string;
  relationship_status?: RelationshipStatus;
  location?: string;
  website?: string;
  notes?: string;
  first_engaged_date?: string;
}

export interface CompanyUpdateInput {
  name?: string;
  industry?: string;
  relationship_status?: RelationshipStatus;
  location?: string;
  website?: string;
  notes?: string;
  first_engaged_date?: string;
  last_interaction_date?: string;
}

export interface CompanyListResponse {
  total: number;
  items: any[];
}

export interface ContactPerson {
  id: string;
  companyId: string;
  name: string;
  designation: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  notes: string;
  lastContactedDate: string;
  company_name?: string;
  created_at?: string;
  updated_at?: string | null;
}

export interface ContactCreateInput {
  company_id: string | number;
  name: string;
  designation?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
  notes?: string;
  last_contacted_date?: string;
}

export interface ContactUpdateInput {
  company_id?: string | number;
  name?: string;
  designation?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
  notes?: string;
  last_contacted_date?: string;
}

export interface FollowUpRecord {
  id: string;
  inquiryDealId: string;
  companyId: string;
  contactPersonId: string;
  sequence: FollowUpSequence;
  status: FollowUpStatus;
  scheduledDate: string; // YYYY-MM-DD
  completedDate?: string; // YYYY-MM-DD
  performedBy: string;
  channel: 'Email' | 'Phone Call' | 'Video Meeting' | 'In-Person' | 'Direct Message';
  notes: string;
  outcome?: string;
  nextFollowUpDate?: string;
  company_name?: string;
  contact_name?: string;
  deal_title?: string;
  created_at?: string;
}

export interface FollowUpCreateInput {
  inquiry_deal_id?: string | number;
  company_id: string | number;
  contact_person_id?: string | number;
  sequence?: FollowUpSequence;
  scheduled_date: string;
  performed_by?: string;
  channel?: string;
  notes?: string;
}

export interface FollowUpCompleteInput {
  completed_date?: string;
  outcome?: string;
  notes?: string;
  next_follow_up_date?: string;
  next_notes?: string;
  next_date?: string;
  next_channel?: string;
  schedule_next?: boolean;
}

export interface FollowUpRescheduleInput {
  scheduled_date: string;
  reason?: string;
}

export interface InquiryDeal {
  id: string;
  title: string;
  type: DealType;
  companyId: string;
  contactPersonId: string;
  description: string;
  dateReceived: string; // YYYY-MM-DD
  status: DealStatus;
  priority: 'High' | 'Medium' | 'Low';
  currentFollowUpStage: FollowUpSequence | 'None';
  nextFollowUpDate?: string; // YYYY-MM-DD
  notes: string;
  closedDate?: string;
  lostReason?: string;
  company_name?: string;
  contact_name?: string;
  created_at?: string;
  updated_at?: string | null;
}

export interface DealCreateInput {
  title: string;
  deal_type?: DealType;
  company_id: string | number;
  contact_person_id?: string | number;
  description?: string;
  date_received?: string;
  status?: DealStatus;
  priority?: 'High' | 'Medium' | 'Low';
  current_follow_up_stage?: FollowUpSequence | 'None';
  next_follow_up_date?: string;
  notes?: string;
}

export interface DealUpdateInput {
  title?: string;
  deal_type?: DealType;
  company_id?: string | number;
  contact_person_id?: string | number;
  description?: string;
  status?: DealStatus;
  priority?: 'High' | 'Medium' | 'Low';
  current_follow_up_stage?: FollowUpSequence | 'None';
  next_follow_up_date?: string;
  notes?: string;
  closed_date?: string;
  lost_reason?: string;
}

export interface InteractionLog {
  id: string;
  companyId: string;
  contactPersonId: string;
  inquiryDealId?: string;
  date: string;
  type: 'Inquiry Received' | 'Project Kickoff' | 'Milestone Review' | 'Project Completed' | 'Follow-Up Call' | 'Email Thread' | 'Status Update' | 'Client Review';
  title: string;
  details: string;
  loggedBy: string;
  company_name?: string;
  contact_name?: string;
  created_at?: string;
}

export interface InteractionCreateInput {
  company_id: string | number;
  contact_person_id?: string | number;
  inquiry_deal_id?: string | number;
  date?: string;
  interaction_type?: string;
  title: string;
  details?: string;
  logged_by?: string;
}

export interface DashboardMetrics {
  total_companies: number;
  active_companies: number;
  previous_companies: number;
  total_contacts: number;
  total_inquiries: number;
  ongoing_deals: number;
  closed_deals: number;
  lost_deals: number;
  pending_follow_ups: number;
  first_follow_ups_pending: number;
  first_follow_ups_completed: number;
  second_follow_ups_pending: number;
  second_follow_ups_completed: number;
  third_follow_ups_pending: number;
  third_follow_ups_completed: number;
  additional_follow_ups_pending: number;
  additional_follow_ups_completed: number;
  overdue_follow_ups: number;
  due_today_follow_ups: number;
}

export interface LookupResponse {
  query: string;
  has_matches: boolean;
  matched_companies: any[];
  matched_contacts: any[];
  matched_deals: any[];
}
