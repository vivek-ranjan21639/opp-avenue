-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule the delete_expired_jobs function to run daily at midnight UTC
SELECT cron.schedule(
  'delete-expired-jobs-daily',
  '0 0 * * *',
  $$SELECT public.delete_expired_jobs();$$
);