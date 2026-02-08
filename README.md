# Clean Service

A **NestJS** backend built with **Clean Architecture** and **CQRS**. It provides authentication, user profiles, and role-based access with a clear separation of domain, application, and infrastructure so the codebase stays maintainable and testable as the business grows.

---

## What This Repo Solves

### Domain & Business Problems

| Problem | How This Repo Addresses It |
|--------|-----------------------------|
| **Business rules scattered across HTTP and DB code** | **Domain layer** holds entities and pure business logic (e.g. “can this user be created?”, “is this user an admin?”). No frameworks or DB here—only rules that matter to the product. |
| **Hard to change storage or APIs without breaking logic** | **Repository interfaces** live in the domain; concrete implementations (e.g. Mongoose) live in infrastructure. You can swap MongoDB for another store or add new entrypoints without touching domain or application use cases. |
| **Registration = Auth + Profile in one transaction is brittle** | **CQRS + Saga**: `CreateAuthUserCommand` creates the auth record and publishes `AuthUserCreatedEvent`; a **saga** reacts and runs `CreateProfileCommand`. If profile creation fails, a **compensation saga** runs `DeleteAuthUserCommand` so you don’t end up with auth without profile. |
| **Sensitive data (e.g. email) in DB at rest** | **Infrastructure**: Auth model encrypts email (AES-256-CBC) on write and uses a **blind index** (HMAC) for search, so storage and indexes don’t expose plaintext emails. |
| **Inconsistent API responses and errors** | **Application layer**: Global exception filter and response interceptor shape errors and success payloads (codes, messages, requestId) so clients get a predictable contract. |
| **Unclear where to put new features** | **Layered structure**: New “write” flows → commands + handlers (+ optional events/sagas). New “read” flows → application services + repositories. New business rules → domain services or entities. New endpoints → API controllers + DTOs. |

### For Developers

- **Onboarding**: The folder structure and dependency rule (domain ← application ← infrastructure / API) tell you where each concept belongs.
- **Testing**: Domain and application logic can be unit-tested with mocks for repositories; infrastructure can be tested with real or in-memory DB.
- **Evolution**: Add new auth providers, new aggregates, or new delivery mechanisms (e.g. GraphQL, message handlers) without rewriting core business logic.

---

## Architecture Overview

The project follows **Clean Architecture** (dependency rule: inner layers do not depend on outer layers) plus **CQRS** for write flows.

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                      API (HTTP)                           │
                    │  Controllers, DTOs, validation, versioning, Swagger      │
                    └───────────────────────────┬─────────────────────────────┘
                                                 │
                    ┌────────────────────────────▼─────────────────────────────┐
                    │                 APPLICATION (Use Cases)                   │
                    │  Services, Command Handlers, Events, Sagas, Guards,        │
                    │  Filters, Interceptors                                    │
                    └────────────────────────────┬─────────────────────────────┘
                                                 │
                    ┌────────────────────────────▼─────────────────────────────┐
                    │                    DOMAIN (Core)                          │
                    │  Entities, Repository Interfaces, Domain Services,       │
                    │  Enums — no Nest, no DB, no HTTP                         │
                    └────────────────────────────┬─────────────────────────────┘
                                                 │
                    ┌────────────────────────────▼─────────────────────────────┐
                    │                 INFRASTRUCTURE (Adapters)                 │
                    │  Mongoose models, Repository implementations, DB,        │
                    │  Health checks, Logger                                   │
                    └─────────────────────────────────────────────────────────┘
```

- **Domain**: Defines *what* the system does (entities, rules, repository contracts). No imports from application or infrastructure.
- **Application**: Orchestrates use cases; uses domain entities and repository *interfaces*; dispatches commands and events. Implementations of repositories are injected (e.g. via Nest `@Inject('IAuthRepository')`).
- **Infrastructure**: Implements repositories (Mongoose), persistence, and cross-cutting concerns (health, logging). Depends on domain (and application only for Nest wiring).
- **API**: HTTP surface; translates requests into DTOs and calls application services or (indirectly) command bus. Depends on application, not on infrastructure or domain details.

---

## Key Capabilities

- **Auth**: Registration (email/password), login, logout, JWT access + refresh tokens, change password, Google OAuth 2.0 (initiate + callback).
- **Profiles**: Create profile (via saga after registration), get/update own profile, list profiles; admin-only “list admins” and “get user by id”.
- **Security**: Passwords hashed (bcrypt); email encrypted at rest with blind index for search; role-based guards (user/admin); throttling on auth endpoints; optional Helmet.
- **Observability**: Request ID and structured logging middleware; global exception filter; Prometheus metrics; Terminus health (memory; optional HTTP ping).
- **API**: REST under `/api/v1/...`; Swagger at `/api/docs` (non-production); consistent success/error response shape.

---

## Tech Stack

| Area | Technology |
|------|------------|
| Runtime | Node.js |
| Framework | NestJS 11 |
| Language | TypeScript 5.x |
| Database | MongoDB (Mongoose 9) |
| Auth | Passport (JWT, Local, Google OAuth 2.0), JWT access/refresh |
| CQRS / Events | @nestjs/cqrs (commands, events, sagas) |
| Validation | class-validator, class-transformer |
| API Docs | Swagger (OpenAPI) |
| Observability | Terminus (health), Prometheus, custom logger |

---

## Project Structure

```
src/
├── api/                    # HTTP layer (controllers, DTOs)
│   ├── controllers/        # auth, profile, hello
│   └── dto/                # request/response DTOs per context
├── application/            # Use cases, CQRS, cross-cutting
│   ├── auth/              # Auth commands, handlers, events, sagas, strategies, guards
│   ├── profile/            # Profile commands, handlers, events, module
│   ├── filters/            # Global exception filter
│   ├── interceptors/       # Logging, response shaping
│   ├── middlewere/        # Request ID, logger
│   ├── services/          # AuthService, ProfileService, ResponseService, LoggerService
│   └── interfaces/        # e.g. authenticated request type
├── domain/                 # Core business (no framework/DB)
│   ├── entities/          # AuthUser, Profile, Role enum
│   ├── interfaces/        # IAuthRepository, IProfileRepository
│   └── services/           # AuthDomainService, ProfileDomainService (pure rules)
├── infrastructure/         # Adapters and technical details
│   ├── database/           # Mongo connection, providers
│   ├── health/             # Terminus health checks
│   ├── logger/             # Logger module
│   ├── models/             # Mongoose schemas (Auth, Profile)
│   └── repository/         # AuthRepository, ProfileRepository (implement interfaces)
├── app.module.ts           # Root module (API, application, infra, global filter/interceptor)
├── constants.ts            # Env-derived config (DB, JWT, Google, encryption)
└── main.ts                 # Bootstrap, global prefix, versioning, Swagger
```

---

## Getting Started

### Prerequisites

- Node.js (LTS, e.g. 20+)
- MongoDB (local or Atlas)
- (Optional) Google OAuth client for Google login

### Install

```bash
npm install
```

### Environment

Create a `.env` in the project root. Required and optional variables:

```env
# Server
PORT=4000
NODE_ENV=development

# MongoDB (required for DB operations)
MONGODB_URI=mongodb://localhost:27017/clean_service

# JWT (use strong secrets in production)
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRATION_TIME=3600s
JWT_REFRESH_EXPIRATION_TIME=7d

# Email encryption (required for auth with email/password)
# AES-256 key: 32 bytes = 64 hex chars. Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
EMAIL_ENCRYPTION_KEY=<64-hex-char-key>
EMAIL_BLIND_INDEX_SECRET=<any-secret-string>

# Google OAuth (optional; omit to disable Google login)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
```

### Run

```bash
# Development (watch mode)
npm run start:dev

# Production build and run
npm run build
npm run start:prod
```

- API base: `http://localhost:4000/api/v1`
- Health: `http://localhost:4000/health`
- Swagger: `http://localhost:4000/api/docs` (when `NODE_ENV !== 'production'`)

---

## Main API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/auth/register` | Register (email/password), returns tokens + profileId | No |
| POST | `/api/v1/auth/login` | Login, returns tokens | No |
| POST | `/api/v1/auth/logout` | Invalidate refresh token | JWT |
| POST | `/api/v1/auth/change-password` | Change password | JWT |
| POST | `/api/v1/auth/refresh-token` | New access token from refresh token | No (body) |
| GET | `/api/v1/auth/google` | Redirect to Google OAuth | No |
| GET | `/api/v1/auth/google/redirect` | Google callback, returns tokens | No |
| GET | `/api/v1/auth/:id` | Get user by id | JWT (admin) |
| DELETE | `/api/v1/auth/:id` | Delete user | JWT (admin) |
| GET | `/api/v1/profile/all` | List profiles | JWT (admin) |
| GET | `/api/v1/profile/admins` | List admins | JWT (admin) |
| POST | `/api/v1/profile` | Create profile (or use registration flow) | JWT |
| GET | `/api/v1/profile/:id` | Get profile by id | JWT |
| PUT | `/api/v1/profile/me` | Update current user's profile | JWT |

---

## For Developers: Where to Put What

- **New business rule** (e.g. “user must have verified email to do X”)  
  → Domain service or entity logic in `domain/`.

- **New use case** (e.g. “forgot password”)  
  → Application: add method on `AuthService` (and optionally a command/handler if you want CQRS). Use existing repository interfaces.

- **New write flow with side effects** (e.g. “when order is placed, reserve inventory”)  
  → Application: command, handler, event, and optionally a saga in `application/`.

- **New repository method** (e.g. `findByRole`)  
  → Add to interface in `domain/interfaces/repositories/`, then implement in `infrastructure/repository/`.

- **New HTTP endpoint**  
  → API: controller + DTO in `api/controllers/` and `api/dto/`. Call application services or command bus.

- **New external service or DB**  
  → Infrastructure: new module and providers; inject via interface/token in application layer.

Keeping this mapping consistent keeps the architecture clear and the domain stable while you add features.

---

## Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

---

## License

UNLICENSED (or set as needed for your organization).
