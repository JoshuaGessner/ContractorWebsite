# All Terrain Development Website

Production-oriented Next.js website for an earthwork and landscaping business with:

- Branded modern/camo + equipment visual theme
- Estimate request form with photo/video attachment uploads
- Server-side validation, anti-spam controls, and rate limiting
- Prisma-backed lead storage
- First-visit admin setup + login protected admin dashboard
- Batch estimate export/delete with forced CSV backups on deletes

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma ORM (`sqlite` default, easy to move to Postgres)
- S3-compatible object storage using signed upload URLs

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template and set values:

```bash
cp .env.example .env
```

3. Generate Prisma client and run migration:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

4. Run development server:

```bash
npm run dev
```

## Admin Security

- Admin setup is first-visit only (`/admin/setup`).
- Database enforces a single admin account (no duplicates can be created).
- Admin session cookie is `HttpOnly`, `SameSite=Strict`, and `Secure` in production.
- `AUTH_SECRET` is required in production.

## Core Routes

- `/` public marketing + estimate form + portfolio
- `/admin` authenticated dashboard of estimate requests
- `/admin/setup` first-visit admin account creation
- `/admin/login` admin sign-in
- `POST /api/uploads/sign` signed object-upload URL generation
- `POST /api/estimates` estimate submission endpoint

## Docker (Self-Hosted)

1. Create Docker env file:

```bash
cp .env.docker.example .env.docker
```

2. Set a strong `AUTH_SECRET` and your storage/database values in `.env.docker`.

3. Build and run:

```bash
docker compose up -d --build
```

4. Access app on high default localhost port:

- `http://localhost:43871`

You can override with `APP_PORT` in `.env.docker`.

## Production Notes

- Set a strong `AUTH_SECRET` (required).
- Use private bucket + CDN/public read strategy suitable to your platform.
- If S3 env values are placeholders, uploads automatically save to local `public/uploads` for dev.
- Replace in-memory rate limiter with Redis/Upstash for multi-instance deployments.
- Migrate `DATABASE_URL` to managed Postgres in production.
