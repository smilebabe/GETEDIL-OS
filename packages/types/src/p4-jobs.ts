// packages/types/src/p4-jobs.ts

export enum JobStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  ASSIGNED = 'assigned',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum JobCategory {
  TECHNOLOGY = 'technology',
  CONSTRUCTION = 'construction',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  AGRICULTURE = 'agriculture',
  TRANSPORTATION = 'transportation',
  HOSPITALITY = 'hospitality',
  MANUFACTURING = 'manufacturing',
  RETAIL = 'retail',
  FINANCE = 'finance',
  CONSULTING = 'consulting',
  CREATIVE = 'creative',
  LEGAL = 'legal',
  REAL_ESTATE = 'real_estate',
  CLEANING = 'cleaning',
  SECURITY = 'security',
  LOGISTICS = 'logistics',
  OTHER = 'other',
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  INTERMEDIATE = 'intermediate',
  EXPERT = 'expert',
  ANY = 'any',
}

export enum BidStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export interface MatchScoreWeighting {
  skillsWeight: number;
  locationWeight: number;
  experienceWeight: number;
  budgetWeight: number;
  availabilityWeight: number;
}

export interface Job {
  id: string;
  creatorId: string;
  title: string;
  descriptionAm?: string;
  descriptionEn?: string;
  budgetMin: number;
  budgetMax?: number;
  category: JobCategory;
  status: JobStatus;
  matchScoreWeighting: MatchScoreWeighting;
  location?: string;
  isRemote: boolean;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  matchScore?: number;
  totalBids?: number;
}

export interface ApplicantBid {
  id: string;
  jobId: string;
  bidderId: string;
  amount: number;
  proposal: string;
  estimatedDays: number;
  status: BidStatus;
  coverLetter?: string;
  attachments: string[];
  aiMatchScore?: number;
  reviewedAt?: Date;
  reviewerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobWithBidStats extends Job {
  totalBids: number;
  avgBidAmount?: number;
  minBidAmount?: number;
  maxBidAmount?: number;
  pendingBids: number;
}

export interface BidWithApplicant extends ApplicantBid {
  applicantName: string;
  applicantTrustScore: number;
  applicantAvatar?: string;
}

export interface CreateJobInput {
  title: string;
  descriptionAm?: string;
  descriptionEn?: string;
  budgetMin: number;
  budgetMax?: number;
  category: JobCategory;
  location?: string;
  isRemote?: boolean;
  requiredSkills?: string[];
  experienceLevel?: ExperienceLevel;
  deadline?: Date;
  matchScoreWeighting?: Partial<MatchScoreWeighting>;
}

export interface UpdateJobInput {
  title?: string;
  descriptionAm?: string;
  descriptionEn?: string;
  budgetMin?: number;
  budgetMax?: number;
  category?: JobCategory;
  status?: JobStatus;
  location?: string;
  isRemote?: boolean;
  requiredSkills?: string[];
  experienceLevel?: ExperienceLevel;
  deadline?: Date;
  matchScoreWeighting?: Partial<MatchScoreWeighting>;
}

export interface CreateBidInput {
  jobId: string;
  amount: number;
  proposal: string;
  estimatedDays: number;
  coverLetter?: string;
  attachments?: string[];
}

export interface UpdateBidInput {
  amount?: number;
  proposal?: string;
  estimatedDays?: number;
  coverLetter?: string;
  attachments?: string[];
  status?: BidStatus;
}

export interface JobFilters {
  category?: JobCategory[];
  status?: JobStatus[];
  minBudget?: number;
  maxBudget?: number;
  remoteOnly?: boolean;
  location?: string;
  requiredSkills?: string[];
  experienceLevel?: ExperienceLevel;
  creatorId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'budgetMin' | 'budgetMax' | 'matchScore';
  sortOrder?: 'asc' | 'desc';
}

export interface JobApplication {
  bidId: string;
  jobId: string;
  jobTitle: string;
  jobCategory: JobCategory;
  jobLocation?: string;
  jobIsRemote: boolean;
  amount: number;
  proposal: string;
  estimatedDays: number;
  status: BidStatus;
  aiMatchScore?: number;
  appliedAt: Date;
  updatedAt: Date;
}

export interface JobWithTopBids extends Job {
  topBids: ApplicantBid[];
  topBidCount: number;
}

export interface JobSearchResult {
  jobs: Job[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export interface RecommendationRequest {
  userId: string;
  limit?: number;
  offset?: number;
  preferredCategories?: JobCategory[];
  minBudget?: number;
  maxBudget?: number;
  remoteOnly?: boolean;
  location?: string;
  requiredSkills?: string[];
}

export interface RecommendationResponse {
  jobs: Job[];
  totalCount: number;
  hasMore: boolean;
  recommendationsGeneratedAt: Date;
}

export interface JobBidSummary {
  jobId: string;
  jobTitle: string;
  totalBids: number;
  pendingBids: number;
  acceptedBid?: ApplicantBid;
  averageBidAmount: number;
  bidRange: {
    min: number;
    max: number;
  };
}

export interface EmployerDashboardStats {
  activeJobs: number;
  totalApplications: number;
  pendingReviews: number;
  completedJobs: number;
  totalSpent: number;
  averageRating: number;
}

export interface ApplicantDashboardStats {
  activeApplications: number;
  acceptedBids: number;
  completedJobs: number;
  totalEarned: number;
  averageRating: number;
  successRate: number;
}

export interface JobMatchScore {
  jobId: string;
  jobTitle: string;
  matchScore: number;
  breakdown: {
    skillsMatch: number;
    locationMatch: number;
    experienceMatch: number;
    budgetMatch: number;
    availabilityMatch: number;
  };
}

export interface BulkJobResponse {
  jobs: Job[];
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

export interface JobAnalytics {
  totalJobs: number;
  jobsByStatus: Record<JobStatus, number>;
  jobsByCategory: Record<JobCategory, number>;
  averageBudget: number;
  averageBidsPerJob: number;
  fillRate: number;
  averageTimeToFill: number;
  topSkills: Array<{ skill: string; count: number }>;
}

export interface BidAnalytics {
  totalBids: number;
  bidsByStatus: Record<BidStatus, number>;
  averageBidAmount: number;
  acceptanceRate: number;
  averageMatchScore: number;
  topBidders: Array<{ bidderId: string; count: number; totalAmount: number }>;
}

export type JobEvent =
  | { type: 'JOB_CREATED'; payload: { jobId: string; creatorId: string; title: string } }
  | { type: 'JOB_UPDATED'; payload: { jobId: string; changes: Partial<Job> } }
  | { type: 'JOB_CLOSED'; payload: { jobId: string; reason: 'filled' | 'expired' | 'cancelled' } }
  | { type: 'BID_SUBMITTED'; payload: { bidId: string; jobId: string; bidderId: string; amount: number } }
  | { type: 'BID_ACCEPTED'; payload: { bidId: string; jobId: string; bidderId: string } }
  | { type: 'BID_REJECTED'; payload: { bidId: string; jobId: string; bidderId: string; reason?: string } }
  | { type: 'JOB_ASSIGNED'; payload: { jobId: string; assignedTo: string; bidId: string } }
  | { type: 'JOB_COMPLETED'; payload: { jobId: string; completedBy: string; rating?: number } };

export interface JobValidationError {
  field: string;
  message: string;
  code: string;
}

export interface JobValidationResult {
  isValid: boolean;
  errors: JobValidationError[];
  warnings: JobValidationError[];
}
