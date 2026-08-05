# MPOEmployeeHub — Architecture & SSO Integration Guide

> **Audience:** Development teams building the 14 downstream module applications.  
> **Purpose:** Understand how the Hub works and exactly what you need to code to integrate SSO.

---

## 1. Project Overview

MPOEmployeeHub ek **centralized Identity Provider (IdP) + Employee Management System** hai.  
Ye platform ke liye "entry gate" ka kaam karta hai — employee ek baar Hub pe login karta hai aur phir saare modules mein automatically logged in rehta hai (SSO).

### Tech Stack

| Layer | Technology | Port (Local Dev) |
|-------|-----------|-----------------|
| **Frontend UI** | React 19 + TypeScript + Vite | `3001` |
| **BFF (Backend-for-Frontend)** | Next.js 15 (App Router) | `3000` |
| **API Gateway** | YARP Reverse Proxy (.NET 10) | `7000` |
| **Identity Provider + Core API** | .NET 10 ASP.NET Core + OpenIddict | `7001` |
| **Database** | MS SQL Server 2014 (Windows Auth) | `Laptop-250` |

---

## 2. Full System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EMPLOYEE BROWSER                                  │
│                                                                          │
│  React Portal (Vite, port 3001)                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Login Page → Dashboard → Profile → Module Tiles → Admin Pages    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                    │ All /api/* calls (Vite proxy)                       │
└────────────────────┼────────────────────────────────────────────────────┘
                     │
                     ▼ HTTP (same-origin via proxy)
┌─────────────────────────────────────────────────────────────────────────┐
│  Next.js BFF  (port 3000)                                                │
│                                                                          │
│  • NextAuth.js (Credentials Provider)                                    │
│  • Session management: HttpOnly encrypted cookie                         │
│  • /api/auth/* → NextAuth handlers (CSRF, session, etc.)                 │
│  • /api/proxy/* → forwards requests to YARP Gateway with Bearer token    │
└────────────────────────────────────────────────────────────────────────┘
                     │ Bearer JWT in Authorization header
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  YARP API Gateway  (port 7000)                                           │
│                                                                          │
│  • Validates RS256 JWT from Hub                                          │
│  • Rate limiting: 100 req/min (global), 10 req/min (strict routes)       │
│  • Routes: /connect/*, /api/employees/*, /api/modules/*, /api/admin/*    │
│  • Adds X-Employee-Id, X-Correlation-Id headers to upstream              │
└────────────────────────────────────────────────────────────────────────┘
                     │ Internal HTTP
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  MPOEmployeeHub .NET API  (port 7001)                                    │
│                                                                          │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │  OpenIddict     │  │  Employee API    │  │  Admin API             │  │
│  │  (IdP)          │  │  CRUD + CSV      │  │  Dashboard, AuditLog   │  │
│  │  /connect/token │  │  /api/employees  │  │  MFA toggle            │  │
│  │  /connect/auth  │  └──────────────────┘  └────────────────────────┘  │
│  └─────────────────┘                                                     │
│         │                                                                │
│    ADO.NET (SqlConnection + Stored Procedures)                           │
└────────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  MS SQL Server 2014  (Server=Laptop-250, Windows Auth)                   │
│                                                                          │
│  Tables: AspNetUsers, Employees, Modules, UserModuleAccess,              │
│          MFASettings, MFASecrets, AuthAuditLog, EntityAuditLog          │
│  + OpenIddict tables: OpenIddictApplications, OpenIddictTokens, etc.    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Login Flow (Step-by-Step)

```
Employee                Portal (3001)          BFF (3000)             API (7001)
   │                        │                      │                      │
   │── enters email/pwd ───>│                      │                      │
   │                        │── GET /api/auth/csrf─>│                      │
   │                        │<── csrfToken ─────────│                      │
   │                        │                      │                      │
   │                        │── POST /api/auth/callback/hub ─────────────>│
   │                        │   (form-urlencoded)  │                      │
   │                        │                      │──POST /connect/token─>│
   │                        │                      │  grant_type=password  │
   │                        │                      │  client_id=bff-client │
   │                        │                      │  username=email       │
   │                        │                      │  password=***         │
   │                        │                      │<── access_token ──────│
   │                        │                      │    refresh_token       │
   │                        │                      │                      │
   │                        │<── HttpOnly session cookie (encrypted JWT)───│
   │<── redirect /dashboard─│                      │                      │
   │                        │                      │                      │
   │── API call (/dashboard)─>│                    │                      │
   │                        │── GET /api/proxy/employees/me               │
   │                        │   Authorization: Bearer <access_token>       │
   │                        │──────────────────────>│                      │
   │                        │                      │── validates JWT ─────>│
   │                        │                      │<── employee data ─────│
   │<── employee profile ───│                      │                      │
```

---

## 4. JWT Token Structure

Hub se jo JWT milta hai usmein ye claims hote hain:

```json
{
  "sub": "asp-net-identity-user-id",
  "name": "Admin User",
  "email": "admin@mpo.com",
  "role": ["Admin"],
  "iss": "http://localhost:7001",
  "exp": 1720000000,
  "iat": 1719999400
}
```

> **Note:** `sub` claim ASP.NET Identity ka User ID hai. Employee `EmpId` (e.g. `EMP1023`) alag hai — wo API se `/api/employees/me` call karke milta hai.

---

## 5. Key Files Reference

### API (Identity Provider)
| File | Kaam |
|------|------|
| [Program.cs](file:///d:/COE/Code Solution/MPOEmployeeHub/src/MPOEmployeeHub.Api/Program.cs) | OpenIddict setup, DI registration |
| [AuthorizationController.cs](file:///d:/COE/Code Solution/MPOEmployeeHub/src/MPOEmployeeHub.Api/Controllers/AuthorizationController.cs) | `/connect/token` endpoint handler |
| [DataSeeder.cs](file:///d:/COE/Code Solution/MPOEmployeeHub/src/MPOEmployeeHub.Api/DataSeeder.cs) | Admin user + client app registration |
| [appsettings.Development.json](file:///d:/COE/Code Solution/MPOEmployeeHub/src/MPOEmployeeHub.Api/appsettings.Development.json) | DB connection string |

### Gateway
| File | Kaam |
|------|------|
| [yarp.json](file:///d:/COE/Code Solution/MPOEmployeeHub/src/MPOEmployeeHub.Gateway/yarp.json) | Route definitions + cluster config |
| [Program.cs](file:///d:/COE/Code Solution/MPOEmployeeHub/src/MPOEmployeeHub.Gateway/Program.cs) | JWT validation, rate limiting |

### BFF
| File | Kaam |
|------|------|
| [src/auth.ts](file:///d:/COE/Code Solution/MPOEmployeeHub/frontend/bff/src/auth.ts) | NextAuth config, token refresh |
| [.env.local](file:///d:/COE/Code Solution/MPOEmployeeHub/frontend/bff/.env.local) | Hub credentials, gateway URL |

### Portal
| File | Kaam |
|------|------|
| [src/pages/auth/LoginPage.tsx](file:///d:/COE/Code Solution/MPOEmployeeHub/frontend/portal/src/pages/auth/LoginPage.tsx) | Login UI + NextAuth submission |
| [src/lib/api.ts](file:///d:/COE/Code Solution/MPOEmployeeHub/frontend/portal/src/lib/api.ts) | Axios instance with credentials |

---

## 6. SSO Integration Guide — Dusri Teams Ke Liye

> Yeh section **module application teams** ke liye hai jo Hub se SSO integrate karna chahti hain.

### 6.1 SSO Architecture (Module App Perspective)

```
Employee clicks "Open PMS" tile on Hub Dashboard
        │
        ▼
Hub Dashboard sends employee to:
  http://your-module-app.com/auth/hub-callback?token=<short-lived-token>
        │
        ▼ (Future: Authorization Code Flow with PKCE)
Module App verifies token with Hub's /connect/introspect
        │
        ▼
Module App creates its own session — employee is logged in
```

> **Important:** Abhi Phase 1 mein module apps ke liye Hub sirf **JWT token provide karta hai**. Har module app ko ye JWT validate karni hogi. Full browser-level SSO redirect (OAuth Authorization Code Flow) Phase 2 mein implement hoga jab modules actually ban jayein.

### 6.2 Aapko Hub Admin Se Kya Chahiye

Pehle, **Hub ke admin se request karo:**

1. **Client ID** — aapki app ka unique identifier (e.g., `pms-client`)
2. **Client Secret** — aapki app ka secret key
3. **Module access** — employees ko aapka module assign karein
4. **Redirect URI** — aapki app ki callback URL Hub mein register karein

**Hub Admin Console:** `http://localhost:3001/admin/modules`

### 6.3 Authorization Code Flow (Recommended — OAuth 2.1 Standard)

Yeh flow future-ready hai aur Hub ne isse support kar rakha hai.

#### Step 1 — Redirect employee to Hub

Jab user aapki app pe aata hai aur logged in nahi hai, use Hub pe bhejo:

```
GET http://localhost:7001/connect/authorize
  ?response_type=code
  &client_id=pms-client
  &redirect_uri=http://your-app.com/auth/callback
  &scope=openid profile email
  &state=random-string-for-csrf-protection
  &code_challenge=<pkce-challenge>
  &code_challenge_method=S256
```

**Parameters:**
| Parameter | Value |
|-----------|-------|
| `response_type` | `code` |
| `client_id` | Hub ne aapko diya hua ID |
| `redirect_uri` | Aapki app ki callback URL (Hub mein registered honi chahiye) |
| `scope` | `openid profile email` |
| `state` | Random string (CSRF prevention) |
| `code_challenge` | PKCE code challenge (SHA256 hash of code_verifier) |
| `code_challenge_method` | `S256` |

#### Step 2 — Receive the Authorization Code

Hub employee ko authenticate karta hai aur redirect karta hai:
```
GET http://your-app.com/auth/callback?code=AUTHORIZATION_CODE&state=random-string
```

#### Step 3 — Exchange Code for Token

Aapka backend server Hub se token exchange kare:

```http
POST http://localhost:7001/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=pms-client
&client_secret=your-client-secret
&code=AUTHORIZATION_CODE
&redirect_uri=http://your-app.com/auth/callback
&code_verifier=<original-pkce-verifier>
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsIn...",
  "refresh_token": "xyzXYZ...",
  "token_type": "Bearer",
  "expires_in": 600
}
```

#### Step 4 — Validate Token (Introspect)

Har API request se pehle token validate karo:

```http
POST http://localhost:7001/connect/introspect
Content-Type: application/x-www-form-urlencoded
Authorization: Basic base64(pms-client:your-client-secret)

token=eyJhbGciOiJSUzI1NiIsIn...
```

**Response (valid token):**
```json
{
  "active": true,
  "sub": "user-id",
  "email": "employee@mpo.com",
  "name": "John Doe",
  "role": ["Employee"],
  "exp": 1720000000
}
```

#### Step 5 — Refresh Token

Access token expire hone se pehle (10 min lifetime):

```http
POST http://localhost:7001/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&client_id=pms-client
&client_secret=your-client-secret
&refresh_token=xyzXYZ...
```

---

### 6.4 JWT Local Validation (Alternative — Faster)

Introspect call ki jagah local JWT validation bhi kar sakte ho — yeh faster hai:

#### .NET Module App:

```csharp
// Program.cs mein:
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Hub ka discovery document se keys auto-fetch honge
        options.Authority = "http://localhost:7001";  // Hub API URL
        options.RequireHttpsMetadata = false;          // dev only
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer    = "http://localhost:7001",
            ValidateAudience = false,    // Hub audience set nahi karta abhi
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
```

#### Node.js Module App:

```javascript
const { createRemoteJWKSet, jwtVerify } = require('jose');

const JWKS = createRemoteJWKSet(
  new URL('http://localhost:7001/.well-known/jwks')
);

async function validateToken(token) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: 'http://localhost:7001',
  });
  return payload;
  // payload.sub    → user ID
  // payload.email  → user email
  // payload.name   → user name
  // payload.role   → roles array
}
```

#### OIDC Discovery Endpoint:

Hub ka discovery document is URL pe available hai:
```
GET http://localhost:7001/.well-known/openid-configuration
```

---

### 6.5 Module App Ko Hub Mein Register Karna

Hub admin se request karo ki aapki app `OpenIddictApplications` table mein add ho. Ya Hub ke code mein `DataSeeder.cs` update karo:

```csharp
// DataSeeder.cs mein add karo:
await appManager.CreateAsync(new OpenIddictApplicationDescriptor
{
    ClientId     = "pms-client",
    ClientSecret = "your-strong-secret-here",
    ClientType   = OpenIddictConstants.ClientTypes.Confidential,
    ConsentType  = OpenIddictConstants.ConsentTypes.Implicit,
    DisplayName  = "PMS — Project Workbench",
    
    Permissions = {
        OpenIddictConstants.Permissions.Endpoints.Authorization,
        OpenIddictConstants.Permissions.Endpoints.Token,
        OpenIddictConstants.Permissions.Endpoints.Introspection,
        OpenIddictConstants.Permissions.Endpoints.EndSession,
        OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode,
        OpenIddictConstants.Permissions.GrantTypes.RefreshToken,
        OpenIddictConstants.Permissions.ResponseTypes.Code,
        OpenIddictConstants.Permissions.Scopes.Email,
        OpenIddictConstants.Permissions.Scopes.Profile,
    },
    
    RedirectUris = {
        new Uri("http://localhost:4000/auth/callback"),   // dev
        new Uri("https://pms.mpo.internal/auth/callback") // prod
    },
    PostLogoutRedirectUris = {
        new Uri("http://localhost:4000/"),
        new Uri("https://pms.mpo.internal/")
    }
});
```

---

### 6.6 Employee Module Access Check

Employee ko aapka module access hai ya nahi, ye Hub se check karo:

```http
GET http://localhost:7000/api/employees/{empId}/modules
Authorization: Bearer <hub-access-token>
```

**Response:**
```json
[
  { "moduleId": "...", "name": "PMS", "displayName": "PMS — Project Workbench" },
  { "moduleId": "...", "name": "Timesheet", "displayName": "Timesheet Entry" }
]
```

---

## 7. Local Development — Sab Services Chalane Ka Tarika

### Prerequisites
- .NET 10 SDK
- Node.js 20+
- MS SQL Server 2014 (Server=Laptop-250, Windows Auth)

### Step 1 — API (Identity Provider + Core API)
```powershell
cd "d:\COE\Code Solution\MPOEmployeeHub\src\MPOEmployeeHub.Api"
dotnet run --launch-profile "http"
# Chalta hai: http://localhost:7001
# Pehli baar mein admin user + bff-client seed ho jaata hai
```

### Step 2 — YARP Gateway
```powershell
cd "d:\COE\Code Solution\MPOEmployeeHub\src\MPOEmployeeHub.Gateway"
dotnet run --launch-profile "http"
# Chalta hai: http://localhost:7000
```

### Step 3 — BFF (Next.js)
```powershell
cd "d:\COE\Code Solution\MPOEmployeeHub\frontend\bff"
npm run dev
# Chalta hai: http://localhost:3000
```

### Step 4 — Portal (React)
```powershell
cd "d:\COE\Code Solution\MPOEmployeeHub\frontend\portal"
npm run dev
# Chalta hai: http://localhost:3001
```

### Startup Order (Important!)
```
API (7001) → Gateway (7000) → BFF (3000) → Portal (3001)
```

### Test Credentials
| Field | Value |
|-------|-------|
| Email | `admin@mpo.com` |
| Password | `Admin@12345!` |
| URL | `http://localhost:3001/login` |

---

## 8. Environment Configuration

### API — `appsettings.Development.json`
```json
{
  "ConnectionStrings": {
    "MPOEmployeeHub": "Server=Laptop-250;Database=MPOEmployeeHub;Integrated Security=True;TrustServerCertificate=True;"
  }
}
```

### BFF — `frontend/bff/.env.local`
```env
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me-in-production-use-openssl-rand-hex-32

HUB_ISSUER=http://localhost:7001
HUB_CLIENT_ID=bff-client
HUB_CLIENT_SECRET=bff-secret

GATEWAY_BASE_URL=http://localhost:7000
HUB_INTROSPECT_URL=http://localhost:7001/connect/introspect
```

### Gateway — `appsettings.json` / `appsettings.Development.json`
```json
{
  "Jwt": {
    "Authority": "http://localhost:7001"
  },
  "AllowedOrigins": ["http://localhost:3000"]
}
```

---

## 9. Important Constraints & Known Issues

### SQL Server 2014 Compatibility
> [!WARNING]
> `OPENJSON` function SQL Server 2014 mein available nahi hai (yeh 2016+ mein aaya).  
> **Fix applied:** BFF ke token request mein `scope` parameter nahi bheja jaata. `AuthorizationController.cs` mein scopes directly principal pe set hote hain.  
> Agar aap `scope=...` bhejte ho, tab OpenIddict `OpenIddictScopes` table mein `OPENJSON` se query karta hai jo fail hoti hai.

### HTTP-only Dev Environment
> [!NOTE]
> Local dev mein HTTPS nahi hai. OpenIddict mein `DisableTransportSecurityRequirement()` enable hai.  
> Production pe HTTPS mandatory karna hoga — ye line hataao/comment karo.

### Refresh Token Rotation
- Access Token lifetime: **10 minutes**
- Refresh Token lifetime: **7 days**
- BFF automatically refresh karta hai jab token 60 seconds mein expire hone wala ho

---

## 10. Production Readiness Checklist

Jab production pe deploy karna ho:

- [ ] HTTPS configure karo (LetsEncrypt / internal CA)
- [ ] `DisableTransportSecurityRequirement()` hatao API ke `Program.cs` se
- [ ] `NEXTAUTH_SECRET` ko strong random value se replace karo (`openssl rand -hex 32`)
- [ ] `bff-secret` ko strong secret se replace karo
- [ ] `appsettings.Production.json` mein connection string update karo
- [ ] Gateway CORS `AllowedOrigins` mein production domain add karo
- [ ] DataSeeder production pe disable/konditioned karo
- [ ] SQL Server upgrade consider karo (2016+) for full OpenIddict support
- [ ] Serilog file sink logs directory proper permissions de do
- [ ] Development Encryption/Signing certificates ko production certs se replace karo

---

*Document generated: July 2026 | MPOEmployeeHub v1.0 | Architecture revision 3*
