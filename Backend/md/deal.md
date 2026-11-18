# Deals & Inquiries API Documentation

Base URL: `http://localhost:8000/api/v1/deals`

Interactive Swagger Docs: `http://localhost:8000/docs`

All endpoints require the Bearer authentication header:
```http
Authorization: Bearer <access_token>
```

---

## Overview
Tracks client inquiries, proposals, and project delivery stages:
- **Deal Types**: `"Inquiry"`, `"Project Deal"`, `"Pilot Program"`, `"Technical Audit"`, `"Implementation"`, `"Retainer"`.
- **Status Lifecycle**: `"New"` → `"In Progress"` → `"Follow-Up Required"` → `"Closed"` / `"Lost"`.
- **Priorities**: `"High"`, `"Medium"`, `"Low"`.
- **Auto-Scheduling**: When creating a deal with `next_follow_up_date`, the API automatically creates the initial task in the follow-up pipeline.

---

## 1. Create Deal or Inquiry

**Short Description**: Creates a new deal or inquiry record. If `next_follow_up_date` is provided, the initial follow-up task is automatically scheduled.

- **Method**: `POST`
- **URL**: `/api/v1/deals`
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
  "notes": "Need to prepare architecture proposal document"
}
```

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `string` | Yes | - | Deal or inquiry title |
| `deal_type` | `string` | No | `"Inquiry"` | `"Inquiry"`, `"Project Deal"`, `"Pilot Program"`, `"Technical Audit"`, `"Implementation"`, `"Retainer"` |
| `company_id` | `integer` | Yes | - | Associated client company ID |
| `contact_person_id`| `integer` | No | `null` | Associated contact person ID |
| `description` | `string` | No | `null` | Project scope or inquiry requirements |
| `date_received` | `string (date)`| No | Today's date | Date inquiry was received |
| `status` | `string` | No | `"New"` | `"New"`, `"In Progress"`, `"Follow-Up Required"`, `"Closed"`, `"Lost"` |
| `priority` | `string` | No | `"Medium"` | `"High"`, `"Medium"`, `"Low"` |
| `current_follow_up_stage` | `string` | No | `"First Follow-Up"`| `"First Follow-Up"`, `"Second Follow-Up"`, `"Third Follow-Up"`, `"Additional Follow-Up"`, `"None"` |
| `next_follow_up_date`| `string (date)`| No| `null` | Target date for next outreach |
| `notes` | `string` | No | `null` | Internal notes |

### Responses

#### `201 Created`
```json
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
```

#### `400 Bad Request` (Contact does not belong to company)
```json
{
  "detail": "Contact person does not belong to the selected company"
}
```

#### `404 Not Found` (Company not found)
```json
{
  "detail": "Company not found"
}
```

---

## 2. List Deals & Inquiries

**Short Description**: Retrieves a list of deals with filtering by `company_id`, `contact_id`, `status`, `deal_type`, `priority`, or keyword search.

- **Method**: `GET`
- **URL**: `/api/v1/deals`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Path Parameters**: None

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `company_id` | `integer` | No | `null` | Filter by company ID |
| `contact_id` | `integer` | No | `null` | Filter by contact person ID |
| `status` | `string` | No | `null` | Filter by `"New"`, `"In Progress"`, `"Follow-Up Required"`, `"Closed"`, `"Lost"`, or `"all"` |
| `deal_type` | `string` | No | `null` | Filter by deal type |
| `priority` | `string` | No | `null` | Filter by `"High"`, `"Medium"`, or `"Low"` |
| `search` | `string` | No | `null` | Search by title, description, company, or contact |
| `skip` | `integer` | No | `0` | Pagination offset |
| `limit` | `integer` | No | `100` | Pagination limit |

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

---

## 3. Get Single Deal by ID

**Short Description**: Retrieves complete deal specifications, linked company name, and contact person.

- **Method**: `GET`
- **URL**: `/api/v1/deals/{deal_id}`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `deal_id` | `integer` | Yes | ID of the deal to retrieve |

- **Query Parameters**: None
- **Request Body**: None

### Responses

#### `200 OK`
```json
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
```

#### `404 Not Found`
```json
{
  "detail": "Deal/Inquiry not found"
}
```

---

## 4. Update Deal Status (Close or Mark Lost)

**Short Description**: Specialized endpoint to advance a deal's status. Automatically sets `closed_date` when closed, or records `lost_reason` when lost.

- **Method**: `PATCH`
- **URL**: `/api/v1/deals/{deal_id}/status`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `deal_id` | `integer` | Yes | ID of the deal |

- **Query Parameters**: None

### Request Body (Marking Lost)
```json
{
  "status": "Lost",
  "lost_reason": "Budget delayed to Q2 next fiscal year"
}
```

### Request Body (Marking Closed / Won)
```json
{
  "status": "Closed",
  "closed_date": "2026-11-17"
}
```

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `string` | Yes | - | `"New"`, `"In Progress"`, `"Follow-Up Required"`, `"Closed"`, `"Lost"` |
| `lost_reason` | `string` | No | `null` | Reason if status is `"Lost"` |
| `closed_date` | `string (date)`| No | Today's date | Date closed if status is `"Closed"` |

### Responses

#### `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "title": "Cloud Infrastructure Migration",
  "deal_type": "Project Deal",
  "company_id": 1,
  "contact_person_id": 1,
  "description": "Migration of on-prem servers to AWS/GCP with microservices.",
  "date_received": "2026-11-17",
  "status": "Closed",
  "priority": "High",
  "current_follow_up_stage": "First Follow-Up",
  "next_follow_up_date": null,
  "notes": "Need to prepare architecture proposal document",
  "closed_date": "2026-11-17",
  "lost_reason": null,
  "company_name": "Acme Innovations Ltd",
  "contact_name": "Sarah Connor",
  "created_at": "2026-11-17T13:47:00Z",
  "updated_at": "2026-11-17T13:54:00Z"
}
```

#### `404 Not Found`
```json
{
  "detail": "Deal/Inquiry not found"
}
```

---

## 5. Update Deal Details

**Short Description**: Modifies deal parameters, priority, description, or notes.

- **Method**: `PUT`
- **URL**: `/api/v1/deals/{deal_id}`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `deal_id` | `integer` | Yes | ID of the deal to update |

- **Query Parameters**: None

### Request Body *(All fields optional)*
```json
{
  "title": "Cloud Infrastructure Migration (Phase 1 & 2)",
  "priority": "High",
  "description": "Expanded scope to include automated CI/CD pipeline.",
  "notes": "Kickoff review meeting scheduled."
}
```

### Responses

#### `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "title": "Cloud Infrastructure Migration (Phase 1 & 2)",
  "deal_type": "Project Deal",
  "company_id": 1,
  "contact_person_id": 1,
  "description": "Expanded scope to include automated CI/CD pipeline.",
  "date_received": "2026-11-17",
  "status": "In Progress",
  "priority": "High",
  "current_follow_up_stage": "First Follow-Up",
  "next_follow_up_date": "2026-11-20",
  "notes": "Kickoff review meeting scheduled.",
  "closed_date": null,
  "lost_reason": null,
  "company_name": "Acme Innovations Ltd",
  "contact_name": "Sarah Connor",
  "created_at": "2026-11-17T13:47:00Z",
  "updated_at": "2026-11-17T13:55:00Z"
}
```

#### `404 Not Found`
```json
{
  "detail": "Deal/Inquiry not found"
}
```

---

## 6. Delete Deal (Soft Delete)

**Short Description**: Performs a soft-delete of the deal record.

- **Method**: `DELETE`
- **URL**: `/api/v1/deals/{deal_id}`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `deal_id` | `integer` | Yes | ID of the deal to delete |

- **Query Parameters**: None
- **Request Body**: None

### Responses

#### `200 OK`
```json
{
  "message": "Deal deleted successfully"
}
```

#### `404 Not Found`
```json
{
  "detail": "Deal/Inquiry not found"
}
```
