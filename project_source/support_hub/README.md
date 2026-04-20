# support_hub

Shared Next.js business application for managing support tickets and invoking AI resolver backends.

This app is common for:

- `project_source/beginer_source`
- `project_source/standard_source`

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Drizzle ORM + drizzle-kit
- Neon PostgreSQL

## Quick start

```bash
cd project_source/support_hub
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open <http://localhost:3000>.

## Required environment variables

- `DATABASE_URL` - Neon connection string
- `RESOLVER_BASE_URL` - e.g. `http://localhost:8000` (change this when switching resolver backend)
- `NEXT_PUBLIC_APP_NAME` - UI title

## Beginner resolver integration

Start beginner resolver API:

```bash
cd project_source/beginer_source
python3 -m src.app.main --serve-api --host 0.0.0.0 --port 8000
```

Then in `support_hub`, set:

```bash
RESOLVER_BASE_URL=http://localhost:8000
```

Create a case and click "Resolve case" from the case detail page.

## Demo data seeding

Populate business entities and sample support cases:

```bash
npm run db:seed
```

The seed is idempotent and safe to run multiple times.

For richer demo walkthroughs mapped to all `Final_kata` required scenarios (multiple samples per scenario), use:

- `project_source/support_hub/docs/demo_case_samples.json`

You can copy each sample's `title`, `description`, `severity`, `issueCategory`, and `metadata` into the Create Case form, then run Resolve Case against your Python resolver backend.

## Auth and org assignment

- The app now uses seeded `app_users` and `user_org_memberships` for a realistic multi-org setup.
- Users authenticate via the login page (cookie-based demo auth).
- New cases auto-generate `caseId` and auto-assign `customerId` and `orgId` from the logged-in membership.
- Case visibility is org-scoped (users only see and access cases for their active org).
- Admin-only management is available at `/admin` for adding users, creating organizations, and mapping users to orgs with role assignment (`admin`, `agent`, `viewer`).

## Database schema coverage

The schema includes Final_kata-aligned entities:

- customers, organizations, enterprise accounts
- subscriptions, invoices, entitlements
- token records, SAML config, API usage
- support cases, case history, service status, incidents

Integration entities:

- `resolver_runs` for immutable invocation logs
- `support_case_ai_outcomes` for latest normalized AI outcome per case
- `resolver_providers` for provider metadata
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
