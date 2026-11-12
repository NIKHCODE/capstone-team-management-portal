# Capstone Team Management Portal

A full-stack web application for managing capstone team registrations, student memberships, mentor assignments and registration verification.

The system combines **MySQL 8.0**, **Redis 7**, **Next.js** and **Ed25519 digital signatures** to provide reliable registration management, database-backed integrity and cryptographic verification.

## Key Features

### 1. Team Registration Management
- Student registration and authentication.
- Team creation and member management.
- Support for incomplete and complete registrations.
- Automatic team status calculation.
- One student can belong to only one team.
- Teams can contain up to four students.

### 2. Coordinator Dashboard
- View and manage all team registrations.
- Assign, change and unassign mentors.
- Remove individual team members.
- Search and filter teams.
- Monitor registration completion rates.
- Visualise mentor workload.
- Analyse department-wise participation.

### 3. Database Management — MySQL
- Relational database with primary keys, foreign keys and constraints.
- Transaction-based registration operations.
- Triggers for automatic team status updates.
- Stored procedures and user-defined functions.
- Views for registration summaries.
- Advanced SQL queries using joins, aggregations, subqueries and CTEs.
- Database backup and restoration support.

### 4. Redis Caching
Redis is integrated to cache student team information and reduce repeated database queries.

- MySQL remains the primary source of truth.
- Redis stores cached team information.
- Cache entries use a five-minute TTL.
- Cache invalidation occurs after relevant coordinator updates.
- Database fallback is used when cached information is unavailable.

### 5. Cryptographic Registration Verification

The system implements an application-specific digital registration certificate using SHA-256 and Ed25519.

**Certificate generation:**
1. Construct a canonical representation of the completed team registration.
2. Generate a SHA-256 digest.
3. Sign the digest using an Ed25519 private key.
4. Store the digest, signature and certificate version in MySQL.

**Certificate verification:**
1. Retrieve the current registration information.
2. Reconstruct the canonical payload.
3. Recalculate its SHA-256 digest.
4. Compare the digest with the stored value.
5. Verify the Ed25519 signature using the public key.

The system also supports:
- Certificate versioning.
- Idempotent certificate issuance.
- Public verification endpoint.
- Detection of modifications to signed registration data.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Next.js App Router API routes |
| Relational Database | MySQL 8.0 |
| NoSQL / Caching | Redis 7 |
| Authentication | bcryptjs, cookie-based sessions |
| Cryptography | Node.js Crypto, SHA-256, Ed25519 |
| Styling | Tailwind CSS |
| Runtime | Node.js |
| Containerisation | Docker |

## Architecture

```text
                  STUDENT / COORDINATOR
                           |
                           v
                    NEXT.JS FRONTEND
                           |
                           v
                    NEXT.JS API ROUTES
                           |
             +-------------+-------------+
             |                           |
             v                           v
        AUTHENTICATION              BUSINESS LOGIC
             |                           |
             v                           v
          MySQL                    MySQL DATABASE
                                         |
                              +----------+----------+
                              |                     |
                              v                     v
                         REDIS CACHE          CRYPTOGRAPHY
                                              SHA-256
                                              Ed25519
                                                   |
                                                   v
                                           TEAM_SIGNATURE
```

## Project Structure

```text
capstone-team-management-portal/
|
|-- database/
|   |-- advanced_queries.sql
|   |-- capstone_portal_backup.sql
|   |-- procedures_functions.sql
|   |-- queries.sql
|   |-- restore_test.sql
|
|-- keys/
|   |-- public.pem
|   |-- private.pem          # Excluded from Git
|
|-- scripts/
|   |-- create-coordinator.mjs
|
|-- src/
|   |-- app/
|   |   |-- api/
|   |   |-- coordinator/
|   |   |-- dashboard/
|   |   |-- login/
|   |   |-- registration/
|   |   |-- signup/
|   |
|   |-- lib/
|       |-- auth.ts
|       |-- db.ts
|       |-- redis.ts
|       |-- signature.ts
|
|-- import_tvd_data.sql
|-- package.json
|-- README.md
```

## Prerequisites

- Node.js
- npm
- MySQL 8.0
- Redis 7
- Docker Desktop (for running Redis through Docker)

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/NIKHCODE/capstone-team-management-portal.git
cd capstone-team-management-portal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure MySQL

Create the `capstone_portal` database and configure the required tables, constraints, triggers, views, procedures and functions.

The repository contains SQL scripts and a database backup under the `database/` directory.

### 4. Configure Redis

Start Redis using Docker:

```bash
docker run -d --name capstone-redis -p 6379:6379 redis:7-alpine
```

### 5. Configure environment variables

Create a `.env.local` file in the project root.

```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=capstone_portal
REDIS_URL=redis://localhost:6379

ED25519_PRIVATE_KEY_PATH=./keys/private.pem
ED25519_PUBLIC_KEY_PATH=./keys/public.pem
```

Use your own MySQL credentials. Generate your own Ed25519 key pair for a fresh deployment.

**Security:** Never commit `.env.local` or `keys/private.pem` to GitHub. The public key can be committed.

### 6. Start the application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Important API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Student account registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Current user information |
| GET | `/api/mentors` | Retrieve mentors |
| GET | `/api/students` | Retrieve student information |
| POST | `/api/teams` | Create a team |
| GET | `/api/my-team` | Retrieve current student's team |
| POST | `/api/my-team/members` | Add a team member |
| GET | `/api/coordinator/teams` | Retrieve team registrations |
| PATCH | `/api/coordinator/teams` | Update mentor assignment |
| DELETE | `/api/coordinator/teams` | Remove a team member |
| POST | `/api/coordinator/teams/[teamRecordId]/certificate` | Issue or retrieve a digital certificate |
| GET | `/api/verify/team/[teamRecordId]` | Public certificate verification |

## Cryptographic Verification

The cryptographic module uses Node.js built-in cryptographic functionality.

- Hashing algorithm: SHA-256
- Digital signature algorithm: Ed25519
- Signature storage: MySQL
- Verification: Public-key signature verification

The certificate verifies the integrity and authenticity of the signed registration data relative to the corresponding key pair. It does not provide an independent trusted timestamp authority.

## Testing and Validation

The project has been tested for:

- Student authentication and session handling.
- Team registration and membership constraints.
- Coordinator mentor assignment and member removal.
- MySQL transaction behaviour.
- Redis cache retrieval and invalidation.
- Database backup and restoration.
- SQL procedures, functions and triggers.
- Digital certificate issuance.
- Idempotent certificate generation.
- Successful public signature verification.
- Tamper detection through modified registration data.
- Successful verification after restoring original data.

## Security Considerations

- Passwords are hashed using bcrypt.
- Sessions use hashed tokens.
- Role-based access control separates student and coordinator operations.
- Database credentials are stored in environment variables.
- The Ed25519 private key is excluded from version control.
- Public verification does not require coordinator authentication.

## Future Enhancements

- QR-code-based certificate verification.
- Certificate history interface.
- Improved deployment and production monitoring.
- Expanded audit logging.

## Repository

GitHub: https://github.com/NIKHCODE/capstone-team-management-portal
