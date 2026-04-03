-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create job category enum
CREATE TYPE job_category AS ENUM (
    'technology',
    'construction',
    'healthcare',
    'education',
    'agriculture',
    'transportation',
    'hospitality',
    'manufacturing',
    'retail',
    'finance',
    'consulting',
    'creative',
    'legal',
    'real_estate',
    'cleaning',
    'security',
    'logistics',
    'other'
);

-- Create job status enum
CREATE TYPE job_status AS ENUM (
    'draft',
    'open',
    'in_review',
    'assigned',
    'completed',
    'cancelled',
    'expired'
);

-- Create jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description_am TEXT,
    description_en TEXT,
    budget_min NUMERIC(12, 2) NOT NULL CHECK (budget_min >= 0),
    budget_max NUMERIC(12, 2) CHECK (budget_max >= budget_min),
    category job_category NOT NULL,
    status job_status DEFAULT 'draft',
    match_score_weighting JSONB DEFAULT '{
        "skills_weight": 0.35,
        "location_weight": 0.25,
        "experience_weight": 0.20,
        "budget_weight": 0.10,
        "availability_weight": 0.10
    }'::jsonb,
    location TEXT,
    is_remote BOOLEAN DEFAULT false,
    required_skills TEXT[] DEFAULT '{}',
    experience_level TEXT CHECK (experience_level IN ('entry', 'intermediate', 'expert', 'any')),
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bids table
CREATE TYPE bid_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'withdrawn'
);

CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    proposal TEXT NOT NULL,
    estimated_days INTEGER CHECK (estimated_days > 0),
    status bid_status DEFAULT 'pending',
    cover_letter TEXT,
    attachments TEXT[] DEFAULT '{}',
    ai_match_score DECIMAL(5, 2) CHECK (ai_match_score >= 0 AND ai_match_score <= 100),
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, bidder_id)
);

-- Create indexes for performance
CREATE INDEX idx_jobs_creator_id ON jobs(creator_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_deadline ON jobs(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_jobs_budget_range ON jobs(budget_min, budget_max);
CREATE INDEX idx_jobs_location ON jobs(location) WHERE location IS NOT NULL;
CREATE INDEX idx_jobs_remote ON jobs(is_remote) WHERE is_remote = true;

-- GIN indexes for full-text search (Amharic and English)
CREATE INDEX idx_jobs_search_amharic ON jobs USING GIN(to_tsvector('simple', COALESCE(description_am, '') || ' ' || COALESCE(title, '')));
CREATE INDEX idx_jobs_search_english ON jobs USING GIN(to_tsvector('english', COALESCE(description_en, '') || ' ' || COALESCE(title, '')));

-- JSONB index for match_score_weighting
CREATE INDEX idx_jobs_match_weighting ON jobs USING GIN(match_score_weighting);

-- Array index for required_skills
CREATE INDEX idx_jobs_required_skills ON jobs USING GIN(required_skills);

-- Bids table indexes
CREATE INDEX idx_bids_job_id ON bids(job_id);
CREATE INDEX idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_amount ON bids(amount);
CREATE INDEX idx_bids_ai_match_score ON bids(ai_match_score DESC) WHERE ai_match_score IS NOT NULL;
CREATE INDEX idx_bids_job_bidder ON bids(job_id, bidder_id);

-- Composite indexes for common queries
CREATE INDEX idx_jobs_status_category ON jobs(status, category);
CREATE INDEX idx_jobs_creator_status ON jobs(creator_id, status);
CREATE INDEX idx_bids_job_status ON bids(job_id, status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bids_updated_at
    BEFORE UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Jobs RLS Policies
CREATE POLICY "Anyone can view open jobs"
    ON jobs FOR SELECT
    USING (status = 'open');

CREATE POLICY "Users can view their own jobs"
    ON jobs FOR SELECT
    USING (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own jobs"
    ON jobs FOR UPDATE
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own jobs"
    ON jobs FOR DELETE
    USING (auth.uid() = creator_id);

CREATE POLICY "Authenticated users can create jobs"
    ON jobs FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

-- Bids RLS Policies
CREATE POLICY "Job creators can view all bids on their jobs"
    ON bids FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM jobs
        WHERE jobs.id = bids.job_id
        AND jobs.creator_id = auth.uid()
    ));

CREATE POLICY "Bidders can view their own bids"
    ON bids FOR SELECT
    USING (auth.uid() = bidder_id);

CREATE POLICY "Bidders can create bids on open jobs"
    ON bids FOR INSERT
    WITH CHECK (
        auth.uid() = bidder_id
        AND EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = bids.job_id
            AND jobs.status = 'open'
        )
    );

CREATE POLICY "Bidders can update their own pending bids"
    ON bids FOR UPDATE
    USING (auth.uid() = bidder_id AND status = 'pending')
    WITH CHECK (auth.uid() = bidder_id);

CREATE POLICY "Job creators can update bid status"
    ON bids FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM jobs
        WHERE jobs.id = bids.job_id
        AND jobs.creator_id = auth.uid()
    ));

-- Optional: Create a view for jobs with bid statistics
CREATE VIEW jobs_with_stats AS
SELECT 
    j.*,
    COUNT(b.id) AS total_bids,
    AVG(b.amount) AS avg_bid_amount,
    MIN(b.amount) AS min_bid_amount,
    MAX(b.amount) AS max_bid_amount,
    COUNT(b.id) FILTER (WHERE b.status = 'pending') AS pending_bids
FROM jobs j
LEFT JOIN bids b ON j.id = b.job_id
GROUP BY j.id;

-- Grant appropriate permissions (adjust as needed)
GRANT SELECT ON jobs TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON bids TO authenticated;
GRANT SELECT ON jobs_with_stats TO authenticated;
