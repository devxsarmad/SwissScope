export type JobStatus = "NEW" | "SHORTLISTED" | "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED" | "ARCHIVED";

export type OutreachStatus = "NOT_STARTED" | "CONTACTED" | "FOLLOWED_UP" | "RESPONDED" | "INTERVIEWING" | "CLOSED";

export type MatchScore = {
  score: number;
  matched: Array<{
    label: string;
    matchedKeywords: string[];
    weight: number;
  }>;
  missing: string[];
};

export type Company = {
  id: string;
  name: string;
  jobCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  location: string | null;
  url: string;
  workload: string | null;
  status: JobStatus;
  postedAt: string | null;
  postedAgeText: string | null;
  applicantCount: number | null;
  outreachStatus: OutreachStatus;
  notes: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactLinkedIn: string | null;
  appliedAt: string | null;
  followUpAt: string | null;
  lastContactedAt: string | null;
  interviewNotes: string | null;
  scrapedAt: string;
  createdAt: string;
  updatedAt: string;
  company: Company;
  matchScore: MatchScore;
};

export type JobsResponse = {
  count: number;
  jobs: Job[];
};

export type CompaniesResponse = {
  count: number;
  companies: Company[];
};
