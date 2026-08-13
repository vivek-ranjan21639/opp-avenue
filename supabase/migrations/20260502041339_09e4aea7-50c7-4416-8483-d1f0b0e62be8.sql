-- 1) Extend analytics event enum
ALTER TYPE public.analytics_event_type ADD VALUE IF NOT EXISTS 'featured_impression';
ALTER TYPE public.analytics_event_type ADD VALUE IF NOT EXISTS 'featured_click';