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

## Quick Start (Primary: Docker Compose)

1. Create Docker environment file:

```bash
cp .env.docker.example .env.docker
```

2. Set required values in `.env.docker`:

- `AUTH_SECRET` (required, use a long random value)
- `DATABASE_URL` (default SQLite volume is fine to start)
- S3 settings if using object storage (`S3_*` + `S3_PUBLIC_BASE_URL`)

3. Build and start:

```bash
docker compose up -d --build
```

4. Open the app:

```text
http://localhost:43871
```

5. Check logs if needed:

```bash
docker compose logs -f app
```

6. Stop services:

```bash
docker compose down
```

Set `APP_PORT` in `.env.docker` to change the host port.

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

- In production, set a strong `AUTH_SECRET`
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
