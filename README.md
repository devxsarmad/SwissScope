# SwissScope

A personal Swiss tech job targeting tool. Implementation currently covers **Chunk 1: Prisma schema and PostgreSQL setup** and **Chunk 2: SwissDevJobs fetch/log scraper**.

## Local setup

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

## Schema

The schema lives at `swissscope-backend/src/prisma/schema.prisma`.

- `Company`: unique name, ID, timestamps, and related jobs. Name uniqueness is case-sensitive; ingestion will need consistent name normalization. This is a simple company identity rule for the personal tool.
- `Job`: company relation, title, description, technology string array, optional location and workload, unique posting URL, scrape timestamp, and record timestamps.

One company can have many jobs. The company relation is required and deleting a company that still has jobs is blocked. Posting URLs prevent duplicate rows for the same URL; separate boards can still have separate URLs for the same vacancy. Workload preserves source text such as `80–100%`. Missing technology data is an empty array. `scrapedAt` defaults to insertion time; the ingestion chunk will explicitly refresh it on subsequent scrapes.

Indexes support company, location, and scrape-date queries. Match scores and status tracking will be added in their designated chunks.

## Manual check

`npm run db:status` should report that the database schema is up to date. `npm run db:studio` opens the empty Company and Job tables for inspection. No scraper, API, or frontend is included yet.

To check defaults, unique keys, and company relationships against the Docker database, run from the backend folder:

```sh
docker compose exec -T postgres psql -U swissscope -d swissscope -v ON_ERROR_STOP=1 < src/prisma/check-schema.sql
```

The check creates temporary fixture rows inside a transaction and rolls them back. With an existing PostgreSQL installation, run the same file using `psql -h 127.0.0.1 -U swissscope -d swissscope -v ON_ERROR_STOP=1 -f src/prisma/check-schema.sql` (adjust host and port as needed).

## Scraper Check

Chunk 2 adds a TypeScript SwissDevJobs scraper that fetches postings and logs normalized rows only. It does not save anything to PostgreSQL yet.

Run it from the backend folder:

```sh
npm run scrape:swissdevjobs
```

The scraper tries the SwissDevJobs public API and RSS feed first. During verification, direct requests to `swissdevjobs.ch` redirected to JobCopilot/security pages, so the command falls back to the public SwissDevJobs Telegram feed through a reader endpoint and logs normalized job rows from there.

The next chunk, after confirmation, connects the scraper output to Prisma and saves jobs to PostgreSQL.

## Verification notes

Validated with Node 24.11.0 and Prisma 7.10.0: schema formatting/validation, client generation, migration against an isolated local PostgreSQL database, and the transactional schema checks. Docker Compose configuration was validated; the Docker container itself was not started during initial schema verification. Chunk 2 was typechecked with TypeScript and verified with `npm run scrape:swissdevjobs`, which logged 20 jobs.

The initial `npm audit` reports four high-severity affected packages through Prisma's `deepmerge-ts` and `mysql2` dependencies. npm's proposed automatic fix downgrades Prisma to version 6, so it was not applied. Recheck upstream fixes before extending or deploying the app; this chunk only contains local database tooling.
# SwissScope
