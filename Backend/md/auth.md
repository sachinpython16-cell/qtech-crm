# Authentication API Documentation

Base URL: `http://localhost:8000/api/v1/auth`

Interactive Swagger Docs: `http://localhost:8000/docs`

---

## Overview

The Authentication module provides secure user management and session handling using JWT (JSON Web Tokens).

### Key Features:
- **Password Security**: Passwords are encrypted using `bcrypt`.
- **Dual-Token System**:
  - `access_token`: Short-lived (30 minutes) token for accessing protected resources.
  - `refresh_token`: Longer-lived (7 days) token used exclusively to issue new access tokens.
- **Token Rotation**: Every refresh request rotates the refresh token (blacklisting the previous one) to prevent replay attacks.
- **Token Blacklisting / Revocation**: Instant revocation of tokens upon logout.

---

## 1. Register User

**Short Description**: Creates a new user account with hashed password and default active status.

- **Method**: `POST`
- **URL**: `/api/v1/auth/register`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

### Request Body
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "StrongPassword123!",
  "full_name": "John Doe"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string (email)` | Yes | Valid unique email address |
| `username` | `string` | Yes | Unique username (3 to 50 characters) |
| `password` | `string` | Yes | User password (min 6 characters) |
| `full_name` | `string` | No | User's full display name |

### Responses

#### `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2026-11-16T11:00:00Z"
}
```

#### `400 Bad Request` (Duplicate Username or Email)
```json
{
  "detail": "A user with this email already exists"
}
```

---

## 2. User Login

**Short Description**: Authenticates a user by email or username and issues JWT access and refresh tokens.

- **Method**: `POST`
- **URL**: `/api/v1/auth/login`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

### Request Body
```json
{
  "identifier": "user@example.com",
  "password": "StrongPassword123!"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `identifier` | `string` | Yes | User's registered **email** or **username** |
| `password` | `string` | Yes | Plain text password |

### Responses

#### `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### `401 Unauthorized` (Invalid Credentials)
```json
{
  "detail": "Incorrect username/email or password"
}
```

#### `403 Forbidden` (Inactive Account)
```json
{
  "detail": "Inactive user account"
}
```

---

## 3. Get Current User Profile (`/me`)

**Short Description**: Returns the authenticated user's profile information.

- **Method**: `GET`
- **URL**: `/api/v1/auth/me`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Request Body**: *None*

### Responses

#### `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2026-11-16T11:00:00Z"
}
```

#### `401 Unauthorized` (Token Expired, Missing, or Revoked)
```json
{
  "detail": "Token has been revoked"
}
```
*(or `"Invalid or expired token"`)*

---

## 4. Refresh Token

**Short Description**: Generates a new access token using a valid refresh token. Rotates and invalidates the previous refresh token.

- **Method**: `POST`
- **URL**: `/api/v1/auth/refresh`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

### Request Body
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `refresh_token` | `string` | Yes | The refresh token received during login |

### Responses

#### `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### `401 Unauthorized` (Invalid, Revoked, or Expired Refresh Token)
```json
{
  "detail": "Refresh token has been revoked"
}
```

---

## 5. Logout User

**Short Description**: Revokes the current access token and optional refresh token by adding their unique IDs (`jti`) to the database blacklist.

- **Method**: `POST`
- **URL**: `/api/v1/auth/logout`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

### Request Body *(Optional)*
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `refresh_token` | `string` | No | Optional refresh token to blacklist alongside the access token |

### Responses

#### `200 OK`
```json
{
  "message": "Successfully logged out"
}
```

#### `401 Unauthorized`
```json
{
  "detail": "Invalid or expired token"
}
```
