-- Run against a migrated development database with psql -v ON_ERROR_STOP=1.
-- All fixture rows are rolled back, including when psql exits on an error.
BEGIN;

DO $$
DECLARE
  company_id text := 'schema-check-company-' || txid_current();
  job_id text := 'schema-check-job-' || txid_current();
  posting_url text := 'https://example.invalid/jobs/' || txid_current();
BEGIN
  INSERT INTO "Company" (id, name, "updatedAt")
  VALUES (company_id, company_id, now());

  INSERT INTO "Job" (id, "companyId", title, description, url, "updatedAt")
  VALUES (job_id, company_id, 'React developer', 'React and PostgreSQL', posting_url, now());

  IF NOT EXISTS (
    SELECT 1 FROM "Job"
    WHERE id = job_id AND "techStack" = ARRAY[]::text[]
      AND status = 'NEW'::"JobStatus"
      AND "postedAt" IS NULL
      AND "applicantCount" IS NULL
      AND "outreachStatus" = 'NOT_STARTED'::"OutreachStatus"
      AND notes IS NULL AND "contactName" IS NULL AND "contactEmail" IS NULL
      AND "contactLinkedIn" IS NULL AND "appliedAt" IS NULL AND "followUpAt" IS NULL
      AND "lastContactedAt" IS NULL AND "interviewNotes" IS NULL
      AND workload IS NULL AND location IS NULL AND "scrapedAt" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Job defaults failed';
  END IF;

  BEGIN
    INSERT INTO "Job" (id, "companyId", title, description, url, "updatedAt")
    VALUES (job_id || '-duplicate', company_id, 'Duplicate', '', posting_url, now());
    RAISE EXCEPTION 'Duplicate URL was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO "Company" (id, name, "updatedAt")
    VALUES (company_id || '-duplicate', company_id, now());
    RAISE EXCEPTION 'Duplicate company name was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  BEGIN
    UPDATE "Job" SET "companyId" = company_id || '-missing' WHERE id = job_id;
    RAISE EXCEPTION 'Missing company reference was accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    DELETE FROM "Company" WHERE id = company_id;
    RAISE EXCEPTION 'Company with a job was deleted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  RAISE NOTICE 'Schema checks passed: defaults, unique keys, relation, restricted deletion';
END $$;

ROLLBACK;
