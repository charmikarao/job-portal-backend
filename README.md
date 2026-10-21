# Job Portal Backend API

A secure, role-based REST API for a Job Portal built with **Node.js**, **Express.js**, and **MongoDB**. Job Seekers can discover and apply for jobs, Employers can create and manage job postings, and Admins can manage the platform.

This is a **backend-only** project — no frontend, payment system, or email service is included.

---

## Technology Stack

| Layer                  | Technology                     |
|-------------------------|---------------------------------|
| Runtime                 | Node.js                        |
| Framework                | Express.js                     |
| Database                | MongoDB                        |
| ODM                      | Mongoose                       |
| Authentication           | JWT                             |
| Password Security        | bcrypt-compatible hashing (`bcryptjs`) |
| Auth Storage             | httpOnly Cookie                |
| Validation               | express-validator              |
| API Testing              | Postman                        |
| Configuration             | Environment Variables (`.env`) |

---

## 1. Project Setup

### Prerequisites
- Node.js 18+
- A running MongoDB instance (local install or a cloud cluster such as MongoDB Atlas)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file from the template
cp .env.example .env

# 3. Edit .env and set your own values, especially:
#    MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
```

### Running the server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000` (or whatever `PORT` you set).

### Creating the first Admin account

There is intentionally **no public "register as Admin" endpoint** — only Job Seekers and Employers can self-register, matching the project's role definitions. Instead, run the seed script once to create the first Admin using the `ADMIN_*` values in your `.env`:

```bash
npm run seed:admin
```

You can then log in as that Admin via `POST /api/auth/login`.

---

## 2. User Roles

| Role       | Responsibility                                                                 |
|------------|---------------------------------------------------------------------------------|
| Job Seeker | Creates an account, maintains a profile, browses jobs, and applies for jobs.    |
| Employer   | Creates and manages job postings and reviews applications for their own jobs.  |
| Admin      | Manages users and jobs; has platform-level access to maintain the system.      |

---

## 3. Authentication & Security

- Passwords are hashed with bcrypt-style hashing before being stored — plain-text passwords are never saved.
- On successful login, a **JWT** is generated and stored in an **httpOnly cookie** (`token`), so it cannot be accessed via client-side JavaScript.
- `protect` middleware verifies the JWT on every protected route (it also accepts an `Authorization: Bearer <token>` header as a fallback for API clients that can't rely on a cookie jar).
- `authorize(...roles)` middleware enforces role-specific access after `protect`.
- Passwords/password hashes are never included in any API response (enforced via a Mongoose `toJSON` transform and `select: false` on the field).
- All secrets (JWT secret, Mongo connection string) are read from environment variables, never hard-coded.
- Incoming request bodies are validated with `express-validator` before touching the database.
- Ownership checks ensure an Employer can only modify their own jobs and view applications only for jobs they own, and a Job Seeker cannot view another user's applications.

---

## 4. Database Design

| Model         | Purpose                                                                   |
|----------------|-----------------------------------------------------------------------------|
| **User**       | Stores account, authentication, role, and profile information.             |
| **Job**        | Stores job posting information and a reference to the Employer who created it. |
| **Application**| Stores the relationship between a Job Seeker and a Job, plus application-specific data. |

### Reference relationships
- `Job.employer` → `User` (the Employer who posted it)
- `Application.job` → `Job`
- `Application.applicant` → `User` (the Job Seeker)

References are used here because Jobs and Applications each have their own identity and lifecycle, and are queried independently and at scale (e.g. "all open jobs," "all applications for a job") — embedding them inside the User document would make those queries awkward and bloat the parent document.

### Embedded documents (design exercise)
- **`User.skills`** (array of strings), **`User.education`**, and **`User.experience`** are embedded directly inside the `User` document. This data belongs entirely to one profile, has no independent identity or lifecycle, and is almost always read and updated together with the rest of the profile — a textbook case for embedding.
- **`Job.salaryRange`** (`{ min, max, currency }`) is embedded inside `Job` for the same reason: it's always read/written as part of the job posting itself.

This mirrors the guiding principle: *embed when data belongs naturally to its parent and is usually read/updated together; reference when the related data has its own identity, lifecycle, or is shared/queried independently.*

### Preventing duplicate applications
`Application` has a unique compound index on `{ job, applicant }`, so a Job Seeker cannot apply to the same job twice — enforced both in application logic and at the database level as a safety net.

---

## 5. API Overview

All routes are prefixed with `/api`. 🔒 = requires authentication. Role in parentheses = also requires that role.

### Auth (`/api/auth`)
| Method | Endpoint         | Access               | Description                          |
|--------|-------------------|------------------------|----------------------------------------|
| POST   | `/register`       | Public                | Register as a Job Seeker or Employer  |
| POST   | `/login`          | Public                | Log in, receive JWT via httpOnly cookie |
| POST   | `/logout`         | 🔒                    | Clear the authentication cookie        |
| GET    | `/me`             | 🔒                    | View your own profile                  |
| PUT    | `/me`             | 🔒                    | Update your own profile                |

### Jobs (`/api/jobs`)
| Method | Endpoint                | Access                | Description                                   |
|--------|---------------------------|-------------------------|--------------------------------------------------|
| GET    | `/`                       | Public                  | List all open jobs (supports `search`, `location`, `employmentType`, `page`, `limit`) |
| GET    | `/:id`                    | Public                  | View a single job                              |
| POST   | `/`                       | 🔒 (Employer)           | Create a new job posting                       |
| GET    | `/employer/my-jobs`       | 🔒 (Employer)           | View your own job postings                     |
| PUT    | `/:id`                    | 🔒 (Employer, owner)    | Update your own job posting                    |
| DELETE | `/:id`                    | 🔒 (Employer, owner)    | Delete your own job posting                    |

### Applications (`/api/applications`)
| Method | Endpoint             | Access                  | Description                                  |
|--------|------------------------|---------------------------|--------------------------------------------------|
| POST   | `/:jobId`             | 🔒 (Job Seeker)          | Apply for a job                                |
| GET    | `/my-applications`    | 🔒 (Job Seeker)          | View your submitted applications and their status |
| GET    | `/job/:jobId`         | 🔒 (Employer, owner)     | View applications received for one of your jobs |
| PUT    | `/:id/status`         | 🔒 (Employer, owner)     | Update an application's status                 |

### Admin (`/api/admin`)
| Method | Endpoint               | Access          | Description                                |
|--------|--------------------------|-------------------|-----------------------------------------------|
| GET    | `/users`                | 🔒 (Admin)       | View all registered users                     |
| GET    | `/users/:id`            | 🔒 (Admin)       | View a user by ID                             |
| PUT    | `/users/:id/status`     | 🔒 (Admin)       | Update a user's status (`active`/`suspended`) |
| DELETE | `/users/:id`            | 🔒 (Admin)       | Delete a user (and clean up related data)     |
| GET    | `/jobs`                 | 🔒 (Admin)       | View all job postings                         |
| GET    | `/jobs/:id`             | 🔒 (Admin)       | View a job posting by ID                      |
| DELETE | `/jobs/:id`             | 🔒 (Admin)       | Remove an inappropriate or invalid job posting |

A lightweight `GET /api/health` endpoint is also included for quick liveness checks.

---

## 6. Postman Testing

Import `postman_collection.json` into Postman. It contains 5 folders:

1. **Auth** — register (Job Seeker & Employer), login (each role), get/update profile, logout.
2. **Jobs** — public browsing plus full Employer CRUD.
3. **Applications** — apply, view your applications, employer review, status updates.
4. **Admin** — user and job management.
5. **Security & Negative Tests** — requests without auth, invalid tokens, wrong-role access, cross-user access attempts, and invalid input — all expected to fail with the correct status code (401/403/400).

**Suggested test flow:**
1. Run *Register Job Seeker* and *Register Employer* (each also logs you in and stores the cookie).
2. Run `npm run seed:admin` once, then use *Login (Admin)*.
3. Log in as the Employer, run *Create Job*, and copy the returned job `_id` into the `jobId` collection variable.
4. Log in as the Job Seeker and run *Apply For Job*, then *Apply For Same Job Again* to confirm duplicate prevention (expect 400).
5. Log back in as the Employer to view and update the application's status.
6. Log in as Admin to browse/manage users and jobs.
7. Work through the **Security & Negative Tests** folder to confirm access control is enforced correctly.

Postman automatically stores and resends the httpOnly cookie for requests to the same `baseUrl`, so you don't need to copy tokens manually between requests in the same session.

---

## 7. Project Structure

```
job-portal-backend/
├── server.js                  # Entry point: loads env, connects DB, starts server
├── src/
│   ├── app.js                 # Express app: middleware & route wiring
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   ├── Job.js
│   │   └── Application.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── jobController.js
│   │   ├── applicationController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── applicationRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   ├── auth.js             # JWT verification (protect)
│   │   ├── role.js              # Role-based access control (authorize)
│   │   ├── validate.js          # express-validator result handler
│   │   └── errorHandler.js      # Centralized error handling + 404 handler
│   ├── validators/
│   │   ├── authValidators.js
│   │   ├── jobValidators.js
│   │   └── applicationValidators.js
│   └── utils/
│       ├── ApiError.js
│       ├── asyncHandler.js
│       ├── generateToken.js
│       └── seedAdmin.js
├── postman_collection.json
├── .env.example
├── .gitignore
└── package.json
```

---

## 8. Notes on Scope

Per the project brief, this implementation deliberately excludes a frontend, payment processing, and email/notification services. All effort is focused on clean API design, authentication/authorization, database modeling, validation, and testability.

**Next stage:** AI Integration to Backend.
