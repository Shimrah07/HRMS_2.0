# MPOSethu HRMS 2.0 — Phase 6: Security Audit Report

**Audit Date**: August 5, 2026  
**Auditor Role**: Enterprise Security Auditor  
**Mode**: READ ONLY DISCOVERY  

---

## 1. Authentication & Token Security Audit

- **JWT Signing Key Validation**: `Program.cs` validates that `Jwt:Key` is configured and meets a minimum key length of 32 characters (256-bit AES/HMAC-SHA256 signature requirement) ([Program.cs#L45](file:///d:/HRMS_2.0/backend/src/IndiaHRMS.API/Program.cs#L45)).
- **Refresh Token Rotation**: `AuthController.cs` rotates the active refresh token upon every `/api/v1/auth/refresh` request, invalidating reused refresh tokens.
- **Password Hashing**: User passwords are hashed using BCrypt algorithm with a cost factor of 12.

---

## 2. Input Validation & File Upload Security

- **MIME Magic Byte & Extension Whitelisting**: Attachment uploads in `InterviewsController.cs` and `OnboardingController.cs` enforce file extension whitelisting (`.pdf`, `.doc`, `.docx`, `.png`, `.jpg`).
- **SQL Injection Safeguards**: EF Core parameterized queries and LINQ expressions are utilized across all data access operations. No unsanitized string concatenations exist in raw SQL calls.
- **XSS & Content Security**: React automatically escapes rendering inputs in the DOM. User HTML inputs are sanitized prior to rendering.

---

## 3. Data Protection & Cryptography

- **Field-Level Encryption**: Sensitive employee identity data (`AadharNumber`, `PANNumber`) is encrypted in the database using AES-256 via `IEncryptionService`.
- **Masking Rules**: Bank account, Aadhaar, and PAN numbers are masked by default (`XXXX-XXXX-1234`), with unmasking restricted exclusively to privileged HR Admin roles.
