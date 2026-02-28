# Contractor Website Template

A production-oriented website template for contractors and service businesses that need to:

- showcase project work,
- collect estimate requests with attachments,
- manage testimonials and review controls,
- and run a lightweight admin workflow without extra SaaS overhead.

This project is a strong baseline for landscapers, excavators, concrete crews, roofers, painters, and similar field-service companies.

## Deployment Model (Docker First)

This template is designed to be deployed with Docker Compose first.

- Primary install/deploy path: Docker Compose (recommended for staging/production)
- Secondary path: Local Node.js runtime (for code changes and development only)

## Start-to-Finish Docker Deploy (Recommended)

If you just want to get the server running, follow these exact steps.

### 1) Install prerequisites

- Install Docker Desktop (includes Docker Compose)
- Make sure Docker is running

### 2) Clone the project

```bash
git clone https://github.com/JoshuaGessner/ContractorWebsite.git
cd ContractorWebsite/site
```

### 3) Create Docker environment file

```bash
cp .env.docker.example .env.docker
```

### 4) Edit `.env.docker`

At minimum, set these:

- `DATABASE_URL` (leave default to start with SQLite volume)

`AUTH_SECRET` options:

- Recommended: set `AUTH_SECRET` yourself in `.env.docker`
- If omitted, the Docker container now auto-generates one on first start and stores it at `/app/data/auth_secret` (persistent Docker volume)
- On next container restarts, that same saved secret is reused automatically

Optional (only if using S3-compatible storage):

- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT`
- `S3_PUBLIC_BASE_URL`

### AUTH_SECRET explained (simple)

`AUTH_SECRET` is the key used to sign admin session cookies.

- Think of it as the password the server uses to prove “this login cookie is real”
- If this value changes, existing admin sessions are invalidated (users must log in again)
- It should be long, random, and kept private

Easy ways to generate one manually:

Using OpenSSL:

```bash
openssl rand -base64 48
```

Using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Then place it in `.env.docker`:

```bash
AUTH_SECRET=your_generated_value_here
```

If you do nothing, Docker will auto-generate and persist one for you (no extra infrastructure needed).

### 5) Build and start the server

```bash
docker compose up -d --build
```

### 6) Open the app

```text
http://localhost:43871
```

### 7) First admin setup

- Open `/admin/setup` in your browser
- Create your first admin account
- After setup, use `/admin/login` to access admin

### 8) Useful Docker commands

View logs:

```bash
docker compose logs -f app
```

Check running containers:

```bash
docker compose ps
```

Stop server:

```bash
docker compose down
```

Rebuild after changes:

```bash
docker compose up -d --build
```

Change host port by setting `APP_PORT` in `.env.docker` (default is `43871`).

## What You Get

- Public marketing site with hero, services, trust section, and project portfolio
- Estimate request form with optional image/video upload support
- Testimonials pipeline with moderation controls
- Secure admin area for lead management, project updates, and review settings
- CSV export + backup-oriented deletion flow for estimates
- Rate limiting + server-side validation on public submission APIs

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite by default (easy path to Postgres)
- S3-compatible storage support via signed upload URLs (with local upload fallback)

## Local Development (Secondary)

Use this mode when actively editing code.

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

```bash
cp .env.example .env
```

3. Generate Prisma client and apply migrations:

```bash
npm run prisma:generate
npx prisma migrate deploy
```

4. Start the app:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Docker Operations

- Rebuild after dependency/code changes: `docker compose up -d --build`
- View container status: `docker compose ps`
- Run Prisma migration manually in container:

```bash
docker compose exec app npx prisma migrate deploy
```

## Admin + Lead Workflow

- First-time setup is at `/admin/setup`
- Ongoing login is at `/admin/login`
- Dashboard is at `/admin`
- Single-admin behavior is enforced at the database level
- Session cookie is `HttpOnly` and uses strict same-site settings

## API Surface (High Level)

- `POST /api/estimates` — submit estimate request
- `POST /api/uploads/sign` — issue signed upload URL for S3-compatible storage
- `POST /api/uploads` — local upload fallback flow
- `POST /api/testimonials` — submit testimonials
- `POST /api/admin/*` — authenticated admin operations

## Environment Notes

- In production, use a strong `AUTH_SECRET` (or let Docker auto-generate and persist it to `/app/data/auth_secret`)
- If S3 variables are omitted, uploads can fall back to local `public/uploads`
- For multi-instance deployments, replace in-memory rate limiting with Redis/Upstash
- For production DB reliability, migrate from SQLite to managed Postgres

## Template Customization Checklist

When adapting this starter to a new contractor brand:

- Update company name, service list, and service area copy
- Replace project photos/videos and testimonial content
- Update contact info, social links, and legal footer details
- Tune estimate form fields to match your quoting process
- Configure your preferred object storage and production database

## Recommended Git Hygiene

This repo is configured to ignore local runtime artifacts such as:

- `.env*` files
- local SQLite files (`prisma/*.db`)
- local uploaded media (`public/uploads/*`, except `.gitkeep`)

This keeps secrets and machine-specific files out of source control.
