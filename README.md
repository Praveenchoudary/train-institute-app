# 🎓 EduInstitute — Training Management System

Production-ready 3-tier application for managing students, courses, and enrollments.

---

## 🏗️ Architecture — How All Pieces Fit Together

```
INTERNET
    │
    ▼ port 80
┌─────────────────────────────────┐
│         NGINX (Reverse Proxy)    │
│                                  │
│  GET /api/* ──► backend:5000     │
│  GET /*     ──► frontend:80      │
└────────┬────────────────┬────────┘
         │                │
         ▼                ▼
┌─────────────┐  ┌──────────────────┐
│   BACKEND   │  │    FRONTEND      │
│  Node.js +  │  │  React (built)   │
│  Express    │  │  served by nginx │
│  Port 5000  │  │  Port 80         │
└──────┬──────┘  └──────────────────┘
       │
       ▼ internal only
┌─────────────┐
│  DATABASE   │
│ PostgreSQL  │
│  Port 5432  │
│ (not exposed│
│  externally)│
└─────────────┘
```

### Why this architecture?
- **Nginx** = single entry point. Only port 80 is open to the world.
- **Backend** = stateless API. Can be scaled to multiple containers.
- **Frontend** = static files only in production (no Node.js needed).
- **Database** = completely hidden inside Docker network.

---

## 📁 Complete File Structure

```
training-institute/
│
├── docker-compose.yml          ← Orchestrates all 4 services
├── .env.example                ← Copy to .env and fill in secrets
├── .gitignore
│
├── backend/                    ← Node.js + Express REST API
│   ├── Dockerfile              ← Multi-stage: deps → production
│   ├── package.json
│   └── src/
│       ├── server.js           ← App entry: middleware + routes + start
│       ├── config/
│       │   ├── database.js     ← pg.Pool connection + query() wrapper
│       │   └── logger.js       ← Winston logger
│       ├── middleware/
│       │   └── auth.middleware.js  ← JWT verify + role check
│       └── routes/
│           ├── auth.routes.js       ← /api/auth/*
│           ├── course.routes.js     ← /api/courses/*
│           ├── enrollment.routes.js ← /api/enrollments/*
│           ├── student.routes.js    ← /api/students/*
│           └── admin.routes.js      ← /api/admin/*
│
├── frontend/                   ← React 18 SPA
│   ├── Dockerfile              ← Build React → serve with nginx
│   ├── nginx.conf              ← SPA routing fix (try_files)
│   ├── package.json
│   └── src/
│       ├── index.js            ← ReactDOM.render entry
│       ├── index.css           ← All global styles
│       ├── App.js              ← Router + PrivateRoute + PublicRoute
│       ├── context/
│       │   └── AuthContext.js  ← user state, login/logout/register
│       ├── services/
│       │   └── api.js          ← Axios client, all API call functions
│       ├── components/
│       │   └── Layout.js       ← Sidebar + topbar shell
│       └── pages/
│           ├── Login.js
│           ├── Register.js
│           ├── Dashboard.js
│           ├── Courses.js      ← Course catalog + search + filter
│           ├── CourseDetail.js ← Detail + enroll button
│           ├── MyCourses.js    ← Student's enrollments with tabs
│           └── admin/
│               ├── AdminDashboard.js  ← Stats + recent activity
│               ├── AdminCourses.js    ← CRUD with modal form
│               └── AdminStudents.js   ← List + activate/deactivate
│
├── database/
│   └── migrations/
│       └── 001_schema.sql      ← Tables + triggers + 10 seed courses
│
├── nginx/
│   └── nginx.conf              ← Reverse proxy routing rules
│
└── .github/
    └── workflows/
        └── ci-cd.yml           ← test → build → push → deploy
```

---

## 🚀 How to Run (Step by Step)

### Step 1 — Prerequisites
Install: [Docker Desktop](https://docs.docker.com/get-docker/) (includes Docker Compose)

### Step 2 — Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
DB_PASSWORD=YourStrongPassword123!
JWT_SECRET=YourVeryLongRandomSecretKeyAtLeast32Characters
```

### Step 3 — Build and start
```bash
docker compose up --build
```
First run takes ~3-5 minutes (downloads images, builds React app, seeds database).

### Step 4 — Open the app
- **App**: http://localhost
- **API**: http://localhost/api/health


---

## 🔄 Docker Compose Deep Dive

```yaml
services:
  db:        PostgreSQL — auto-runs migrations on first start
  backend:   Node.js API — waits for DB health check before starting
  frontend:  React static files served by nginx
  nginx:     Reverse proxy — ONLY service with a published port (80)
```

**Service startup order:**
```
db (health check passes)
    └─► backend (starts after DB is healthy)
            └─► frontend (starts after backend)
                    └─► nginx (starts after frontend)
```

**Data persistence:**
```bash
docker compose down          # stops containers, data preserved
docker compose down -v       # ⚠ DELETES all data (wipes postgres_data volume)
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register student |
| POST | `/api/auth/login` | No | Login, get JWT |
| GET  | `/api/auth/me` | JWT | Get profile |
| POST | `/api/auth/change-password` | JWT | Change password |

### Courses (public read, admin write)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/courses` | No | List with search/filter/pagination |
| GET  | `/api/courses/:id` | No | Course details |
| POST | `/api/courses` | Admin | Create course |
| PUT  | `/api/courses/:id` | Admin | Update course |
| DELETE | `/api/courses/:id` | Admin | Soft delete |
| GET  | `/api/courses/:id/students` | Admin | Enrolled students |

### Enrollments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/enrollments` | JWT | Enroll in course |
| GET  | `/api/enrollments/my` | JWT | My enrollments |
| PUT  | `/api/enrollments/:id/progress` | JWT | Update progress |
| DELETE | `/api/enrollments/:id` | JWT | Unenroll |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/dashboard` | Admin | Stats + activity |
| PUT | `/api/admin/users/:id/toggle` | Admin | Activate/deactivate |
| PUT | `/api/admin/enrollments/:id/grade` | Admin | Assign grade |

---

## 🔐 Security

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT (expires in 7 days) |
| Password hashing | bcrypt (12 rounds) |
| Role-based access | `student` / `instructor` / `admin` |
| HTTP security headers | helmet.js |
| Rate limiting | 100 req/IP/15min |
| Input validation | express-validator |
| CORS | Whitelist frontend URL only |
| Non-root container | `nodeuser` UID 1001 |
| DB not exposed | Internal Docker network only |

---

## 🔧 Useful Commands

```bash
# Start all services
docker compose up -d --build

# Watch logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f db

# Open database shell
docker compose exec db psql -U institute_user -d institute_db

# Rebuild only the backend (after code changes)
docker compose up -d --build backend

# Reset everything (⚠ deletes all data)
docker compose down -v && docker compose up --build

# Check service health
docker compose ps
```

---

## 🚢 CI/CD Pipeline

```
git push origin main
         │
         ├─► test-backend  (Jest + real PostgreSQL)
         ├─► test-frontend (React tests + build check)
         │
         └─► build-push (Docker images → GitHub Container Registry)
                  │
                  └─► deploy (SSH → docker compose pull + up)
```

**GitHub Secrets required:**
```
SERVER_HOST      Your server IP address
SERVER_USER      SSH username (e.g. ubuntu)
SERVER_SSH_KEY   Private SSH key content
```

---

## 🗃️ Database Schema

```
users              students
──────             ────────
id                 id
first_name         user_id → users.id
last_name          enrollment_number (auto: STU-2024-00001)
email              date_of_birth
password_hash      address
role               created_at
is_active
created_at         courses           enrollments
                   ───────           ───────────
categories         id                id
──────────         title             student_id → students.id
id                 description       course_id  → courses.id
name               price             status (active/completed/cancelled)
slug               max_students      enrolled_at
description        start_date        grade
                   end_date          progress (0-100)
                   level             updated_at
                   category_id
                   instructor_id
                   is_active
```

---

If you already have a running database with no courses:
```bash
# Option 1: Reset the database (loses all data)
docker compose down -v
docker compose up --build

# Option 2: Run seed manually
docker compose exec db psql -U institute_user -d institute_db \
  -c "INSERT INTO courses(...) VALUES (...)"
```

---

## 📝 License
MIT — free to use, modify, and deploy.
