# Interaction Timeline API Documentation

Base URL: `http://localhost:8000/api/v1/interactions`

Interactive Swagger Docs: `http://localhost:8000/docs`

All endpoints require the Bearer authentication header:
```http
Authorization: Bearer <access_token>
```

---

## Overview
Provides a unified historical timeline of all meetings, calls, reviews, and project milestones across client companies, contacts, and deals. Automatically updates the company's `last_interaction_date` upon logging.

- **Interaction Types**:
  - `"Inquiry Received"`
  - `"Project Kickoff"`
  - `"Milestone Review"`
  - `"Project Completed"`
  - `"Follow-Up Call"`
  - `"Email Thread"`
  - `"Status Update"`
  - `"Client Review"`

---

## 1. Log an Interaction

**Short Description**: Records a new communication or project event on the client timeline.

- **Method**: `POST`
- **URL**: `/api/v1/interactions`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
- **Path Parameters**: None
- **Query Parameters**: None

### Request Body
```json
{
  "company_id": 1,
  "contact_person_id": 1,
  "inquiry_deal_id": 1,
  "date": "2026-11-17",
  "interaction_type": "Project Kickoff",
  "title": "Architecture Review & Milestone Planning",
  "details": "Agreed on 4 sprint deliverables. Kickoff scheduled for Monday.",
  "logged_by": "Sachin"
}
```

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `company_id` | `integer` | Yes | - | Associated company ID |
| `contact_person_id`| `integer` | No | `null` | Associated contact person ID |
| `inquiry_deal_id` | `integer` | No | `null` | Associated deal ID |
| `date` | `string (date)`| No | Today's date | Event date |
| `interaction_type` | `string` | No | `"Status Update"` | Event category (`"Inquiry Received"`, `"Project Kickoff"`, `"Milestone Review"`, `"Project Completed"`, `"Follow-Up Call"`, `"Email Thread"`, `"Status Update"`, `"Client Review"`) |
| `title` | `string` | Yes | - | Event title / summary |
| `details` | `string` | No | `null` | Detailed discussion notes |
| `logged_by` | `string` | No | `"Team Member"` | Name of team member logging the event |

### Responses

#### `201 Created`
```json
{
  "id": 1,
  "user_id": 1,
  "company_id": 1,
  "contact_person_id": 1,
  "inquiry_deal_id": 1,
  "date": "2026-11-17",
  "interaction_type": "Project Kickoff",
  "title": "Architecture Review & Milestone Planning",
  "details": "Agreed on 4 sprint deliverables. Kickoff scheduled for Monday.",
  "logged_by": "Sachin",
  "company_name": "Acme Innovations Ltd",
  "contact_name": "Sarah Connor",
  "deal_title": "Cloud Infrastructure Migration",
  "created_at": "2026-11-17T13:49:00Z"
}
```

#### `404 Not Found` (Company, Contact, or Deal not found)
```json
{
  "detail": "Company not found"
}
```

---

## 2. List Interaction Timeline Entries

**Short Description**: Retrieves chronologically sorted activity records, filtered by `company_id`, `deal_id`, or `contact_id`.

- **Method**: `GET`
- **URL**: `/api/v1/interactions`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Path Parameters**: None

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `company_id` | `integer` | No | `null` | Filter timeline for a specific company |
| `deal_id` | `integer` | No | `null` | Filter timeline for a specific deal |
| `contact_id` | `integer` | No | `null` | Filter timeline for a specific person |
| `skip` | `integer` | No | `0` | Offset |
| `limit` | `integer` | No | `100` | Limit |

- **Request Body**: None

### Responses

#### `200 OK`
```json
{
  "total": 1,
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "company_id": 1,
      "contact_person_id": 1,
      "inquiry_deal_id": 1,
      "date": "2026-11-17",
      "interaction_type": "Project Kickoff",
      "title": "Architecture Review & Milestone Planning",
      "details": "Agreed on 4 sprint deliverables. Kickoff scheduled for Monday.",
      "logged_by": "Sachin",
      "company_name": "Acme Innovations Ltd",
      "contact_name": "Sarah Connor",
      "deal_title": "Cloud Infrastructure Migration",
      "created_at": "2026-11-17T13:49:00Z"
    }
  ]
}
```
