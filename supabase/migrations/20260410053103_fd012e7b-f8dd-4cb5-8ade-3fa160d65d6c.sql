
-- Enable extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily cleanup at midnight UTC
SELECT cron.schedule(
  'cleanup-storage-trash',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://egyeyrjxlvblveijmkky.supabase.co/functions/v1/cleanup-trash',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVneWV5cmp4bHZibHZlaWpta2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTMwOTksImV4cCI6MjA5MDYyOTA5OX0.pwEAcHZ_N42PA47Rlp3J7_5mkOQ0TcQahR5xGwS736Q"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
