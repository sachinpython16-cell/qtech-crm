# QtechCRM API Documentation Index

Base URL: `http://localhost:8000/api/v1`

Interactive Swagger Docs: `http://localhost:8000/docs`

---

## Modular Documentation Directory

The API documentation is divided into module-specific guides:

| Module | Documentation File | Description |
| :--- | :--- | :--- |
| **Authentication** | [auth.md](file:///c:/Qrious%20Tech/QtechCRM/Backend/md/auth.md) | User registration, login, JWT token refresh, logout & token blacklisting |
| **Client Companies** | [company.md](file:///c:/Qrious%20Tech/QtechCRM/Backend/md/company.md) | Company records, relationship status (`prospect`, `active`, `previous`), and work history stats |
| **Contact Persons** | [contact.md](file:///c:/Qrious%20Tech/QtechCRM/Backend/md/contact.md) | People at client companies, designations, emails, phones, and primary contact management |
| **Deals & Inquiries** | [deal.md](file:///c:/Qrious%20Tech/QtechCRM/Backend/md/deal.md) | Inquiries, project deals, pipeline stages, priorities, and closed/lost tracking |
| **Follow-Up Pipeline** | [followup.md](file:///c:/Qrious%20Tech/QtechCRM/Backend/md/followup.md) | 1st, 2nd, 3rd sequence progression, overdue queue, outcome recording & auto-scheduling |
| **Interaction Timeline** | [interaction.md](file:///c:/Qrious%20Tech/QtechCRM/Backend/md/interaction.md) | Historical activity logs (meetings, calls, kickoffs, reviews) across companies & deals |
| **Dashboard & Lookup** | [dashboard.md](file:///c:/Qrious%20Tech/QtechCRM/Backend/md/dashboard.md) | Live KPI metrics and fast cross-table relationship lookup |

---

## Global Authentication Header

All modules (except `/auth/register`, `/auth/login`, and `/auth/refresh`) require a valid Bearer token header:

```http
Authorization: Bearer <access_token>
```
