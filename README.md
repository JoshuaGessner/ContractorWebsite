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
cd ContractorWebsite
```

### 3) One-command deploy (automatic env setup)

Run this single command:

```bash
./scripts/deploy-docker.sh
```

What it does automatically:

- Creates `.env.docker` if missing (from `.env.docker.example`)
- Generates `AUTH_SECRET` if missing or still placeholder
- Starts the app with `docker compose up -d --build`

Alternative command (same behavior):

```bash
npm run deploy:docker
```

To update an already deployed server (pull latest + rebuild + restart):

```bash
./scripts/deploy-docker.sh --update
```

Or with the dedicated helper script:

```bash
./scripts/update-and-restart.sh
```

Or:

```bash
npm run deploy:update
```

### 4) Open the app

```text
http://localhost:43871
```

For domain/external access, ensure `.env.docker` has:

```bash
APP_HOST=0.0.0.0
```

Then confirm your firewall/security group allows inbound traffic to your `APP_PORT`.

### 5) First admin setup

- Open `/admin/setup` in your browser
- Create your first admin account
- After setup, use `/admin/login` to access admin

### 6) Optional manual env setup

If you prefer managing env values yourself, do this before deploy:

```bash
cp .env.docker.example .env.docker
```

Then edit `.env.docker`.

At minimum, set:

- `DATABASE_URL` (default is fine to start)

Optional (if using S3-compatible storage):

- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT`
- `S3_PUBLIC_BASE_URL`

### 7) Useful Docker commands

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

Update current deployment from git + redeploy:

```bash
./scripts/deploy-docker.sh --update
```

Update + restart using helper script:

```bash
./scripts/update-and-restart.sh
```

This script attempts a git update first and automatically falls back to restart/redeploy-only if update mode is not applicable.

Reset admin login credentials:

```bash
./scripts/reset-admin-login.sh
```

Or pass values non-interactively:

```bash
./scripts/reset-admin-login.sh newUsername 'newStrongPasswordHere'
```

Change host port by setting `APP_PORT` in `.env.docker` (default is `43871`).

Control bind interface with `APP_HOST`:

- `APP_HOST=0.0.0.0` allows domain/external traffic
- `APP_HOST=127.0.0.1` restricts access to localhost only

### AUTH_SECRET explained (simple)

`AUTH_SECRET` is the key used to sign admin session cookies.

- Think of it as the password the server uses to prove “this login cookie is real”
- If this value changes, existing admin sessions are invalidated (users must log in again)
- It should be long, random, and kept private

For one-command deploy, it is auto-generated if missing.

If you want to set it yourself, generate one with:

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

If omitted, Docker startup also auto-generates and persists one to `/app/data/auth_secret`.

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

If you lose admin credentials after setup, reset them with `./scripts/reset-admin-login.sh`.

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
