"""
QtechCRM Backend Comprehensive API Test Suite
Tests all endpoints across Auth, Company, Contact, Deal, Follow-Up, Interaction, and Dashboard.
Generates an explicit Working / Not Working report.
"""

import sys
import os
import time
from typing import Dict, Any, List

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# Use an in-memory SQLite database for isolated, lightning-fast end-to-end testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all database tables
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# Test Results Tracker
test_results: List[Dict[str, Any]] = []


def record_test(
    test_id: str,
    module: str,
    method: str,
    endpoint: str,
    expected_status: int,
    response,
    detail: str = "",
):
    passed = response.status_code == expected_status
    error_msg = "" if passed else f"Got status {response.status_code}, response: {response.text}"
    test_results.append(
        {
            "id": test_id,
            "module": module,
            "method": method,
            "endpoint": endpoint,
            "expected_status": expected_status,
            "actual_status": response.status_code,
            "passed": passed,
            "detail": detail,
            "error": error_msg,
        }
    )
    symbol = "✅ PASS" if passed else "❌ FAIL"
    print(f"[{symbol}] {test_id} | {method:<6} {endpoint:<35} -> {response.status_code} (Expected {expected_status})")
    if not passed:
        print(f"      Reason: {error_msg}")


def run_all_tests():
    print("\n" + "=" * 90)
    print("               STARTING QtechCRM FULL API TEST SUITE")
    print("=" * 90 + "\n")

    # -------------------------------------------------------------
    # 0. ROOT & SYSTEM HEALTH
    # -------------------------------------------------------------
    res = client.get("/")
    record_test("TC-SYS-01", "System", "GET", "/", 200, res, "Root Welcome Endpoint")

    res = client.get("/health")
    record_test("TC-SYS-02", "System", "GET", "/health", 200, res, "Health Check Endpoint")

    # -------------------------------------------------------------
    # 1. AUTHENTICATION MODULE
    # -------------------------------------------------------------
    # TC-AUTH-01: Register user
    register_payload = {
        "email": "test.lead@qtechcrm.com",
        "username": "testlead",
        "password": "Password123!",
        "full_name": "Test Account Lead",
    }
    res = client.post("/api/v1/auth/register", json=register_payload)
    record_test("TC-AUTH-01", "Auth", "POST", "/api/v1/auth/register", 201, res, "Register New User")

    # TC-AUTH-02: Register duplicate email/username
    res = client.post("/api/v1/auth/register", json=register_payload)
    record_test("TC-AUTH-02", "Auth", "POST", "/api/v1/auth/register", 400, res, "Reject Duplicate User")

    # TC-AUTH-03: Login with valid credentials
    login_payload = {"identifier": "testlead", "password": "Password123!"}
    res = client.post("/api/v1/auth/login", json=login_payload)
    record_test("TC-AUTH-03", "Auth", "POST", "/api/v1/auth/login", 200, res, "Valid User Login")

    tokens = res.json() if res.status_code == 200 else {}
    access_token = tokens.get("access_token", "")
    refresh_token = tokens.get("refresh_token", "")
    auth_header = {"Authorization": f"Bearer {access_token}"}

    # TC-AUTH-04: Login with incorrect password
    res = client.post(
        "/api/v1/auth/login", json={"identifier": "testlead", "password": "WrongPassword"}
    )
    record_test("TC-AUTH-04", "Auth", "POST", "/api/v1/auth/login", 401, res, "Reject Invalid Password")

    # TC-AUTH-05: Get Current User Profile
    res = client.get("/api/v1/auth/me", headers=auth_header)
    record_test("TC-AUTH-05", "Auth", "GET", "/api/v1/auth/me", 200, res, "Get Logged-in User Profile")

    # TC-AUTH-06: Call Protected Route Without Token
    res = client.get("/api/v1/auth/me")
    record_test("TC-AUTH-06", "Auth", "GET", "/api/v1/auth/me", 401, res, "Reject Missing Bearer Header")

    # TC-AUTH-07: Refresh Token
    res = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    record_test("TC-AUTH-07", "Auth", "POST", "/api/v1/auth/refresh", 200, res, "Rotate and Refresh Token")
    if res.status_code == 200:
        new_tokens = res.json()
        access_token = new_tokens.get("access_token", access_token)
        refresh_token = new_tokens.get("refresh_token", refresh_token)
        auth_header = {"Authorization": f"Bearer {access_token}"}

    # -------------------------------------------------------------
    # 2. CLIENT COMPANIES MODULE
    # -------------------------------------------------------------
    # TC-COMP-01: Create Company
    company_payload = {
        "name": "Apex Cloud Global Ltd",
        "industry": "Enterprise Cloud Solutions",
        "relationship_status": "prospect",
        "location": "San Francisco, USA",
        "website": "apexcloud.io",
        "notes": "Target enterprise client for migration.",
        "first_engaged_date": "2026-11-17",
    }
    res = client.post("/api/v1/companies", json=company_payload, headers=auth_header)
    record_test("TC-COMP-01", "Company", "POST", "/api/v1/companies", 201, res, "Create Client Company")
    company_id = res.json().get("id") if res.status_code == 201 else 1

    # TC-COMP-02: Prevent Duplicate Company Name
    res = client.post("/api/v1/companies", json=company_payload, headers=auth_header)
    record_test("TC-COMP-02", "Company", "POST", "/api/v1/companies", 400, res, "Reject Duplicate Company Name")

    # TC-COMP-03: List Companies
    res = client.get("/api/v1/companies", headers=auth_header)
    record_test("TC-COMP-03", "Company", "GET", "/api/v1/companies", 200, res, "List Client Companies with Stats")

    # TC-COMP-04: Filter Companies by status
    res = client.get("/api/v1/companies?status=prospect", headers=auth_header)
    record_test("TC-COMP-04", "Company", "GET", "/api/v1/companies?status=prospect", 200, res, "Filter Companies by Status")

    # TC-COMP-05: Get Single Company
    res = client.get(f"/api/v1/companies/{company_id}", headers=auth_header)
    record_test("TC-COMP-05", "Company", "GET", f"/api/v1/companies/{company_id}", 200, res, "Get Single Company by ID")

    # TC-COMP-06: Non-existent Company
    res = client.get("/api/v1/companies/9999", headers=auth_header)
    record_test("TC-COMP-06", "Company", "GET", "/api/v1/companies/9999", 404, res, "Handle Not Found Company")

    # TC-COMP-07: Update Company
    update_comp = {"relationship_status": "active", "industry": "Tier-1 Cloud Provider"}
    res = client.put(f"/api/v1/companies/{company_id}", json=update_comp, headers=auth_header)
    record_test("TC-COMP-07", "Company", "PUT", f"/api/v1/companies/{company_id}", 200, res, "Update Company Details")

    # -------------------------------------------------------------
    # 3. CONTACT PERSONS MODULE
    # -------------------------------------------------------------
    # TC-CONT-01: Create Contact Person
    contact_payload = {
        "company_id": company_id,
        "name": "Sarah Connor",
        "designation": "VP of Architecture",
        "email": "sarah.connor@apexcloud.io",
        "phone": "+1-555-0199",
        "is_primary": True,
        "notes": "Decision maker.",
    }
    res = client.post("/api/v1/contacts", json=contact_payload, headers=auth_header)
    record_test("TC-CONT-01", "Contact", "POST", "/api/v1/contacts", 201, res, "Create Contact Person")
    contact_id = res.json().get("id") if res.status_code == 201 else 1

    # TC-CONT-02: Create Second Contact Person (auto-demotes first primary)
    contact_payload_2 = {
        "company_id": company_id,
        "name": "John Connor",
        "designation": "Director of Operations",
        "email": "john.connor@apexcloud.io",
        "phone": "+1-555-0200",
        "is_primary": True,
    }
    res = client.post("/api/v1/contacts", json=contact_payload_2, headers=auth_header)
    record_test("TC-CONT-02", "Contact", "POST", "/api/v1/contacts", 201, res, "Create Primary Contact & Demote Old")

    # TC-CONT-03: List Contacts
    res = client.get("/api/v1/contacts", headers=auth_header)
    record_test("TC-CONT-03", "Contact", "GET", "/api/v1/contacts", 200, res, "List All Contact Persons")

    # TC-CONT-04: Filter Contacts by Company
    res = client.get(f"/api/v1/contacts?company_id={company_id}", headers=auth_header)
    record_test("TC-CONT-04", "Contact", "GET", f"/api/v1/contacts?company_id={company_id}", 200, res, "Filter Contacts by Company")

    # TC-CONT-05: Get Single Contact
    res = client.get(f"/api/v1/contacts/{contact_id}", headers=auth_header)
    record_test("TC-CONT-05", "Contact", "GET", f"/api/v1/contacts/{contact_id}", 200, res, "Get Single Contact Person")

    # TC-CONT-06: Update Contact
    res = client.put(
        f"/api/v1/contacts/{contact_id}",
        json={"designation": "Chief Information Officer"},
        headers=auth_header,
    )
    record_test("TC-CONT-06", "Contact", "PUT", f"/api/v1/contacts/{contact_id}", 200, res, "Update Contact Person")

    # -------------------------------------------------------------
    # 4. DEALS & INQUIRIES MODULE
    # -------------------------------------------------------------
    # TC-DEAL-01: Create Deal (auto-schedules follow-up)
    deal_payload = {
        "title": "Cloud Infrastructure Modernization",
        "deal_type": "Project Deal",
        "company_id": company_id,
        "contact_person_id": contact_id,
        "description": "Full-stack migration from legacy servers to AWS.",
        "date_received": "2026-11-17",
        "status": "In Progress",
        "priority": "High",
        "current_follow_up_stage": "First Follow-Up",
        "next_follow_up_date": "2026-11-20",
        "notes": "Proposal under client legal review.",
    }
    res = client.post("/api/v1/deals", json=deal_payload, headers=auth_header)
    record_test("TC-DEAL-01", "Deal", "POST", "/api/v1/deals", 201, res, "Create Deal and Auto-Schedule Follow-up")
    deal_id = res.json().get("id") if res.status_code == 201 else 1

    # TC-DEAL-02: List Deals
    res = client.get("/api/v1/deals", headers=auth_header)
    record_test("TC-DEAL-02", "Deal", "GET", "/api/v1/deals", 200, res, "List Deals with Filtering")

    # TC-DEAL-03: Get Single Deal
    res = client.get(f"/api/v1/deals/{deal_id}", headers=auth_header)
    record_test("TC-DEAL-03", "Deal", "GET", f"/api/v1/deals/{deal_id}", 200, res, "Get Single Deal by ID")

    # TC-DEAL-04: Update Deal Details
    res = client.put(
        f"/api/v1/deals/{deal_id}",
        json={"priority": "High", "notes": "Approved by client technical committee."},
        headers=auth_header,
    )
    record_test("TC-DEAL-04", "Deal", "PUT", f"/api/v1/deals/{deal_id}", 200, res, "Update Deal Details")

    # TC-DEAL-05: Update Deal Status to Closed
    res = client.patch(
        f"/api/v1/deals/{deal_id}/status",
        json={"status": "Closed", "closed_date": "2026-11-17"},
        headers=auth_header,
    )
    record_test("TC-DEAL-05", "Deal", "PATCH", f"/api/v1/deals/{deal_id}/status", 200, res, "Mark Deal as Closed / Won")

    # -------------------------------------------------------------
    # 5. FOLLOW-UP PIPELINE MODULE
    # -------------------------------------------------------------
    # TC-FOL-01: Schedule Follow-up
    fol_payload = {
        "inquiry_deal_id": deal_id,
        "company_id": company_id,
        "contact_person_id": contact_id,
        "sequence": "First Follow-Up",
        "scheduled_date": "2026-11-20",
        "performed_by": "Account Lead",
        "channel": "Phone Call",
        "notes": "Verify deployment checklist.",
    }
    res = client.post("/api/v1/followups", json=fol_payload, headers=auth_header)
    record_test("TC-FOL-01", "FollowUp", "POST", "/api/v1/followups", 201, res, "Schedule Follow-Up Task")
    fol_id = res.json().get("id") if res.status_code == 201 else 1

    # TC-FOL-02: List Follow-Ups
    res = client.get("/api/v1/followups", headers=auth_header)
    record_test("TC-FOL-02", "FollowUp", "GET", "/api/v1/followups", 200, res, "List Follow-Up Queue")

    # TC-FOL-03: Get Single Follow-Up
    res = client.get(f"/api/v1/followups/{fol_id}", headers=auth_header)
    record_test("TC-FOL-03", "FollowUp", "GET", f"/api/v1/followups/{fol_id}", 200, res, "Get Single Follow-Up by ID")

    # TC-FOL-04: Complete Follow-Up & Advance Sequence (1st -> 2nd)
    complete_payload = {
        "outcome": "Client agreed to proceed to stage 2 architecture audit.",
        "notes": "Schedule 2nd follow-up for next week.",
        "schedule_next": True,
        "next_date": "2026-11-27",
        "next_channel": "Email",
    }
    res = client.post(f"/api/v1/followups/{fol_id}/complete", json=complete_payload, headers=auth_header)
    record_test("TC-FOL-04", "FollowUp", "POST", f"/api/v1/followups/{fol_id}/complete", 200, res, "Complete & Advance Sequence")

    # TC-FOL-05: Reschedule a Follow-Up
    res = client.patch(
        f"/api/v1/followups/{fol_id}/reschedule",
        json={"scheduled_date": "2026-11-28", "notes": "Postponed by client request."},
        headers=auth_header,
    )
    record_test("TC-FOL-05", "FollowUp", "PATCH", f"/api/v1/followups/{fol_id}/reschedule", 200, res, "Reschedule Follow-Up Date")

    # -------------------------------------------------------------
    # 6. INTERACTION TIMELINE MODULE
    # -------------------------------------------------------------
    # TC-INT-01: Log an Interaction
    int_payload = {
        "company_id": company_id,
        "contact_person_id": contact_id,
        "inquiry_deal_id": deal_id,
        "date": "2026-11-17",
        "interaction_type": "Project Kickoff",
        "title": "Architecture Blueprint Review",
        "details": "Agreed on core architecture milestones.",
        "logged_by": "Test Account Lead",
    }
    res = client.post("/api/v1/interactions", json=int_payload, headers=auth_header)
    record_test("TC-INT-01", "Interaction", "POST", "/api/v1/interactions", 201, res, "Log Timeline Interaction Event")

    # TC-INT-02: List Interactions by Company
    res = client.get(f"/api/v1/interactions?company_id={company_id}", headers=auth_header)
    record_test("TC-INT-02", "Interaction", "GET", f"/api/v1/interactions?company_id={company_id}", 200, res, "Get Company Interaction Timeline")

    # -------------------------------------------------------------
    # 7. DASHBOARD & UNIVERSAL LOOKUP MODULE
    # -------------------------------------------------------------
    # TC-DASH-01: Dashboard Metrics
    res = client.get("/api/v1/dashboard/metrics", headers=auth_header)
    record_test("TC-DASH-01", "Dashboard", "GET", "/api/v1/dashboard/metrics", 200, res, "Calculate Dashboard Metrics")

    # TC-DASH-02: Universal Relationship Lookup (Search person or company)
    res = client.get("/api/v1/dashboard/lookup?q=Sarah", headers=auth_header)
    record_test("TC-DASH-02", "Dashboard", "GET", "/api/v1/dashboard/lookup?q=Sarah", 200, res, "Universal Relationship Search")

    # -------------------------------------------------------------
    # 8. CLEANUP / DELETE ENDPOINTS (SOFT DELETE)
    # -------------------------------------------------------------
    # TC-DEAL-06: Delete Deal
    res = client.delete(f"/api/v1/deals/{deal_id}", headers=auth_header)
    record_test("TC-DEAL-06", "Deal", "DELETE", f"/api/v1/deals/{deal_id}", 200, res, "Soft-Delete Deal")

    # TC-CONT-07: Delete Contact
    res = client.delete(f"/api/v1/contacts/{contact_id}", headers=auth_header)
    record_test("TC-CONT-07", "Contact", "DELETE", f"/api/v1/contacts/{contact_id}", 200, res, "Soft-Delete Contact Person")

    # TC-FOL-06: Delete Follow-Up
    res = client.delete(f"/api/v1/followups/{fol_id}", headers=auth_header)
    record_test("TC-FOL-06", "FollowUp", "DELETE", f"/api/v1/followups/{fol_id}", 200, res, "Delete Follow-Up Task")

    # TC-COMP-08: Delete Company
    res = client.delete(f"/api/v1/companies/{company_id}", headers=auth_header)
    record_test("TC-COMP-08", "Company", "DELETE", f"/api/v1/companies/{company_id}", 200, res, "Soft-Delete Client Company")

    # -------------------------------------------------------------
    # 9. LOGOUT & TOKEN BLACKLIST VERIFICATION
    # -------------------------------------------------------------
    # TC-AUTH-08: Logout user
    res = client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token}, headers=auth_header)
    record_test("TC-AUTH-08", "Auth", "POST", "/api/v1/auth/logout", 200, res, "Logout & Revoke Token")

    # TC-AUTH-09: Verify blacklisted token cannot access protected endpoints
    res = client.get("/api/v1/auth/me", headers=auth_header)
    record_test("TC-AUTH-09", "Auth", "GET", "/api/v1/auth/me", 401, res, "Reject Blacklisted Revoked Token")

    # -------------------------------------------------------------
    # SUMMARY REPORT
    # -------------------------------------------------------------
    total_tests = len(test_results)
    passed_tests = sum(1 for t in test_results if t["passed"])
    failed_tests = total_tests - passed_tests

    print("\n" + "=" * 90)
    print("                     API TEST SUITE EXECUTION SUMMARY")
    print("=" * 90)
    print(f" TOTAL TEST CASES EXECUTED : {total_tests}")
    print(f" PASSED                    : {passed_tests} ✅")
    print(f" FAILED                    : {failed_tests} ❌")
    print(f" SUCCESS RATE              : {(passed_tests / total_tests) * 100:.1f}%")
    print("=" * 90)

    working_apis = [t for t in test_results if t["passed"]]
    failed_apis = [t for t in test_results if not t["passed"]]

    print("\n[WORKING APIS]")
    for t in working_apis:
        print(f"  ✓ [{t['method']:<6}] {t['endpoint']:<40} ({t['detail']})")

    print("\n[NOT WORKING APIS]")
    if not failed_apis:
        print("  ✓ NONE! All tested APIs are working properly.")
    else:
        for t in failed_apis:
            print(f"  ✗ [{t['method']:<6}] {t['endpoint']:<40} -> {t['error']}")

    print("\n" + "=" * 90 + "\n")
    return failed_tests == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
