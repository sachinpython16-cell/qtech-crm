# Follow-Up Pipeline API Documentation

Base URL: `http://localhost:8000/api/v1/followups`

Interactive Swagger Docs: `http://localhost:8000/docs`

All endpoints require the Bearer authentication header:
```http
Authorization: Bearer <access_token>
```

---

## Overview
Automates your multi-stage client outreach queue:
- **Sequence Stages**:
  $$\text{First Follow-Up} \longrightarrow \text{Second Follow-Up} \longrightarrow \text{Third Follow-Up} \longrightarrow \text{Additional Follow-Up}$$
- **Status Lifecycle**: `"Pending"`, `"Completed"`, `"Overdue"`, `"Rescheduled"`.
- **Channels**: `"Email"`, `"Phone Call"`, `"Video Meeting"`, `"In-Person"`, `"Direct Message"`.
- **Automatic Sequence Advancement**: When completing a follow-up with `schedule_next: true`, the API marks the current task completed, logs the outcome on the company timeline, and schedules the next sequence step.

---

## 1. Schedule a Follow-Up

**Short Description**: Schedules a new follow-up for a deal and updates the deal's `next_follow_up_date`.

- **Method**: `POST`
- **URL**: `/api/v1/followups`
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
  "inquiry_deal_id": 1,
  "company_id": 1,
  "contact_person_id": 1,
  "sequence": "First Follow-Up",
  "scheduled_date": "2026-11-20",
  "performed_by": "Account Lead",
  "channel": "Phone Call",
  "notes": "Review technical proposal with Sarah."
}
```

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `inquiry_deal_id` | `integer` | Yes | - | Associated deal ID |
| `company_id` | `integer` | Yes | - | Associated company ID |
| `contact_person_id`| `integer` | No | `null` | Target contact person |
| `sequence` | `string` | No | `"First Follow-Up"` | `"First Follow-Up"`, `"Second Follow-Up"`, `"Third Follow-Up"`, `"Additional Follow-Up"` |
| `scheduled_date` | `string (date)`| Yes | - | Target date for outreach |
| `performed_by` | `string` | No | `"Account Lead"` | Team member responsible |
| `channel` | `string` | No | `"Phone Call"` | `"Email"`, `"Phone Call"`, `"Video Meeting"`, `"In-Person"`, `"Direct Message"` |
| `notes` | `string` | No | `null` | Pre-call checklist or notes |

### Responses

#### `201 Created`
```json
{
  "id": 1,
  "user_id": 1,
  "inquiry_deal_id": 1,
  "company_id": 1,
  "contact_person_id": 1,
  "sequence": "First Follow-Up",
  "status": "Pending",
  "scheduled_date": "2026-11-20",
  "completed_date": null,
  "performed_by": "Account Lead",
  "channel": "Phone Call",
  "notes": "Review technical proposal with Sarah.",
  "outcome": null,
  "next_follow_up_date": null,
  "company_name": "Acme Innovations Ltd",
  "contact_name": "Sarah Connor",
  "deal_title": "Cloud Infrastructure Migration",
  "is_overdue": false,
  "created_at": "2026-11-17T13:48:00Z",
  "updated_at": null
}
```

#### `404 Not Found` (Deal or Company not found)
```json
{
  "detail": "Deal/Inquiry not found"
}
```

---

## 2. List Follow-Ups

**Short Description**: Retrieves follow-up tasks with filtering by status, sequence, company, deal, or overdue flag.

- **Method**: `GET`
- **URL**: `/api/v1/followups`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Path Parameters**: None

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `string` | No | `null` | Filter by `"Pending"`, `"Completed"`, `"Overdue"`, `"Rescheduled"`, or `"all"` |
| `sequence` | `string` | No | `null` | Filter by `"First Follow-Up"`, `"Second Follow-Up"`, `"Third Follow-Up"`, `"Additional Follow-Up"` |
| `company_id` | `integer` | No | `null` | Filter by company ID |
| `deal_id` | `integer` | No | `null` | Filter by deal ID |
| `overdue_only` | `boolean` | No | `false` | Set `true` to return only overdue items (`scheduled_date < today`) |
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
      "inquiry_deal_id": 1,
      "company_id": 1,
      "contact_person_id": 1,
      "sequence": "First Follow-Up",
      "status": "Pending",
      "scheduled_date": "2026-11-20",
      "completed_date": null,
      "performed_by": "Account Lead",
      "channel": "Phone Call",
      "notes": "Review technical proposal with Sarah.",
      "outcome": null,
      "next_follow_up_date": null,
      "company_name": "Acme Innovations Ltd",
      "contact_name": "Sarah Connor",
      "deal_title": "Cloud Infrastructure Migration",
      "is_overdue": false,
      "created_at": "2026-11-17T13:48:00Z",
      "updated_at": null
    }
  ]
}
```

---

## 3. Get Single Follow-Up by ID

**Short Description**: Fetches a single follow-up record with company, deal, and overdue details.

- **Method**: `GET`
- **URL**: `/api/v1/followups/{follow_up_id}`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `follow_up_id` | `integer` | Yes | ID of the follow-up record |

- **Query Parameters**: None
- **Request Body**: None

### Responses

#### `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "inquiry_deal_id": 1,
  "company_id": 1,
  "contact_person_id": 1,
  "sequence": "First Follow-Up",
  "status": "Pending",
  "scheduled_date": "2026-11-20",
  "completed_date": null,
  "performed_by": "Account Lead",
  "channel": "Phone Call",
  "notes": "Review technical proposal with Sarah.",
  "outcome": null,
  "next_follow_up_date": null,
  "company_name": "Acme Innovations Ltd",
  "contact_name": "Sarah Connor",
  "deal_title": "Cloud Infrastructure Migration",
  "is_overdue": false,
  "created_at": "2026-11-17T13:48:00Z",
  "updated_at": null
}
```

#### `404 Not Found`
```json
{
  "detail": "Follow-up record not found"
}
```

---

## 4. Complete Follow-Up & Advance Sequence

**Short Description**: Marks follow-up as `"Completed"`, saves the outcome note, logs an interaction timeline entry, and optionally schedules the next sequence (`First` → `Second` → `Third` → `Additional`).

- **Method**: `POST`
- **URL**: `/api/v1/followups/{follow_up_id}/complete`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `follow_up_id` | `integer` | Yes | ID of the follow-up to mark completed |

- **Query Parameters**: None

### Request Body
```json
{
  "outcome": "Client requested updated pricing breakdown by Thursday.",
  "notes": "Sent overview deck; schedule second follow-up for next Tuesday.",
  "schedule_next": true,
  "next_date": "2026-11-24",
  "next_channel": "Email"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `outcome` | `string` | Yes | Result of the outreach/call |
| `notes` | `string` | No | Completion comments |
| `schedule_next` | `boolean` | No | Set `true` to advance to next sequence |
| `next_date` | `string (date)`| Conditional| Required if `schedule_next` is `true` |
| `next_channel` | `string` | No | Channel for next outreach (default `"Email"`) |

### Responses

#### `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "inquiry_deal_id": 1,
  "company_id": 1,
  "contact_person_id": 1,
  "sequence": "First Follow-Up",
  "status": "Completed",
  "scheduled_date": "2026-11-20",
  "completed_date": "2026-11-17",
  "performed_by": "Account Lead",
  "channel": "Phone Call",
  "notes": "Review technical proposal with Sarah.\n[Completed Notes]: Sent overview deck; schedule second follow-up for next Tuesday.",
  "outcome": "Client requested updated pricing breakdown by Thursday.",
  "next_follow_up_date": null,
  "company_name": "Acme Innovations Ltd",
  "contact_name": "Sarah Connor",
  "deal_title": "Cloud Infrastructure Migration",
  "is_overdue": false,
  "created_at": "2026-11-17T13:48:00Z",
  "updated_at": "2026-11-17T13:55:00Z"
}
```

#### `404 Not Found`
```json
{
  "detail": "Follow-up record not found"
}
```

---

## 5. Reschedule Follow-Up

**Short Description**: Postpones or changes the scheduled date of a pending follow-up and updates the deal record.

- **Method**: `PATCH`
- **URL**: `/api/v1/followups/{follow_up_id}/reschedule`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `follow_up_id` | `integer` | Yes | ID of the follow-up to reschedule |

- **Query Parameters**: None

### Request Body
```json
{
  "scheduled_date": "2026-11-25",
  "notes": "Client requested rescheduling due to out-of-office travel."
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `scheduled_date` | `string (date)`| Yes | New scheduled outreach date |
| `notes` | `string` | No | Reason or rescheduling notes |

### Responses

#### `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "inquiry_deal_id": 1,
  "company_id": 1,
  "contact_person_id": 1,
  "sequence": "First Follow-Up",
  "status": "Rescheduled",
  "scheduled_date": "2026-11-25",
  "completed_date": null,
  "performed_by": "Account Lead",
  "channel": "Phone Call",
  "notes": "Review technical proposal with Sarah.\n[Rescheduled]: Client requested rescheduling due to out-of-office travel.",
  "outcome": null,
  "next_follow_up_date": null,
  "company_name": "Acme Innovations Ltd",
  "contact_name": "Sarah Connor",
  "deal_title": "Cloud Infrastructure Migration",
  "is_overdue": false,
  "created_at": "2026-11-17T13:48:00Z",
  "updated_at": "2026-11-17T13:56:00Z"
}
```

#### `404 Not Found`
```json
{
  "detail": "Follow-up record not found"
}
```

---

## 6. Delete Follow-Up

**Short Description**: Removes a follow-up task.

- **Method**: `DELETE`
- **URL**: `/api/v1/followups/{follow_up_id}`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `follow_up_id` | `integer` | Yes | ID of the follow-up record to remove |

- **Query Parameters**: None
- **Request Body**: None

### Responses

#### `200 OK`
```json
{
  "message": "Follow-up deleted successfully"
}
```

#### `404 Not Found`
```json
{
  "detail": "Follow-up record not found"
}
```
