# Contact Persons API Documentation

Base URL: `http://localhost:8000/api/v1/contacts`

Interactive Swagger Docs: `http://localhost:8000/docs`

All endpoints require the Bearer authentication header:
```http
Authorization: Bearer <access_token>
```

---

## Overview
Manages key contact persons working at client companies (`name`, `designation`, `email`, `phone`, `is_primary`, `notes`, `last_contacted_date`). Automatically ensures that each company maintains one designated primary contact.

---

## 1. Add Contact Person

**Short Description**: Registers a new person attached to an existing client company. If `is_primary` is `true`, previously assigned primary contacts for that company are automatically demoted.

- **Method**: `POST`
- **URL**: `/api/v1/contacts`
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
  "name": "Sarah Connor",
  "designation": "VP of Engineering",
  "email": "sarah.connor@acme.com",
  "phone": "+1-555-0199",
  "is_primary": true,
  "notes": "Main decision maker for cloud migration proposal.",
  "last_contacted_date": "2026-11-17"
}
```

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `company_id` | `integer` | Yes | - | ID of the client company |
| `name` | `string` | Yes | - | Full name of contact person |
| `designation` | `string` | No | `"Contact Person"` | Job title or role |
| `email` | `string (email)`| No | `null` | Work email address |
| `phone` | `string` | No | `null` | Direct phone or mobile number |
| `is_primary` | `boolean` | No | `false` | Whether this is the primary point of contact |
| `notes` | `string` | No | `null` | Additional contact notes |
| `last_contacted_date` | `string (date)`| No | Today's date | Date last contacted |

### Responses

#### `201 Created`
```json
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
  "notes": "Main decision maker for cloud migration proposal.",
  "last_contacted_date": "2026-11-17",
  "created_at": "2026-11-17T13:46:00Z",
  "updated_at": null
}
```

#### `404 Not Found` (Company does not exist)
```json
{
  "detail": "Company not found"
}
```

---

## 2. List Contact Persons

**Short Description**: Retrieves contacts, optionally filtered by `company_id` or searched by name, designation, email, phone, or company name. Primary contacts appear first.

- **Method**: `GET`
- **URL**: `/api/v1/contacts`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Path Parameters**: None

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `company_id` | `integer` | No | `null` | Filter contacts belonging to a specific company |
| `search` | `string` | No | `null` | Search by name, designation, email, phone, or company name |
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
  ]
}
```

---

## 3. Get Single Contact by ID

**Short Description**: Fetches a single contact person's full information and associated company name.

- **Method**: `GET`
- **URL**: `/api/v1/contacts/{contact_id}`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `contact_id` | `integer` | Yes | ID of the contact person |

- **Query Parameters**: None
- **Request Body**: None

### Responses

#### `200 OK`
```json
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
```

#### `404 Not Found`
```json
{
  "detail": "Contact person not found"
}
```

---

## 4. Update Contact Person

**Short Description**: Updates contact details or transfers person to another company. Setting `is_primary: true` automatically unsets other primary contacts for that company.

- **Method**: `PUT`
- **URL**: `/api/v1/contacts/{contact_id}`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `contact_id` | `integer` | Yes | ID of the contact person to update |

- **Query Parameters**: None

### Request Body *(All fields optional)*
```json
{
  "name": "Sarah Connor",
  "designation": "Chief Technology Officer",
  "email": "sarah.connor@acme.com",
  "phone": "+1-555-0200",
  "is_primary": true,
  "notes": "Promoted to CTO.",
  "last_contacted_date": "2026-11-17"
}
```

### Responses

#### `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "company_id": 1,
  "company_name": "Acme Innovations Ltd",
  "name": "Sarah Connor",
  "designation": "Chief Technology Officer",
  "email": "sarah.connor@acme.com",
  "phone": "+1-555-0200",
  "is_primary": true,
  "notes": "Promoted to CTO.",
  "last_contacted_date": "2026-11-17",
  "created_at": "2026-11-17T13:46:00Z",
  "updated_at": "2026-11-17T13:52:00Z"
}
```

#### `404 Not Found`
```json
{
  "detail": "Contact person not found"
}
```

---

## 5. Delete Contact Person (Soft Delete)

**Short Description**: Performs a soft-delete of the contact person record.

- **Method**: `DELETE`
- **URL**: `/api/v1/contacts/{contact_id}`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `contact_id` | `integer` | Yes | ID of the contact person to soft-delete |

- **Query Parameters**: None
- **Request Body**: None

### Responses

#### `200 OK`
```json
{
  "message": "Contact deleted successfully"
}
```

#### `404 Not Found`
```json
{
  "detail": "Contact person not found"
}
```
