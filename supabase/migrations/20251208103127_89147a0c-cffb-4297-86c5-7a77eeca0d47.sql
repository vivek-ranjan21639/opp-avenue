-- Update delete_expired_jobs function to hard delete instead of soft delete
CREATE OR REPLACE FUNCTION public.delete_expired_jobs()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Hard delete jobs where deadline has passed by at least 1 day
    DELETE FROM jobs 
    WHERE deleted_at IS NULL 
      AND deadline IS NOT NULL 
      AND deadline < CURRENT_DATE - INTERVAL '1 day';

    -- Hard delete jobs without deadline that are older than 30 days
    DELETE FROM jobs 
    WHERE deleted_at IS NULL
      AND deadline IS NULL 
      AND created_at < (CURRENT_DATE - INTERVAL '30 days');
      
    -- Also hard delete any previously soft-deleted jobs
    DELETE FROM jobs 
    WHERE deleted_at IS NOT NULL;
END;
$function$;