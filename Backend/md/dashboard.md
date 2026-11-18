# Dashboard & Relationship Lookup API Documentation

Base URL: `http://localhost:8000/api/v1/dashboard`

Interactive Swagger Docs: `http://localhost:8000/docs`

All endpoints require the Bearer authentication header:
```http
Authorization: Bearer <access_token>
```

---

## Overview
Provides high-level CRM operational intelligence and instant universal history lookup:
1. **Dashboard Metrics**: Real-time KPI numbers (active vs previous clients, overdue follow-ups, stage-by-stage pipeline counts).
2. **Universal Relationship Lookup**: Fast cross-table search across companies, contacts, phones, and emails to answer: *"Have we worked with this client or person before?"*.

---

## 1. Dashboard Metrics

**Short Description**: Computes real-time KPI aggregations across client companies, deals, and the follow-up queue.

- **Method**: `GET`
- **URL**: `/api/v1/dashboard/metrics`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body**: None

### Responses

#### `200 OK`
```json
{
  "total_companies": 14,
  "active_companies": 8,
  "previous_companies": 4,
  "total_contacts": 22,
  "total_inquiries": 7,
  "ongoing_deals": 5,
  "closed_deals": 12,
  "lost_deals": 3,
  "pending_follow_ups": 4,
  "first_follow_ups_pending": 2,
  "first_follow_ups_completed": 15,
  "second_follow_ups_pending": 1,
  "second_follow_ups_completed": 8,
  "third_follow_ups_pending": 1,
  "third_follow_ups_completed": 4,
  "additional_follow_ups_pending": 0,
  "additional_follow_ups_completed": 2,
  "overdue_follow_ups": 1,
  "due_today_follow_ups": 2
}
```

| Metric Field | Type | Description |
| :--- | :--- | :--- |
| `total_companies` | `integer` | Total registered client companies |
| `active_companies` | `integer` | Currently active client relationships |
| `previous_companies`| `integer` | Past clients worked with previously |
| `total_contacts` | `integer` | Total contact persons in directory |
| `total_inquiries` | `integer` | Inquiries and initial requests received |
| `ongoing_deals` | `integer` | Project deals currently in progress |
| `closed_deals` | `integer` | Successfully completed / won project deals |
| `lost_deals` | `integer` | Inquiries or deals marked lost |
| `pending_follow_ups` | `integer` | Active follow-up tasks awaiting completion |
| `first_follow_ups_pending` | `integer` | Pending 1st follow-up count |
| `first_follow_ups_completed` | `integer` | Completed 1st follow-up count |
| `second_follow_ups_pending` | `integer` | Pending 2nd follow-up count |
| `second_follow_ups_completed` | `integer` | Completed 2nd follow-up count |
| `third_follow_ups_pending` | `integer` | Pending 3rd follow-up count |
| `third_follow_ups_completed` | `integer` | Completed 3rd follow-up count |
| `additional_follow_ups_pending` | `integer` | Pending additional follow-up count |
| `additional_follow_ups_completed` | `integer` | Completed additional follow-up count |
| `overdue_follow_ups` | `integer` | Follow-ups whose scheduled date has passed |
| `due_today_follow_ups`| `integer` | Follow-ups due today |

---

## 2. Universal Relationship Lookup (Instant Search)

**Short Description**: Instant cross-table search that searches across company names, industries, locations, websites, contact names, emails, phone numbers, and deal titles. Instantly displays relationship status, previous work history, and primary contacts.

- **Method**: `GET`
- **URL**: `/api/v1/dashboard/lookup`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Path Parameters**: None

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `q` | `string` | Yes | - | Search term (e.g., person name, email, company, or phone number) |

- **Request Body**: None

### Example Request
```http
GET /api/v1/dashboard/lookup?q=sarah
```

### Responses

#### `200 OK`
```json
{
  "query": "sarah",
  "has_matches": true,
  "matched_companies": [
    {
      "id": 1,
      "user_id": 1,
      "name": "Acme Innovations Ltd",
      "industry": "Enterprise Software",
      "relationship_status": "active",
      "location": "New York, USA",
      "website": "acmeinnovations.com",
      "notes": "Met at SaaS Expo 2026",
      "first_engaged_date": "2026-01-10",
      "last_interaction_date": "2026-11-17",
      "created_at": "2026-01-10T09:00:00Z",
      "updated_at": "2026-11-17T13:50:00Z",
      "stats": {
        "total_projects": 3,
        "closed_projects": 2,
        "ongoing_projects": 1,
        "lost_projects": 0,
        "inquiry_count": 1,
        "contacts_count": 2,
        "pending_follow_ups": 1,
        "has_worked_before": true
      }
    }
  ],
  "matched_contacts": [
    {
      "id": 1,
      "user_id": 1,
      "company_id": 1,
      "company_name": "Acme Innovations Ltd",
      "name": "Sarah Connor",
      "designation": "VP of Engineering",
      "email": "sarah.connor@acme.com",
      "phone": "+1-555-0199",
      "is_primary": true,
      "notes": "Main decision maker",
      "last_contacted_date": "2026-11-17",
      "created_at": "2026-11-17T13:46:00Z",
      "updated_at": null
    }
  ],
  "matched_deals": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Cloud Infrastructure Migration",
      "deal_type": "Project Deal",
      "company_id": 1,
      "contact_person_id": 1,
      "description": "Migration of on-prem servers to AWS/GCP with microservices.",
      "date_received": "2026-11-17",
      "status": "In Progress",
      "priority": "High",
      "current_follow_up_stage": "First Follow-Up",
      "next_follow_up_date": "2026-11-20",
      "notes": "Need to prepare architecture proposal document",
      "closed_date": null,
      "lost_reason": null,
      "company_name": "Acme Innovations Ltd",
      "contact_name": "Sarah Connor",
      "created_at": "2026-11-17T13:47:00Z",
      "updated_at": null
    }
  ]
}
```
