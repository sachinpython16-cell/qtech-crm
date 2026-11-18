# Client Companies API Documentation

Base URL: `http://localhost:8000/api/v1/companies`

Interactive Swagger Docs: `http://localhost:8000/docs`

All endpoints require the Bearer authentication header:
```http
Authorization: Bearer <access_token>
```

---

## Overview
Manages your client companies with categorization (`prospect`, `active`, `previous`), location, website, notes, and automatically calculated real-time work history statistics (`has_worked_before`, total projects, closed, ongoing, lost projects, and active contacts count).

---

## 1. Create Client Company

**Short Description**: Registers a new client company with initial relationship status. Validates and prevents duplicate company names for the same user.

- **Method**: `POST`
- **URL**: `/api/v1/companies`
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
  "name": "Acme Innovations Ltd",
  "industry": "Enterprise Software",
  "relationship_status": "prospect",
  "location": "New York, USA",
  "website": "acmeinnovations.com",
  "notes": "Met at SaaS Expo 2026. Interested in technical audit.",
  "first_engaged_date": "2026-11-17"
}
```

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | - | Company name (unique per user account) |
| `industry` | `string` | No | `"General Enterprise"` | Industry vertical |
| `relationship_status` | `string` | No | `"prospect"` | `"prospect"` (new lead), `"active"` (current client), `"previous"` (old client) |
| `location` | `string` | No | `"Global / Remote"` | Geographic headquarters or location |
| `website` | `string` | No | `null` | Company website URL |
| `notes` | `string` | No | `null` | Contextual relationship notes |
| `first_engaged_date` | `string (date)` | No | Today's date | Date first relationship engagement started |

### Responses

#### `201 Created`
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Acme Innovations Ltd",
  "industry": "Enterprise Software",
  "relationship_status": "prospect",
  "location": "New York, USA",
  "website": "acmeinnovations.com",
  "notes": "Met at SaaS Expo 2026. Interested in technical audit.",
  "first_engaged_date": "2026-11-17",
  "last_interaction_date": "2026-11-17",
  "created_at": "2026-11-17T13:45:00Z",
  "updated_at": null,
  "stats": {
    "total_projects": 0,
    "closed_projects": 0,
    "ongoing_projects": 0,
    "lost_projects": 0,
    "inquiry_count": 0,
    "contacts_count": 0,
    "pending_follow_ups": 0,
    "has_worked_before": false
  }
}
```

#### `400 Bad Request` (Duplicate Company Name)
```json
{
  "detail": "A company named 'Acme Innovations Ltd' already exists in your client list."
}
```

---

## 2. List Client Companies

**Short Description**: Retrieves a paginated list of client companies with filtering by status and text search. Includes real-time relationship stats for each company.

- **Method**: `GET`
- **URL**: `/api/v1/companies`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Path Parameters**: None

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `string` | No | `null` | Filter by `"active"`, `"previous"`, `"prospect"`, or `"all"` |
| `search` | `string` | No | `null` | Search across company name, industry, location, or notes |
| `skip` | `integer` | No | `0` | Pagination offset |
| `limit` | `integer` | No | `100` | Pagination limit (max 500) |

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
      "name": "Acme Innovations Ltd",
      "industry": "Enterprise Software",
      "relationship_status": "active",
      "location": "New York, USA",
      "website": "acmeinnovations.com",
      "notes": "Enterprise partner",
      "first_engaged_date": "2026-01-10",
      "last_interaction_date": "2026-11-12",
      "created_at": "2026-01-10T09:00:00Z",
      "updated_at": "2026-11-12T10:30:00Z",
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
  ]
}
```

---

## 3. Get Single Company by ID

**Short Description**: Fetches a single company profile with complete relationship statistics.

- **Method**: `GET`
- **URL**: `/api/v1/companies/{company_id}`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `company_id` | `integer` | Yes | ID of the company to retrieve |

- **Query Parameters**: None
- **Request Body**: None

### Responses

#### `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Acme Innovations Ltd",
  "industry": "Enterprise Software",
  "relationship_status": "active",
  "location": "New York, USA",
  "website": "acmeinnovations.com",
  "notes": "Enterprise partner",
  "first_engaged_date": "2026-01-10",
  "last_interaction_date": "2026-11-12",
  "created_at": "2026-01-10T09:00:00Z",
  "updated_at": null,
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
```

#### `404 Not Found`
```json
{
  "detail": "Company not found"
}
```

---

## 4. Update Company Details

**Short Description**: Updates company metadata and relationship status.

- **Method**: `PUT`
- **URL**: `/api/v1/companies/{company_id}`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `company_id` | `integer` | Yes | ID of the company to update |

- **Query Parameters**: None

### Request Body *(All fields optional)*
```json
{
  "name": "Acme Innovations Global Ltd",
  "industry": "FinTech & Cloud Solutions",
  "relationship_status": "active",
  "location": "San Francisco, CA",
  "website": "acme.io",
  "notes": "Upgraded partnership tier.",
  "first_engaged_date": "2026-01-10",
  "last_interaction_date": "2026-11-17"
}
```

### Responses

#### `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Acme Innovations Global Ltd",
  "industry": "FinTech & Cloud Solutions",
  "relationship_status": "active",
  "location": "San Francisco, CA",
  "website": "acme.io",
  "notes": "Upgraded partnership tier.",
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
```

#### `400 Bad Request` (Duplicate Name on Rename)
```json
{
  "detail": "A company named 'Acme Innovations Global Ltd' already exists."
}
```

#### `404 Not Found`
```json
{
  "detail": "Company not found"
}
```

---

## 5. Delete Company (Soft Delete)

**Short Description**: Performs a safe soft-delete of the company record.

- **Method**: `DELETE`
- **URL**: `/api/v1/companies/{company_id}`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `company_id` | `integer` | Yes | ID of the company to soft-delete |

- **Query Parameters**: None
- **Request Body**: None

### Responses

#### `200 OK`
```json
{
  "message": "Company deleted successfully"
}
```

#### `404 Not Found`
```json
{
  "detail": "Company not found"
}
```
