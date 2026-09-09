# SwissScope

SwissScope is a personal Swiss tech job intelligence tool. It collects software engineering roles, normalizes the data, stores postings in PostgreSQL, and prepares them for skill-based ranking so outreach can focus on the companies that best match a modern full-stack profile.

The backend is built with TypeScript, Express, Node.js, Prisma, PostgreSQL, Axios, and Cheerio. The current implementation includes a local database setup, a SwissDevJobs scraper, durable job/company saving, a standalone keyword scoring service, and read APIs for jobs and companies.

## Architecture

The scraper layer follows a small adapter pattern:

- `BaseScraper` defines the shared `fetch`, `parse`, `normalize`, and `scrape` flow.
- Site scrapers live in `src/scrapers/sites` and only handle site-specific parsing.
- `normalizeData.ts` converts raw source data into one common job shape.
- `company.service.ts` and `job.service.ts` save normalized jobs with Prisma.
- `matchScore.service.ts` scores job text against a weighted skill keyword profile.
- Express routes expose saved jobs, companies, filters, and computed match scores.

PostgreSQL stores companies and jobs separately. Company names are unique, job URLs are unique, and repeated scraper runs update existing postings instead of creating duplicates.

## Setup

Prerequisites: Node.js 22.12+ (Node 24 LTS recommended), npm, and Docker with Compose. Run these commands from the project root:

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

The database runs at `127.0.0.1:5433`, using database/user `swissscope` and the local-only password in `.env.example`. The Compose volume preserves data when the container stops. Stop it with `docker compose down` from the backend folder.

`db:deploy` applies committed migrations. After editing the schema in a future chunk, use `npm run db:migrate -- --name describe_change`, followed by `npm run db:generate`. Commit the generated migration. Prisma 7 stores its connection URL in `prisma.config.ts` and requires explicit client generation; see the [official Prisma configuration documentation](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference).

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
- `Job`: company relation, title, description, technology string array, optional location and workload, unique posting URL, scrape timestamp, and record timestamps.

One company can have many jobs. The company relation is required and deleting a company that still has jobs is blocked. Posting URLs prevent duplicate rows for the same URL; separate boards can still have separate URLs for the same vacancy. Workload preserves source text such as `80-100%`. Missing technology data is an empty array, and `scrapedAt` refreshes when an existing posting is seen again.

Indexes support company, location, and scrape-date queries. Status tracking will be added later.

## Commands

`npm run db:status` should report that the database schema is up to date. `npm run db:studio` opens the Company and Job tables for inspection. No API or frontend is included yet.

To check defaults, unique keys, and company relationships against the Docker database, run from the backend folder:

```sh
docker compose exec -T postgres psql -U swissscope -d swissscope -v ON_ERROR_STOP=1 < src/prisma/check-schema.sql
```

The check creates temporary fixture rows inside a transaction and rolls them back. With an existing PostgreSQL installation, run the same file using `psql -h 127.0.0.1 -U swissscope -d swissscope -v ON_ERROR_STOP=1 -f src/prisma/check-schema.sql` (adjust host and port as needed).

Run the SwissDevJobs scraper without saving:

```sh
npm run scrape:swissdevjobs
```

The scraper tries the SwissDevJobs public API and RSS feed first. During verification, direct requests to `swissdevjobs.ch` redirected to JobCopilot/security pages, so the command falls back to the public SwissDevJobs Telegram feed through a reader endpoint and logs normalized job rows from there.

Run the scraper and save results to PostgreSQL:

```sh
npm run scrape:swissdevjobs:save
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
- `GET /companies`

The SwissDevJobs scraper tries the public API and RSS feed first. Direct requests to `swissdevjobs.ch` currently redirect to JobCopilot/security pages from this environment, so the command falls back to the public SwissDevJobs Telegram feed through a reader endpoint and logs normalized job rows from there.

## Verification

Validated with Node 24.11.0 and Prisma 7.10.0. The schema validates, the TypeScript code typechecks, the keyword scoring service has focused tests, and the scraper save command has been verified against local PostgreSQL. A fresh save created 20 jobs and 9 companies; a second save updated the same 20 jobs without increasing row counts. The Express API was verified locally through `/health`, `/jobs`, `/jobs/:id`, `/jobs?city=Zurich&minScore=10`, and `/companies`.

The initial `npm audit` reports four high-severity affected packages through Prisma's `deepmerge-ts` and `mysql2` dependencies. npm's proposed automatic fix downgrades Prisma to version 6, so it was not applied. Recheck upstream fixes before extending or deploying the app.
