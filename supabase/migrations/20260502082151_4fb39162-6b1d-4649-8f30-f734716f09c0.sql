
-- Daily cleanup of expired jobs.
-- Rule:
--   * If expires_at IS NOT NULL and expires_at < now() => delete
--   * If expires_at IS NULL and COALESCE(posted_at, created_at) < now() - 30 days => delete
CREATE OR REPLACE FUNCTION public.delete_expired_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.j_jobs
  WHERE
    (expires_at IS NOT NULL AND expires_at < now())
    OR (expires_at IS NULL AND COALESCE(posted_at, created_at) < now() - interval '30 days');
END;
$$;

-- Schedule it daily at 02:00 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete-expired-jobs-daily') THEN
    PERFORM cron.unschedule('delete-expired-jobs-daily');
  END IF;
  PERFORM cron.schedule(
    'delete-expired-jobs-daily',
    '0 2 * * *',
    $cmd$ SELECT public.delete_expired_jobs(); $cmd$
  );
END $$;
