-- ══════════════════════════════════════════════════════════════════
--  001_schema.sql — Full Schema + Seed Data
--
--  This file runs AUTOMATICALLY on first container start because
--  it is mounted at /docker-entrypoint-initdb.d/
--
--  Re-running: only runs on a FRESH database (empty volume).
--  To reset: docker compose down -v  then  docker compose up
-- ══════════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Categories ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Users (all roles: student / instructor / admin) ───────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  role          VARCHAR(20)  NOT NULL DEFAULT 'student'
                  CHECK (role IN ('student','instructor','admin')),
  is_active     BOOLEAN      DEFAULT TRUE,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ── Students (one-to-one extension of users) ──────────────────────
CREATE TABLE IF NOT EXISTS students (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_number  VARCHAR(20) UNIQUE,
  date_of_birth      DATE,
  address            TEXT,
  emergency_contact  VARCHAR(255),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate enrollment number after INSERT
CREATE OR REPLACE FUNCTION gen_enrollment_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.enrollment_number :=
    'STU-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(NEW.id::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enrollment_number
  BEFORE INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION gen_enrollment_number();

-- ── Courses ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(255) NOT NULL,
  description    TEXT         NOT NULL,
  price          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_students   INTEGER       NOT NULL DEFAULT 30,
  start_date     DATE          NOT NULL,
  end_date       DATE          NOT NULL,
  duration_hours INTEGER,
  level          VARCHAR(20)  DEFAULT 'beginner'
                   CHECK (level IN ('beginner','intermediate','advanced')),
  category_id    INTEGER REFERENCES categories(id),
  instructor_id  INTEGER REFERENCES users(id),
  is_active      BOOLEAN DEFAULT TRUE,
  thumbnail_url  TEXT,
  syllabus       TEXT,
  prerequisites  TEXT,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX idx_courses_active   ON courses(is_active);
CREATE INDEX idx_courses_category ON courses(category_id);

-- ── Enrollments ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id           SERIAL PRIMARY KEY,
  student_id   INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id    INTEGER NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  status       VARCHAR(20) DEFAULT 'active'
                 CHECK (status IN ('active','completed','cancelled','suspended')),
  enrolled_at  TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  grade        VARCHAR(5),
  progress     INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);
CREATE INDEX idx_enroll_student ON enrollments(student_id);
CREATE INDEX idx_enroll_course  ON enrollments(course_id);


-- ══════════════════════════════════════════════════════════════════
--  SEED DATA
-- ══════════════════════════════════════════════════════════════════

-- ── Categories ────────────────────────────────────────────────────
INSERT INTO categories(name, slug, description) VALUES
  ('Web Development',    'web-dev',      'HTML, CSS, JavaScript, React, Node.js'),
  ('Data Science',       'data-science', 'Python, Machine Learning, Statistics'),
  ('Cybersecurity',      'cybersec',     'Network Security, Ethical Hacking, OWASP'),
  ('Cloud & DevOps',     'cloud-devops', 'AWS, Docker, Kubernetes, CI/CD'),
  ('Mobile Development', 'mobile',       'React Native, Flutter, iOS, Android'),
  ('Database Design',    'databases',    'SQL, PostgreSQL, MongoDB, Redis')
ON CONFLICT DO NOTHING;

-- ── Users ──────────────────────────────────────────────────────────
-- Admin password  : Admin@123456
-- Instructor pwd  : Instructor@123
-- Student pwd     : Student@123
-- All hashes generated with bcrypt rounds=12

INSERT INTO users(first_name, last_name, email, password_hash, role) VALUES
  -- Admin
  ('System', 'Admin',
   'admin@institute.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLyFU5D.g8O3hJK',
   'admin'),
  -- Instructors
  ('Ahmed',   'Hassan',
   'ahmed@institute.com',
   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'instructor'),
  ('Sarah',   'Johnson',
   'sarah@institute.com',
   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'instructor'),
  -- Students
  ('Ali',     'Mohamed',
   'ali@student.com',
   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'student'),
  ('Nour',    'Khalil',
   'nour@student.com',
   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'student')
ON CONFLICT DO NOTHING;

-- ── Student profiles ───────────────────────────────────────────────
INSERT INTO students(user_id)
  SELECT id FROM users WHERE role='student'
  ON CONFLICT DO NOTHING;

-- ── Courses ────────────────────────────────────────────────────────
-- Uses subquery to resolve instructor/category IDs safely
INSERT INTO courses(title, description, price, max_students, start_date, end_date, duration_hours, level, category_id, instructor_id, syllabus, prerequisites) VALUES

  -- Web Development
  ('Complete React & Node.js Bootcamp',
   'Master full-stack web development from scratch. Build real-world projects using React 18, Node.js, Express, and PostgreSQL. Includes REST APIs, authentication, deployment, and Docker.',
   299.00, 40,
   CURRENT_DATE + INTERVAL '7 days',
   CURRENT_DATE + INTERVAL '97 days',
   120, 'beginner',
   (SELECT id FROM categories WHERE slug='web-dev'),
   (SELECT id FROM users WHERE email='ahmed@institute.com'),
   'Week 1-2: HTML/CSS Fundamentals | Week 3-4: JavaScript ES6+ | Week 5-7: React 18 | Week 8-10: Node.js & Express | Week 11-12: PostgreSQL & Deployment',
   'Basic computer skills. No prior programming experience needed.'),

  ('Advanced JavaScript & TypeScript',
   'Deep dive into modern JavaScript patterns, TypeScript, async programming, design patterns, and performance optimization. For developers who already know JS basics.',
   199.00, 30,
   CURRENT_DATE + INTERVAL '14 days',
   CURRENT_DATE + INTERVAL '74 days',
   80, 'intermediate',
   (SELECT id FROM categories WHERE slug='web-dev'),
   (SELECT id FROM users WHERE email='sarah@institute.com'),
   'Closures & Prototypes | Async/Await & Promises | TypeScript Fundamentals | Design Patterns | Testing with Jest',
   'Basic JavaScript knowledge (variables, functions, arrays).'),

  ('React Native Mobile Development',
   'Build cross-platform iOS and Android apps with React Native and Expo. State management with Redux Toolkit, navigation, camera, maps, and publishing to app stores.',
   249.00, 25,
   CURRENT_DATE + INTERVAL '21 days',
   CURRENT_DATE + INTERVAL '111 days',
   90, 'intermediate',
   (SELECT id FROM categories WHERE slug='mobile'),
   (SELECT id FROM users WHERE email='ahmed@institute.com'),
   'React Native Basics | Navigation | Redux Toolkit | Device APIs | App Store Deployment',
   'Must know React fundamentals.'),

  -- Data Science
  ('Python for Data Science & ML',
   'From Python basics to Machine Learning models. Covers NumPy, Pandas, Matplotlib, Scikit-learn, and an introduction to deep learning with TensorFlow. Hands-on datasets throughout.',
   349.00, 35,
   CURRENT_DATE + INTERVAL '5 days',
   CURRENT_DATE + INTERVAL '125 days',
   150, 'beginner',
   (SELECT id FROM categories WHERE slug='data-science'),
   (SELECT id FROM users WHERE email='sarah@institute.com'),
   'Python Basics | NumPy & Pandas | Data Visualization | Regression & Classification | Clustering | Intro to Deep Learning',
   'High school mathematics. No programming experience needed.'),

  ('Advanced Machine Learning',
   'Production-grade ML: feature engineering, hyperparameter tuning, ensemble methods, neural networks, model deployment with Flask/FastAPI, and MLOps basics with Docker.',
   399.00, 20,
   CURRENT_DATE + INTERVAL '30 days',
   CURRENT_DATE + INTERVAL '150 days',
   160, 'advanced',
   (SELECT id FROM categories WHERE slug='data-science'),
   (SELECT id FROM users WHERE email='sarah@institute.com'),
   'Feature Engineering | Ensemble Methods | CNNs & RNNs | Model Serving | MLOps',
   'Python proficiency. Basic ML knowledge (linear regression, classification).'),

  -- Cloud & DevOps
  ('Docker & Kubernetes for Developers',
   'Everything about containerization and orchestration. Dockerfile best practices, Docker Compose, Kubernetes pods/deployments/services, Helm charts, and CI/CD integration.',
   279.00, 30,
   CURRENT_DATE + INTERVAL '10 days',
   CURRENT_DATE + INTERVAL '70 days',
   70, 'intermediate',
   (SELECT id FROM categories WHERE slug='cloud-devops'),
   (SELECT id FROM users WHERE email='ahmed@institute.com'),
   'Docker Fundamentals | Multi-Stage Builds | Docker Compose | Kubernetes Architecture | Deployments & Services | Helm | CI/CD with GitHub Actions',
   'Basic Linux command line. Experience with one programming language.'),

  ('AWS Cloud Practitioner to Solutions Architect',
   'Start from zero and reach AWS Solutions Architect Associate level. EC2, S3, RDS, Lambda, VPC, IAM, CloudFormation, and real infrastructure projects.',
   329.00, 35,
   CURRENT_DATE + INTERVAL '3 days',
   CURRENT_DATE + INTERVAL '123 days',
   130, 'beginner',
   (SELECT id FROM categories WHERE slug='cloud-devops'),
   (SELECT id FROM users WHERE email='sarah@institute.com'),
   'AWS Core Services | Networking & VPC | Security & IAM | Serverless | Infrastructure as Code | Cost Optimization',
   'Basic IT literacy. No AWS experience needed.'),

  -- Cybersecurity
  ('Ethical Hacking & Penetration Testing',
   'Hands-on cybersecurity course covering OWASP Top 10, network scanning, exploitation with Metasploit, web app hacking, and writing professional penetration test reports.',
   299.00, 20,
   CURRENT_DATE + INTERVAL '18 days',
   CURRENT_DATE + INTERVAL '108 days',
   100, 'intermediate',
   (SELECT id FROM categories WHERE slug='cybersec'),
   (SELECT id FROM users WHERE email='ahmed@institute.com'),
   'Reconnaissance | Scanning & Enumeration | Exploitation | Post-Exploitation | Web App Attacks | Report Writing',
   'Basic networking knowledge (TCP/IP, DNS, HTTP). Linux experience helpful.'),

  -- Databases
  ('PostgreSQL for Application Developers',
   'Master PostgreSQL from basics to advanced. Indexing strategies, query optimization, stored procedures, partitioning, replication, and integration with Node.js and Python.',
   149.00, 40,
   CURRENT_DATE + INTERVAL '1 days',
   CURRENT_DATE + INTERVAL '61 days',
   60, 'beginner',
   (SELECT id FROM categories WHERE slug='databases'),
   (SELECT id FROM users WHERE email='sarah@institute.com'),
   'SQL Fundamentals | Joins & Aggregations | Indexes & Performance | Stored Procedures & Triggers | Replication | Node.js Integration',
   'No prior database experience needed.'),

  -- Free Course
  ('Git & GitHub for Beginners',
   'Complete Git version control course. Branching strategies, pull requests, resolving merge conflicts, GitHub Actions basics, and team collaboration workflows. Completely free!',
   0.00, 100,
   CURRENT_DATE,
   CURRENT_DATE + INTERVAL '30 days',
   20, 'beginner',
   (SELECT id FROM categories WHERE slug='web-dev'),
   (SELECT id FROM users WHERE email='ahmed@institute.com'),
   'Git Basics | Branching | Merging | Remote Repositories | GitHub Flow | GitHub Actions Intro',
   'Absolutely none — perfect for complete beginners.')

ON CONFLICT DO NOTHING;
