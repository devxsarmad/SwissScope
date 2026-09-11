# SwissScope

SwissScope is a personal Swiss tech job intelligence tool. It collects Switzerland-based software engineering roles, filters them to a focused JavaScript/TypeScript full-stack and AI application profile, normalizes the data, stores postings in PostgreSQL, and ranks matches so outreach can focus on relevant companies.

The backend is built with TypeScript, Express, Node.js, Prisma, PostgreSQL, Axios, and Cheerio. The frontend is a Next.js TypeScript app with Tailwind CSS and shadcn/ui. The current implementation includes a local database setup, SwissDevJobs, jobs.ch, and jobup.ch scrapers, strict role relevance filtering, durable job/company saving, workflow status tracking, posting freshness metadata, outreach tracking, a standalone keyword scoring service, APIs for jobs and companies, and a dashboard for browsing saved roles by company, city, status, and match score.

## Architecture

The scraper layer follows a small adapter pattern:

- `BaseScraper` defines the shared `fetch`, `parse`, `normalize`, and `scrape` flow.
- Site scrapers live in `src/scrapers/sites` and only handle site-specific parsing. The JobCloud scraper reads JSON-LD from jobs.ch and jobup.ch search/detail pages.
- `normalizeData.ts` converts raw source data into one common job shape.
- `jobRelevance.service.ts` keeps scraping focused on the target stack and rejects unrelated roles before they reach the dashboard.
- `company.service.ts` and `job.service.ts` save normalized jobs with Prisma.
- `matchScore.service.ts` scores job text against a weighted skill keyword profile.
- Express routes expose saved jobs, companies, filters, computed match scores, and job status updates.
- The frontend keeps API access in `lib/api.ts`, shared response types in `lib/types.ts`, layout components in `components/layout`, job dashboard components in `components/jobs`, and shadcn primitives in `components/ui`.

PostgreSQL stores companies and jobs separately. Company names are unique, job URLs are unique, and repeated scraper runs update existing postings instead of creating duplicates.

## Target Profile

SwissScope is tuned for React.js, Next.js, TypeScript, JavaScript, Tailwind CSS, Node.js, Express.js, NestJS, PostgreSQL, MongoDB, pgvector, OpenAI APIs, LLM integration, RAG, embeddings, vector databases, tool calling, AI agents, REST APIs, GraphQL, and WebSockets.

Target roles include full-stack AI engineer, full-stack JavaScript/TypeScript developer, MERN/PERN stack developer, React/Next.js developer with Node.js, and AI application engineer using JavaScript/TypeScript.

The relevance filter rejects Python/FastAPI-first, Java, .NET, PHP, Ruby, Go, C/C++, data science, ML research, DevOps-only, mobile-only, QA, mandatory German/French/Italian, and Swiss/EU permit-only roles unless visa sponsorship is offered.

## Setup

Prerequisites: Node.js 22.12+ (Node 24 LTS recommended), npm, and Docker with Compose.

Backend setup:

```sh
cd swissscope-backend
cp .env.example .env
npm ci
docker compose up -d --wait
npm run db:validate
npm run db:deploy
npm run db:generate
npm run db:status
```

Frontend setup:

```sh
cd swissscope-frontend
cp .env.example .env.local
npm ci
npm run typecheck
npm run lint
npm run build
```

The database runs at `127.0.0.1:5433`, using database/user `swissscope` and the local-only password in `.env.example`. The Compose volume preserves data when the container stops. Stop it with `docker compose down` from the backend folder.

`db:deploy` applies committed migrations. After editing the schema, use `npm run db:migrate -- --name describe_change`, followed by `npm run db:generate`. Commit the generated migration. Prisma 7 stores its connection URL in `prisma.config.ts` and requires explicit client generation; see the [official Prisma configuration documentation](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference).

### Existing PostgreSQL instead of Docker

Connect as a local PostgreSQL administrator and create a dedicated role and database:

```sql
CREATE ROLE swissscope WITH LOGIN PASSWORD 'replace_with_a_local_password' CREATEDB;
CREATE DATABASE swissscope OWNER swissscope;
```

Set `DATABASE_URL` in `swissscope-backend/.env` to your server's connection string (percent-encode special characters in the password):

```dotenv
DATABASE_URL="postgresql://swissscope:replace_with_a_local_password@127.0.0.1:5432/swissscope?schema=public"
```

Then run the npm commands above, skipping `docker compose`. `CREATEDB` allows Prisma's development migration command to create its shadow database. A deployment-only role does not need that privilege.

## Database

The schema lives at `swissscope-backend/src/prisma/schema.prisma`.

- `Company`: unique name, ID, timestamps, and related jobs. Name uniqueness is case-sensitive, so ingestion trims names before saving.
- `Job`: company relation, title, description, technology string array, optional location and workload, workflow status, optional source posting date, optional applicant count, outreach/contact fields, unique posting URL, scrape timestamp, and record timestamps.

One company can have many jobs. The company relation is required and deleting a company that still has jobs is blocked. Posting URLs prevent duplicate rows for the same URL; separate boards can still have separate URLs for the same vacancy. Workload preserves source text such as `80-100%`. Status starts as `NEW` and can move through `SHORTLISTED`, `APPLIED`, `INTERVIEW`, `OFFER`, `REJECTED`, and `ARCHIVED`. `postedAt` stores the source posting date when the board exposes it, and `applicantCount` stays null unless a public applicant/application count is visible. Outreach fields track notes, recruiter/contact details, applied/follow-up dates, last contact date, interview notes, and outreach status. Missing technology data is an empty array, and `scrapedAt` refreshes when an existing posting is seen again.

Indexes support company, location, status, outreach status, follow-up date, posting date, and scrape-date queries.

## Commands

`npm run db:status` should report that the database schema is up to date. `npm run db:studio` opens the Company and Job tables for inspection.

To check defaults, unique keys, and company relationships against the Docker database, run from the backend folder:

```sh
docker compose exec -T postgres psql -U swissscope -d swissscope -v ON_ERROR_STOP=1 < src/prisma/check-schema.sql
```

The check creates temporary fixture rows inside a transaction and rolls them back. With an existing PostgreSQL installation, run the same file using `psql -h 127.0.0.1 -U swissscope -d swissscope -v ON_ERROR_STOP=1 -f src/prisma/check-schema.sql` (adjust host and port as needed).

Run one scraper without saving:

```sh
npm run scrape:swissdevjobs
npm run scrape:jobsch
npm run scrape:jobup
```

Run every registered scraper without saving:

```sh
npm run scrape:all
```

Run scrapers and save relevant results to PostgreSQL:

```sh
npm run scrape:swissdevjobs:save
npm run scrape:jobsch:save
npm run scrape:jobup:save
npm run scrape:all:save
```

The SwissDevJobs scraper tries the public API and RSS feed first. Direct requests to `swissdevjobs.ch` currently redirect to JobCopilot/security pages from this environment, so the command falls back to the public SwissDevJobs Telegram feed through a reader endpoint. The jobs.ch and jobup.ch scrapers read public JSON-LD from search and detail pages, including posting dates when available, then apply the same target-stack relevance filter before logging or saving rows. A command can return zero jobs when the current public results do not match the strict SwissScope profile.

Remove previously saved rows that no longer match the target profile:

```sh
npm run db:prune-irrelevant
```

To inspect saved rows:

```sh
docker compose exec postgres psql -U swissscope -d swissscope
```

Then inside `psql`:

```sql
SELECT COUNT(*) FROM "Company";
SELECT COUNT(*) FROM "Job";
```

Run type checks and service tests:

```sh
npm run typecheck
npm test
```

Start the API:

```sh
npm run dev
```

The API listens on `http://localhost:4000` by default. Set `PORT` to use a different port.

Available endpoints:

- `GET /health`
- `GET /jobs`
- `GET /jobs/:id`
- `GET /jobs?city=Zurich`
- `GET /jobs?company=Rockstar`
- `GET /jobs?minScore=10`
- `GET /jobs?status=SHORTLISTED`
- `PATCH /jobs/:id/status` with JSON body `{ "status": "APPLIED" }`
- `PATCH /jobs/:id/outreach` with notes, contact details, outreach status, and date fields
- `GET /companies`

Start the frontend from `swissscope-frontend`:

```sh
npm run dev
```

The frontend listens on `http://localhost:3000` by default and reads the backend URL from `NEXT_PUBLIC_API_URL`. The dashboard shows saved jobs, company names, locations, detected tech tags, workload text, workflow status, posting freshness, public applicant counts when available, outreach notes/contact fields on the detail page, computed match scores, mobile cards, and a desktop table. Filters support search text, city, status, and minimum score. Status dropdowns update PostgreSQL through the API and keep the dashboard state in sync.

## Verification

Validated with Node 24.11.0 and Prisma 7.10.0. The backend schema validates, the TypeScript code typechecks, the keyword scoring, relevance filter, freshness normalization, and JobCloud JSON-LD parser have focused tests, and the scraper save command has been verified against local PostgreSQL. The stricter relevance filter was verified against the current SwissDevJobs, jobs.ch, and jobup.ch feeds and removed unrelated C++, Python, PHP, mobile, and German-only rows from the local database. The Express API was verified locally through `/health`, `/jobs`, `/jobs/:id`, `/jobs?city=Zurich&minScore=10`, `/jobs?status=SHORTLISTED`, `PATCH /jobs/:id/status`, and `/companies`. The frontend passes typecheck, lint, and production build with Next.js 16 using the webpack build path, and the running dashboard was smoke-tested against the local API.

The initial `npm audit` reports four high-severity affected packages through Prisma's `deepmerge-ts` and `mysql2` dependencies. npm's proposed automatic fix downgrades Prisma to version 6, so it was not applied. Recheck upstream fixes before extending or deploying the app.
