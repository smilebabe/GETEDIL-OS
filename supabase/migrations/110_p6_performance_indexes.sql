-- supabase/migrations/110_p6_performance_indexes.sql

-- =====================================================
-- MIGRATION: P6 Performance Indexes for Transactions
-- Description: Optimize payment transactions table with
-- partial indexes and materialized views for wallet balances
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- PARTIAL INDEXES FOR HIGH-TRAFFIC QUERIES
-- =====================================================

-- 1. Partial index for pending transactions (Escrow dashboard)
-- This index is tiny because it only includes pending transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
    idx_p6_transactions_pending_escrow 
ON p6_transactions(id, amount, from_user_id, to_user_id, created_at)
WHERE status = 'PENDING' AND escrow_enabled = true;

-- 2. Partial index for high-value transactions (fraud monitoring)
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
    idx_p6_transactions_high_value_pending
ON p6_transactions(from_user_id, to_user_id, amount, created_at)
WHERE amount > 10000 AND status = 'PENDING';

-- 3. Partial index for today's transactions (recent activity)
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
    idx_p6_transactions_today
ON p6_transactions(user_id, amount, status, created_at)
WHERE created_at >= CURRENT_DATE;

-- 4. Partial index for failed transactions (retry monitoring)
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
    idx_p6_transactions_failed_retry
ON p6_transactions(id, user_id, amount, error_code)
WHERE status = 'FAILED' AND retry_count < 3;

-- 5. Composite partial index for dispute resolution
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
    idx_p6_transactions_dispute_active
ON p6_transactions(id, from_user_id, to_user_id, amount, disputed_at)
WHERE dispute_status = 'OPEN' OR dispute_status = 'INVESTIGATING';

-- =====================================================
-- MATERIALIZED VIEW: User Balance
-- Prevents expensive SUM() calculations on every wallet load
-- =====================================================

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS mv_user_balances CASCADE;

-- Create materialized view for user balances
CREATE MATERIALIZED VIEW mv_user_balances AS
WITH 
-- Credits (money received)
credits AS (
    SELECT 
        to_user_id AS user_id,
        COALESCE(SUM(amount), 0) AS total_credits
    FROM p6_transactions
    WHERE status = 'COMPLETED'
        AND to_user_id IS NOT NULL
    GROUP BY to_user_id
),
-- Debits (money sent)
debits AS (
    SELECT 
        from_user_id AS user_id,
        COALESCE(SUM(amount), 0) AS total_debits
    FROM p6_transactions
    WHERE status = 'COMPLETED'
        AND from_user_id IS NOT NULL
    GROUP BY from_user_id
),
-- Escrow holds (pending amounts)
escrow_holds AS (
    SELECT 
        from_user_id AS user_id,
        COALESCE(SUM(amount), 0) AS total_escrow_held
    FROM p6_transactions
    WHERE status = 'PENDING'
        AND escrow_enabled = true
        AND from_user_id IS NOT NULL
    GROUP BY from_user_id
),
-- Pending deposits (incoming pending)
pending_deposits AS (
    SELECT 
        to_user_id AS user_id,
        COALESCE(SUM(amount), 0) AS total_pending_in
    FROM p6_transactions
    WHERE status = 'PENDING'
        AND to_user_id IS NOT NULL
    GROUP BY to_user_id
),
-- Pending withdrawals (outgoing pending)
pending_withdrawals AS (
    SELECT 
        from_user_id AS user_id,
        COALESCE(SUM(amount), 0) AS total_pending_out
    FROM p6_transactions
    WHERE status = 'PENDING'
        AND from_user_id IS NOT NULL
    GROUP BY from_user_id
)
-- Combine all balances
SELECT 
    COALESCE(c.user_id, d.user_id, e.user_id, p.user_id, w.user_id) AS user_id,
    COALESCE(c.total_credits, 0) AS total_credits,
    COALESCE(d.total_debits, 0) AS total_debits,
    COALESCE(e.total_escrow_held, 0) AS total_escrow_held,
    COALESCE(p.total_pending_in, 0) AS total_pending_in,
    COALESCE(w.total_pending_out, 0) AS total_pending_out,
    -- Available balance = credits - debits - escrow
    (COALESCE(c.total_credits, 0) - COALESCE(d.total_debits, 0) - COALESCE(e.total_escrow_held, 0)) AS available_balance,
    -- Ledger balance = credits - debits
    (COALESCE(c.total_credits, 0) - COALESCE(d.total_debits, 0)) AS ledger_balance,
    -- Pending net = pending_in - pending_out
    (COALESCE(p.total_pending_in, 0) - COALESCE(w.total_pending_out, 0)) AS pending_net,
    NOW() AS calculated_at
FROM credits c
FULL OUTER JOIN debits d ON c.user_id = d.user_id
FULL OUTER JOIN escrow_holds e ON COALESCE(c.user_id, d.user_id) = e.user_id
FULL OUTER JOIN pending_deposits p ON COALESCE(c.user_id, d.user_id, e.user_id) = p.user_id
FULL OUTER JOIN pending_withdrawals w ON COALESCE(c.user_id, d.user_id, e.user_id, p.user_id) = w.user_id;

-- Create unique index for fast lookups
CREATE UNIQUE INDEX idx_mv_user_balances_user_id ON mv_user_balances(user_id);

-- Create indexes for common queries
CREATE INDEX idx_mv_user_balances_available ON mv_user_balances(available_balance DESC);
CREATE INDEX idx_mv_user_balances_ledger ON mv_user_balances(ledger_balance DESC);

-- =====================================================
-- MATERIALIZED VIEW: Daily Transaction Summary
-- For analytics and reporting dashboards
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS mv_daily_transaction_summary CASCADE;

CREATE MATERIALIZED VIEW mv_daily_transaction_summary AS
SELECT 
    DATE(created_at) AS transaction_date,
    COUNT(*) AS total_transactions,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_transactions,
    COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_transactions,
    COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_transactions,
    SUM(amount) FILTER (WHERE status = 'COMPLETED') AS total_volume,
    AVG(amount) FILTER (WHERE status = 'COMPLETED') AS avg_transaction_amount,
    COUNT(DISTINCT from_user_id) AS unique_senders,
    COUNT(DISTINCT to_user_id) AS unique_receivers,
    SUM(amount) FILTER (WHERE status = 'COMPLETED' AND amount > 10000) AS high_value_volume,
    SUM(fee_amount) AS total_fees_collected,
    AVG(processing_time_seconds) AS avg_processing_time
FROM p6_transactions
GROUP BY DATE(created_at)
ORDER BY transaction_date DESC;

CREATE UNIQUE INDEX idx_mv_daily_summary_date ON mv_daily_transaction_summary(transaction_date);

-- =====================================================
-- MATERIALIZED VIEW: User Transaction Summary
-- For user profile pages and trust score calculations
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS mv_user_transaction_summary CASCADE;

CREATE MATERIALIZED VIEW mv_user_transaction_summary AS
SELECT 
    user_id,
    transaction_type,
    COUNT(*) AS total_transactions,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    MIN(created_at) AS first_transaction,
    MAX(created_at) AS last_transaction,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS successful_transactions,
    COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_transactions,
    SUM(amount) FILTER (WHERE status = 'COMPLETED') AS successful_volume
FROM (
    SELECT from_user_id AS user_id, 'SENT' AS transaction_type, amount, status, created_at
    FROM p6_transactions
    UNION ALL
    SELECT to_user_id AS user_id, 'RECEIVED' AS transaction_type, amount, status, created_at
    FROM p6_transactions
) AS all_transactions
WHERE user_id IS NOT NULL
GROUP BY user_id, transaction_type;

CREATE UNIQUE INDEX idx_mv_user_summary_user_type ON mv_user_transaction_summary(user_id, transaction_type);

-- =====================================================
-- REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- =====================================================

-- Function to refresh user balances view
CREATE OR REPLACE FUNCTION refresh_mv_user_balances()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_balances;
    RETURN NULL;
END;
$$;

-- Function to refresh daily summary (call via cron job)
CREATE OR REPLACE FUNCTION refresh_mv_daily_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_transaction_summary;
END;
$$;

-- Function to refresh user summary
CREATE OR REPLACE FUNCTION refresh_mv_user_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_transaction_summary;
    RETURN NULL;
END;
$$;

-- =====================================================
-- TRIGGERS TO AUTO-REFRESH VIEWS (OPTIONAL)
-- Uncomment if real-time balance accuracy is critical
-- =====================================================

-- Refresh user balances when transactions complete
CREATE TRIGGER trigger_refresh_balances_after_transaction
AFTER INSERT OR UPDATE OF status ON p6_transactions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_mv_user_balances();

-- Refresh user summary after significant changes
CREATE TRIGGER trigger_refresh_user_summary
AFTER INSERT OR UPDATE OF status ON p6_transactions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_mv_user_summary();

-- =====================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =====================================================

-- Covering index for wallet balance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
    idx_p6_transactions_covering_balance
ON p6_transactions(user_id, status, amount, created_at)
INCLUDE (transaction_type, fee_amount);

-- Index for date-range queries (common in reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
    idx_p6_transactions_date_range
ON p6_transactions(created_at DESC, status, amount)
WHERE created_at > NOW() - INTERVAL '90 days';

-- Bloom index for multi-column filtering (advanced)
CREATE EXTENSION IF NOT EXISTS bloom;
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
    idx_p6_transactions_bloom
ON p6_transactions USING bloom(status, transaction_type, currency)
WHERE created_at > NOW() - INTERVAL '30 days';

-- =====================================================
-- QUERY PERFORMANCE MONITORING VIEWS
-- =====================================================

-- View to monitor slow transaction queries
CREATE OR REPLACE VIEW v_p6_slow_transaction_queries AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows
FROM pg_stat_statements
WHERE query ILIKE '%p6_transactions%'
    AND mean_exec_time > 100  -- queries taking > 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- View to track index usage on p6_transactions
CREATE OR REPLACE VIEW v_p6_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS number_of_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'p6_transactions'
ORDER BY idx_scan DESC;

-- =====================================================
-- MAINTENANCE FUNCTIONS
-- =====================================================

-- Schedule daily refresh of materialized views (use pg_cron or external scheduler)
CREATE OR REPLACE FUNCTION maintenance_refresh_p6_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Refresh daily summary at 1 AM
    PERFORM refresh_mv_daily_summary();
    
    -- Refresh user balances every hour during peak times
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_balances;
    
    -- Refresh user summary every hour
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_transaction_summary;
    
    -- Log maintenance
    INSERT INTO p6_maintenance_log (view_name, refreshed_at)
    VALUES ('ALL_P6_VIEWS', NOW());
END;
$$;

-- Create maintenance log table
CREATE TABLE IF NOT EXISTS p6_maintenance_log (
    id SERIAL PRIMARY KEY,
    view_name TEXT NOT NULL,
    refreshed_at TIMESTAMPTZ NOT NULL,
    rows_affected INT DEFAULT 0,
    duration_ms INT
);

-- =====================================================
-- ANALYZE TABLES FOR UPDATED STATISTICS
-- =====================================================

-- Update statistics for query planner
ANALYZE p6_transactions;
ANALYZE mv_user_balances;
ANALYZE mv_daily_transaction_summary;
ANALYZE mv_user_transaction_summary;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant access to materialized views
GRANT SELECT ON mv_user_balances TO authenticated, anon;
GRANT SELECT ON mv_daily_transaction_summary TO authenticated;
GRANT SELECT ON mv_user_transaction_summary TO authenticated;
GRANT SELECT ON v_p6_slow_transaction_queries TO authenticated_admin;
GRANT SELECT ON v_p6_index_usage TO authenticated_admin;

-- =====================================================
-- NOTES FOR DEPLOYMENT
-- =====================================================
-- 
-- 1. Run this migration during low-traffic periods
-- 2. Monitor refresh times for materialized views
-- 3. Set up pg_cron or external scheduler for regular refreshes
-- 4. Consider using CONCURRENTLY for production refreshes
-- 5. Monitor index sizes with: 
--    SELECT pg_size_pretty(pg_indexes_size('p6_transactions'));
--
-- Rollback:
-- DROP INDEX IF EXISTS idx_p6_transactions_pending_escrow;
-- DROP MATERIALIZED VIEW IF EXISTS mv_user_balances CASCADE;
-- etc.
-- =====================================================
